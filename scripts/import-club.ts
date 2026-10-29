/**
 * Builds a club from its content file (docs/operations/club-import.md).
 *
 *   pnpm import-club-staging <folder>   straight onto staging, using ~/.golf-platform/staging-import.env
 *   pnpm import-club <folder>           asks which database (and its photo storage)
 *
 * (`payload run` drops any argument starting with "--", so staging is the word "staging",
 * which the import-club-staging command passes first.)
 *
 * The folder holds site.ts and the club's files. It replaces the club with the content file's
 * short name, and refuses if that club has editor accounts or an accepted agreement. Running it
 * against production needs Dan's explicit approval.
 *
 * ~/.golf-platform/staging-import.env (in your home folder, outside the project) holds staging's
 * database address and photo storage settings, so they're filled in once instead of every time.
 * Nothing is ever printed.
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1']
/** Outside the project, in your home folder, so it can never be committed. */
const STAGING_FILE = resolve(homedir(), '.golf-platform', 'staging-import.env')

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

/** Reads .env.staging-import (NAME=value lines) and checks every setting is filled in. */
const readStagingFile = async (slug: string) => {
  let text = ''
  try {
    text = readFileSync(STAGING_FILE, 'utf8')
  } catch {
    fail(`There is no ${STAGING_FILE} yet. See docs/operations/club-import.md, step 4.`)
  }
  const values: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const at = line.indexOf('=')
    if (at < 1 || line.trimStart().startsWith('#')) continue
    values[line.slice(0, at).trim()] = line
      .slice(at + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2')
  }
  const missing = ['DATABASE_URL', ...STORAGE].filter((name) => !values[name])
  if (missing.length) fail(`${STAGING_FILE} still needs: ${missing.join(', ')}`)
  for (const [name, value] of Object.entries(values)) process.env[name] = value

  const url = new URL(values.DATABASE_URL)
  console.log(`This will replace the club "${slug}" on STAGING`)
  console.log(`(database "${url.pathname.replace(/^\//, '')}" on ${url.hostname}).`)
  if ((await ask('Type "staging" to continue: ')) !== 'staging') fail('Confirmation did not match.')
}

const main = async () => {
  const args = process.argv.slice(2)
  const staging = args[0] === 'staging'
  const folder = args.find((arg, i) => !(staging && i === 0))
  if (!folder) fail('Say which folder to import, e.g. pnpm import-club club-imports/cottrell')
  const dir = resolve(folder as string)
  const { default: content } = await import(pathToFileURL(resolve(dir, 'site.ts')).href)
  console.log(`Import ${content.name}\n`)
  if (staging) {
    await readStagingFile(content.slug)
  } else {
    await chooseDatabase(`replace the club "${content.slug}"`)
    if (!LOCAL_HOSTS.includes(new URL(process.env.DATABASE_URL as string).hostname)) {
      await askForStorage()
    }
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
