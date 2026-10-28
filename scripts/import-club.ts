/**
 * Builds a club from its content file (docs/operations/club-import.md).
 * Run with:  pnpm import-club <folder>     (the folder holds site.ts and the club's files)
 *
 * It replaces the club with the content file's short name, and refuses if that club has
 * editor accounts or an accepted agreement. Running it anywhere but your own computer needs
 * Dan's explicit approval.
 */
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  const folder = process.argv.slice(2).find((arg) => !arg.startsWith('-'))
  if (!folder) fail('Say which folder to import, e.g. pnpm import-club club-imports/cottrell')
  const dir = resolve(folder as string)
  const { default: content } = await import(pathToFileURL(resolve(dir, 'site.ts')).href)
  console.log(`Import ${content.name}\n`)
  await chooseDatabase(`replace the club "${content.slug}"`)
  const payload = await connect()
  const { importClub } = await import('../src/import/clubImport')
  try {
    const result = await importClub(payload, content, dir, (m) => console.log(`  ${m}`))
    console.log(`\nDone: ${result.pages} pages. See it at /preview/${result.slug}`)
  } catch (error) {
    // The club may be half built: fix the content file and run again to replace it.
    console.error(`\nImport stopped: ${(error as Error).message}`)
    process.exit(1)
  }
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
