/**
 * Finds wording the marketing site must never say (src/marketing/bannedWording.ts) in pages
 * already saved in a database, and replaces those pages' layouts with the current starter copy.
 * The starter tool only fills in pages that don't exist yet, so old text stays in a saved page
 * until this is run (launch gate item 11, launch checklist B5).
 * Run with:  pnpm fix-marketing-wording
 *
 * - It asks which database (hidden) and makes you type its name. Press Enter at the final
 *   question to stop: that is the dry run, nothing is written.
 * - Only a page that actually contains banned wording is touched, so pages Dan has edited
 *   and that are clean are left exactly as they are. A touched page has its layout replaced
 *   with the starter copy and is saved as a new version (the old one is in its history).
 * - A page that is not published, has unpublished changes, or has no starter copy is listed
 *   for a manual edit in the admin. The marketing settings are scanned and reported too.
 * Running it against PRODUCTION needs Dan's explicit approval.
 */
import { ask, chooseDatabase, connect } from './lib/prompts'

type SavedPage = {
  id: string | number
  slug: string
  _status?: 'draft' | 'published'
}

const main = async () => {
  console.log('Fix banned wording in the saved marketing pages\n')
  await chooseDatabase('fix banned wording in the saved marketing pages')
  const payload = await connect()
  const { BANNED } = await import('../src/marketing/bannedWording')
  const { STARTER_PAGES, starterPageData } = await import('../src/marketing/starter/pages')

  const hits = (value: unknown): string[] => {
    const text = JSON.stringify(value ?? {})
    return BANNED.flatMap((pattern) => text.match(pattern)?.[0] ?? [])
  }

  const found = await payload.find({
    collection: 'marketing-pages',
    draft: true,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })

  const steps: { text: string; run: () => Promise<void> }[] = []
  const manual: string[] = []
  for (const page of found.docs as unknown as (SavedPage & Record<string, unknown>)[]) {
    const bad = hits({ title: page.title, meta: page.meta, layout: page.layout })
    if (bad.length === 0) continue
    const listed = `${page.slug}: “${[...new Set(bad)].join('”, “')}”`
    const starter = STARTER_PAGES.find((s) => s.slug === page.slug)
    if (!starter) {
      manual.push(`${listed}. No starter copy for this page: edit it in the admin.`)
    } else if (page._status !== 'published') {
      manual.push(`${listed}. Not published, or has unpublished changes: edit it in the admin.`)
    } else {
      steps.push({
        text: `${listed}. Replace the layout with the starter copy`,
        run: async () => {
          const data = starterPageData(starter)
          await payload.update({
            collection: 'marketing-pages',
            id: page.id,
            overrideAccess: true,
            draft: false,
            data: {
              title: data.title,
              slug: data.slug,
              meta: { ...(page.meta as object), description: data.meta.description },
              layout: data.layout,
            } as never,
          })
        },
      })
    }
  }

  const settings = await payload.findGlobal({
    slug: 'marketing-settings',
    depth: 0,
    overrideAccess: true,
  })
  const settingsHits = hits(settings)
  if (settingsHits.length) {
    manual.push(
      `marketing settings: “${[...new Set(settingsHits)].join('”, “')}”. Edit in the admin.`,
    )
  }

  if (steps.length) console.log('Will fix:\n  ' + steps.map((s) => s.text).join('\n  '))
  if (manual.length) console.log(`\nNeeds a manual edit:\n  ${manual.join('\n  ')}`)
  if (steps.length === 0) {
    console.log(
      manual.length
        ? '\nNothing this script can fix.'
        : `\nChecked ${found.docs.length} pages and the settings: no banned wording. Nothing to change.`,
    )
    process.exit(0)
  }
  const answer = await ask('\nType "fix" to make the changes, or press Enter to stop (dry run): ')
  if (answer !== 'fix') {
    console.log('\nDry run only. Nothing was changed.')
    process.exit(0)
  }
  for (const step of steps) {
    await step.run()
    console.log(`Done: ${step.text}`)
  }
  console.log('\nFinished. Run it again to check: it should now find nothing.')
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
