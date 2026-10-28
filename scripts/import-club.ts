/**
 * Builds a club from its content file (docs/operations/club-import.md).
 * Run with:  pnpm import-club <folder>     (the folder holds site.ts and the club's files)
 *
 * It replaces the club with the content file's short name, and refuses if that club has
 * editor accounts or an accepted agreement. Running it anywhere but your own computer needs
 * Dan's explicit approval.
 *
 * For a cloud database (staging), it also asks for that environment's photo storage, so the
 * photos land where the site can show them. Every value is typed into hidden prompts and kept
 * only for this run: nothing is printed or saved.
 */
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1']

/** The photo storage settings, by the names they have in Vercel. */
const STORAGE = [
  'MEDIA_S3_ENDPOINT',
  'MEDIA_S3_BUCKET',
  'MEDIA_PUBLIC_URL',
  'MEDIA_S3_ACCESS_KEY_ID',
  'MEDIA_S3_SECRET_ACCESS_KEY',
] as const

const askForStorage = async () => {
  console.log(
    '\nThis is a cloud database, so photos must go to the same environment’s storage.' +
      '\nCopy each value from Vercel → Settings → Environment Variables (that environment).',
  )
  for (const name of STORAGE) {
    const value = await ask(`${name} (hidden): `, { hidden: true })
    if (!value) fail(`No ${name}.`)
    process.env[name] = value
  }
}

const main = async () => {
  const folder = process.argv.slice(2).find((arg) => !arg.startsWith('-'))
  if (!folder) fail('Say which folder to import, e.g. pnpm import-club club-imports/cottrell')
  const dir = resolve(folder as string)
  const { default: content } = await import(pathToFileURL(resolve(dir, 'site.ts')).href)
  console.log(`Import ${content.name}\n`)
  await chooseDatabase(`replace the club "${content.slug}"`)
  if (!LOCAL_HOSTS.includes(new URL(process.env.DATABASE_URL as string).hostname)) {
    await askForStorage()
  }
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
