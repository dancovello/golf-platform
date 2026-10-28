/**
 * Brings the marketing pages already saved in a database up to the wording of 28 Oct 2026
 * (the "free homepage" / "no setup fee" / "four weeks" offer is gone). The starter tool only
 * fills in pages that don't exist yet, so this is how existing pages get the change.
 * Run with:  pnpm update-marketing-wording
 * Plan and safety rules: docs/plans/staging-wording-update.md
 *
 * - It asks which database (hidden), makes you type its name, and lists every change first.
 *   Press Enter at the final question to stop: that is the dry run, nothing is written.
 * - It changes text only when it is exactly the old starter text. Reworded text is left alone
 *   and listed. Pages with unpublished changes, and draft pages, are skipped and listed.
 * - Each page is saved as a new version, so the old one is in its history (Restore in the admin).
 * - Afterwards it re-reads every page and lists any retired phrase still left.
 * Running it against PRODUCTION needs Dan's explicit approval.
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

type SavedPage = {
  id: string | number
  slug: string
  title?: string
  _status?: 'draft' | 'published'
  layout?: unknown[]
  meta?: { description?: string | null } & Record<string, unknown>
}

const main = async () => {
  console.log('Update the saved marketing pages to the new wording\n')
  await chooseDatabase('update the saved marketing pages')
  const payload = await connect()
  const { planPageUpdate, findLeftovers } = await import('../src/marketing/starter/wordingUpdate')

  // The newest version of each page, draft or published.
  let pages: SavedPage[]
  try {
    const found = await payload.find({
      collection: 'marketing-pages',
      draft: true,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    pages = found.docs as unknown as SavedPage[]
  } catch (error) {
    console.error(error)
    return fail(
      'Could not read the marketing pages. The database may not be up to date with the code: ' +
        'release the latest changes to it first.',
    )
  }
  if (pages.length === 0) fail('There are no marketing pages in this database.')

  const todo: { page: SavedPage; plan: ReturnType<typeof planPageUpdate> }[] = []
  const skipped: string[] = []
  const unchanged: string[] = []
  for (const page of pages) {
    if (page._status !== 'published') {
      skipped.push(`${page.slug}: not published, or has unpublished changes. Left alone.`)
      continue
    }
    const plan = planPageUpdate({
      slug: page.slug,
      layout: page.layout ?? [],
      metaDescription: page.meta?.description ?? undefined,
    })
    if (plan.changes.length === 0 && plan.leftovers.length === 0) {
      unchanged.push(page.slug)
      continue
    }
    todo.push({ page, plan })
  }

  for (const { page, plan } of todo) {
    console.log(`\n${page.slug}`)
    for (const change of plan.changes) {
      console.log(`  ${change.path}\n    was: ${change.from}\n    now: ${change.to}`)
    }
    for (const left of plan.leftovers) {
      console.log(`  CHECK BY HAND ${left.path}: ${left.text}`)
    }
  }
  if (unchanged.length) console.log(`\nAlready up to date: ${unchanged.join(', ')}`)
  if (skipped.length) console.log(`\nSkipped:\n  ${skipped.join('\n  ')}`)

  const writes = todo.filter(({ plan }) => plan.changes.length > 0)
  const total = writes.reduce((sum, { plan }) => sum + plan.changes.length, 0)
  if (writes.length === 0) {
    console.log('\nNothing to change.')
    process.exit(0)
  }
  console.log(`\n${total} changes on ${writes.length} pages. Each page stays published.`)
  const answer = await ask('Type "update" to make them, or press Enter to stop (dry run): ')
  if (answer !== 'update') {
    console.log('\nDry run only. Nothing was changed.')
    process.exit(0)
  }

  for (const { page, plan } of writes) {
    await payload.update({
      collection: 'marketing-pages',
      id: page.id,
      overrideAccess: true,
      draft: false,
      data: {
        layout: plan.layout,
        ...(plan.metaDescription === undefined
          ? {}
          : { meta: { ...page.meta, description: plan.metaDescription } }),
      } as never,
    })
    console.log(`Updated ${page.slug} (${plan.changes.length} changes)`)
  }

  // Read everything again, as a visitor would get it, and list any retired phrase still left.
  const after = await payload.find({
    collection: 'marketing-pages',
    draft: false,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const left = (after.docs as unknown as SavedPage[]).flatMap((page) =>
    [
      ...findLeftovers(page.layout ?? [], 'layout'),
      ...findLeftovers(page.meta?.description ?? '', 'meta.description'),
    ].map((item) => `${page.slug} ${item.path}: ${item.text}`),
  )
  if (left.length) {
    console.log(`\nDone, but ${left.length} pieces of text still use retired wording. Edit these:`)
    for (const line of left) console.log(`  ${line}`)
  } else {
    console.log('\nDone. No retired wording is left on any published page.')
  }
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
