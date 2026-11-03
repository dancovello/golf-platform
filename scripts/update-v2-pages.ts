/**
 * Brings the saved marketing pages up to the v2 designs (Figma "marketing site v2", 2 Nov 2026):
 * a new Home, "How it works" (the old Website builder page, renamed), "Who it's for", Pricing,
 * Switching to us and Book a demo are updated; "Request your homepage" is added. The starter
 * tool only fills in pages that don't exist yet, so this is how existing pages get the change.
 * Run with:  pnpm update-v2-pages
 *
 * - It asks which database (hidden) and makes you type its name. Press Enter at the final
 *   question to stop: that is the dry run, nothing is written.
 * - An updated page has its whole layout replaced with the starter copy, and is saved as a new
 *   version, so the old one is in its history (Restore in the admin). A page that is not
 *   published, or has unpublished changes, is skipped and listed.
 * - "Website builder" (/website-builder) becomes "How it works" (/how-it-works). The old address
 *   stops working: there is no page forwarding yet.
 * - Pages that don't exist yet are added as drafts, for you to publish in the admin.
 * Running it against PRODUCTION needs Dan's explicit approval.
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

type SavedPage = {
  id: string | number
  slug: string
  title?: string
  _status?: 'draft' | 'published'
  meta?: { description?: string | null } & Record<string, unknown>
}

const UPDATED = ['home', 'pricing', 'switching', 'book-a-demo'] as const

const main = async () => {
  console.log('Update the saved marketing pages to the v2 designs\n')
  await chooseDatabase('update the saved marketing pages')
  const payload = await connect()
  const { STARTER_PAGES, starterPageData } = await import('../src/marketing/starter/pages')
  const starter = (slug: string) => STARTER_PAGES.find((page) => page.slug === slug)

  const found = await payload.find({
    collection: 'marketing-pages',
    draft: true,
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const saved = new Map((found.docs as unknown as SavedPage[]).map((page) => [page.slug, page]))

  type Step = { text: string; run: () => Promise<void> }
  const steps: Step[] = []
  const skipped: string[] = []

  const replace = (existing: SavedPage, slug: string, note: string) => {
    const page = starter(slug)
    if (!page) return fail(`The starter copy has no "${slug}" page.`)
    if (existing._status !== 'published') {
      skipped.push(`${existing.slug}: not published, or has unpublished changes. Left alone.`)
      return
    }
    steps.push({
      text: `${existing.slug}: replace the layout${note}`,
      run: async () => {
        const data = starterPageData(page)
        await payload.update({
          collection: 'marketing-pages',
          id: existing.id,
          overrideAccess: true,
          draft: false,
          data: {
            title: data.title,
            slug: data.slug,
            meta: { ...existing.meta, description: data.meta.description },
            layout: data.layout,
          } as never,
        })
      },
    })
  }

  for (const slug of UPDATED) {
    const existing = saved.get(slug)
    if (existing) replace(existing, slug, '')
    else steps.push(addStep(payload, slug, starter, starterPageData))
  }

  const builder = saved.get('website-builder')
  const howItWorks = saved.get('how-it-works')
  if (builder && !howItWorks) replace(builder, 'how-it-works', ' and rename it to /how-it-works')
  else if (!howItWorks) steps.push(addStep(payload, 'how-it-works', starter, starterPageData))
  else if (builder) skipped.push('website-builder: /how-it-works already exists. Left alone.')

  for (const slug of ['who-its-for', 'request-your-homepage']) {
    if (!saved.has(slug)) steps.push(addStep(payload, slug, starter, starterPageData))
    else skipped.push(`${slug}: already exists. Left alone.`)
  }

  if (steps.length) console.log('Changes:\n  ' + steps.map((step) => step.text).join('\n  '))
  if (skipped.length) console.log(`\nSkipped:\n  ${skipped.join('\n  ')}`)
  if (steps.length === 0) {
    console.log('\nNothing to change.')
    process.exit(0)
  }
  const answer = await ask('\nType "update" to make them, or press Enter to stop (dry run): ')
  if (answer !== 'update') {
    console.log('\nDry run only. Nothing was changed.')
    process.exit(0)
  }
  for (const step of steps) {
    await step.run()
    console.log(`Done: ${step.text}`)
  }
  console.log('\nFinished. New pages are drafts: publish them in the admin when you are happy.')
  process.exit(0)
}

type Starter = typeof import('../src/marketing/starter/pages')
const addStep = (
  payload: Awaited<ReturnType<typeof connect>>,
  slug: string,
  starter: (slug: string) => Starter['STARTER_PAGES'][number] | undefined,
  starterPageData: Starter['starterPageData'],
) => {
  const page = starter(slug)
  if (!page) return fail(`The starter copy has no "${slug}" page.`)
  return {
    text: `${slug}: add as a draft`,
    run: async () => {
      await payload.create({
        collection: 'marketing-pages',
        draft: true,
        overrideAccess: true,
        data: { _status: 'draft', ...starterPageData(page) } as never,
      })
    },
  }
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
