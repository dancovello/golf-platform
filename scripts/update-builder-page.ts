/**
 * Swaps the old "03 · Course status" section on the stored Website builder page for the
 * "03 · Kept current" feature showcase from the starter copy (src/marketing/starter/pages.ts).
 * The starter tool leaves existing pages alone, so this is how an existing page gets the change.
 * Run with:  pnpm update-builder-page
 *
 * It asks which database (hidden), makes you type its name, shows what it will change, and asks
 * for a final "update". Running it against PRODUCTION needs Dan's explicit approval.
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  console.log('Update the Website builder page\n')
  await chooseDatabase('update the Website builder page')
  const payload = await connect()
  const { STARTER_PAGES } = await import('../src/marketing/starter/pages')

  const starter = STARTER_PAGES.find((page) => page.slug === 'website-builder')
  if (!starter) fail('The starter copy has no Website builder page.')
  const startAt = (starter as { layout: { eyebrow?: string }[] }).layout.findIndex(
    (block) => block.eyebrow === '03 · Kept current',
  )
  const newBlocks = (starter as { layout: unknown[] }).layout.slice(startAt, startAt + 2)
  if (startAt < 0 || newBlocks.length !== 2)
    fail('Could not find the new section in the starter copy.')

  const { docs } = await payload.find({
    collection: 'marketing-pages',
    where: { slug: { equals: 'website-builder' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const page = docs[0] as unknown as {
    id: string
    layout: { blockType: string; eyebrow?: string }[]
  }
  if (!page) fail('There is no Website builder page in this database.')

  const layout = page.layout
  if (layout.some((block) => block.blockType === 'mkFeatureShowcase')) {
    console.log('The page already has the feature showcase. Nothing to do.')
    process.exit(0)
  }
  const at = layout.findIndex((block) => block.eyebrow === '03 · Course status')
  if (at < 0 || layout[at + 1]?.blockType !== 'mkLiveDemo') {
    fail('Could not find the old "03 · Course status" header followed by its demo.')
  }

  console.log(
    `\nThe page has ${layout.length} blocks. Block ${at + 1} (the "03 · Course status" header)`,
  )
  console.log('and the demo after it will be replaced by the "03 · Kept current" header and the')
  console.log('feature showcase. Everything else stays. The page stays published.')
  if ((await ask('\nType "update" to go ahead: ')) !== 'update') fail('Not confirmed.')

  const updated = [...layout.slice(0, at), ...newBlocks, ...layout.slice(at + 2)]
  await payload.update({
    collection: 'marketing-pages',
    id: page.id,
    overrideAccess: true,
    draft: false,
    data: { layout: updated } as never,
  })
  console.log(`Done: replaced the demo at position ${at + 1} with the feature showcase.`)
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
