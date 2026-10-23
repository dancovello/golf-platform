/**
 * Removes the phone's hidden details (location, owner name) from photos uploaded before
 * 23 October 2026 (docs/security/audit-uploads.md, finding 1). New uploads are already clean.
 * Run with:  pnpm clean-photo-details
 *
 * It first counts the photos that still carry details, then asks before changing anything.
 * Running it against PRODUCTION needs Dan's explicit approval: it overwrites original files
 * in storage, which aren't backed up (the cleaned copy replaces the original).
 */
import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const main = async () => {
  console.log('Clean hidden details from older photos\n')
  await chooseDatabase('clean hidden details from photos')
  const payload = await connect()
  const { cleanExistingPhotos } = await import('../src/media/cleanExisting')
  const dry = await cleanExistingPhotos(payload)
  console.log(`\nChecked ${dry.checked} photos; ${dry.withDetails} still carry hidden details.`)
  if (dry.failed.length) console.log(`Could not read:\n  ${dry.failed.join('\n  ')}`)
  if (dry.withDetails === 0) process.exit(0)
  const answer = await ask(`\nType "clean" to re-save those ${dry.withDetails} photos: `)
  if (answer !== 'clean') fail('Not confirmed.')
  const done = await cleanExistingPhotos(payload, { apply: true })
  console.log(`\nCleaned ${done.cleaned} photos.`)
  if (done.failed.length) console.log(`Failed:\n  ${done.failed.join('\n  ')}`)
  process.exit(done.failed.length ? 1 : 0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
