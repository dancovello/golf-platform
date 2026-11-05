/**
 * Builds a club from its content file (docs/operations/club-import.md).
 *
 *   pnpm import-club-staging <folder>   straight onto staging, using ~/.golf-platform/staging-import.env
 *   pnpm import-club-production <folder> [demo]   a NEW club onto production, using
 *                                       ~/.golf-platform/production-import.env; never replaces
 *                                       a club that is already there; "demo" also switches
 *                                       on its public demo link (docs/operations/prospect-demos.md)
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

import { parseEnvText, sharedSettings } from './lib/importTargets'
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '::1']
/** Outside the project, in your home folder, so they can never be committed. */
const SETTINGS_FOLDER = resolve(homedir(), '.golf-platform')
const SETTINGS_FILE = {
  staging: 'staging-import.env',
  production: 'production-import.env',
} as const
type Target = keyof typeof SETTINGS_FILE

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

/** Reads the target's settings file (NAME=value lines) and checks every setting is filled in. */
const readSettings = async (target: Target, slug: string) => {
  const file = resolve(SETTINGS_FOLDER, SETTINGS_FILE[target])
  let text = ''
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    fail(`There is no ${file} yet. See docs/operations/club-import.md, step 4.`)
  }
  const values = parseEnvText(text)
  const missing = ['DATABASE_URL', ...STORAGE].filter((name) => !values[name])
  if (missing.length) fail(`${file} still needs: ${missing.join(', ')}`)
  // Staging and production must not share a database or photo storage. Checked before anything
  // is set or connected, so a wrong connection string can't write to the other environment.
  const otherName: Target = target === 'production' ? 'staging' : 'production'
  let otherText = ''
  try {
    otherText = readFileSync(resolve(SETTINGS_FOLDER, SETTINGS_FILE[otherName]), 'utf8')
  } catch {
    // No other file yet: nothing to compare with.
  }
  if (otherText) {
    const other = parseEnvText(otherText)
    const problems =
      target === 'production' ? sharedSettings(other, values) : sharedSettings(values, other)
    if (problems.length) {
      fail(
        `${file} and ${SETTINGS_FILE[otherName]} point at the same place, so this could write to the wrong environment:\n- ${problems.join('\n- ')}\nFix the ${target} file (docs/operations/club-import.md, steps 4 and 4b).`,
      )
    }
  }
  for (const [name, value] of Object.entries(values)) process.env[name] = value

  const url = new URL(values.DATABASE_URL)
  const word = target.toUpperCase()
  const verb = target === 'production' ? 'add the NEW club' : 'replace the club'
  console.log(`This will ${verb} "${slug}" on ${word}`)
  console.log(`(database "${url.pathname.replace(/^\//, '')}" on ${url.hostname}).`)
  if (target === 'production') {
    console.log("Production is live. You need Dan's explicit approval for this run.")
  }
  if ((await ask(`Type "${target}" to continue: `)) !== target) fail('Confirmation did not match.')
}

const main = async () => {
  const args = process.argv.slice(2)
  const target: Target | null = args[0] === 'staging' || args[0] === 'production' ? args[0] : null
  const rest = target ? args.slice(1) : args
  const demo = rest.includes('demo')
  const folder = rest.find((arg) => arg !== 'demo')
  if (demo && target !== 'production') fail('"demo" only works with import-club-production.')
  if (!folder) fail('Say which folder to import, e.g. pnpm import-club club-imports/cottrell')
  const dir = resolve(folder as string)
  const { default: content } = await import(pathToFileURL(resolve(dir, 'site.ts')).href)
  console.log(`Import ${content.name}\n`)
  if (target) {
    await readSettings(target, content.slug)
  } else {
    await chooseDatabase(`replace the club "${content.slug}"`)
    if (!LOCAL_HOSTS.includes(new URL(process.env.DATABASE_URL as string).hostname)) {
      await askForStorage()
    }
  }
  const payload = await connect()
  const { ExistingClubError, importClub, removeImportedClub } =
    await import('../src/import/clubImport')
  const production = target === 'production'
  try {
    const result = await importClub(payload, content, dir, (m) => console.log(`  ${m}`), {
      onlyIfNew: production,
      demo,
    })
    console.log(`\nDone: ${result.pages} pages.`)
    if (result.demo) {
      console.log(`Demo link: <the company's domain>${result.demo.address}`)
      console.log(`It stops working on ${new Date(result.demo.expiresAt).toDateString()}.`)
    } else if (production) {
      console.log('Not public yet: switch on "Public demo" for the club to get a link.')
    } else {
      console.log(`See it at /preview/${result.slug}`)
    }
  } catch (error) {
    if (error instanceof ExistingClubError) fail(`${error.message}`)
    console.error(`\nImport stopped: ${(error as Error).message}`)
    // The club may be half built. On staging, fix the content file and run again to replace it.
    // On production we checked the club was new, so what is there is only this attempt.
    if (production) {
      await removeImportedClub(payload, content.slug)
        .then(() => console.error('The half-built club was removed from production.'))
        .catch((e) =>
          console.error(`Could not remove it: ${(e as Error).message}. Remove it in the admin.`),
        )
    }
    process.exit(1)
  }
  process.exit(0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
