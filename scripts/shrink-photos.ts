/**
 * Shrinks photos uploaded before 19 November 2026 to the new limit (1024 wide, no larger
 * copies), to save storage. Run with:  pnpm shrink-photos
 *
 * It first measures how much space would be freed and changes nothing. Then it asks before
 * switching each photo to its 1024 copy. The old files are kept (pages may still point at them
 * for up to an hour); their names are saved to a list file. About an hour later remove them with:
 *   pnpm shrink-photos --remove-old <list file>
 *
 * Run it BEFORE the migration that drops the old size columns is released: it reads those
 * columns to find the large copies (src/media/shrinkExisting.ts).
 *
 * Running it against PRODUCTION needs Dan's explicit approval: removing the old files cannot be
 * undone (original photos are not backed up). Try staging first.
 */
import { writeFileSync } from 'node:fs'

import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const main = async () => {
  const removeIndex = process.argv.indexOf('--remove-old')
  if (removeIndex !== -1) {
    const listFile = process.argv[removeIndex + 1]
    if (!listFile) fail('Give the list file: --remove-old <list file>')
    const { readFileSync } = await import('node:fs')
    const keys = JSON.parse(readFileSync(listFile, 'utf8')) as string[]
    await chooseDatabase('remove old photo files (storage settings come from the environment)')
    const { removeOldFiles } = await import('../src/media/convertExisting')
    if (
      (await ask(`\nType "remove" to delete ${keys.length} old photo files for good: `)) !==
      'remove'
    ) {
      fail('Not confirmed.')
    }
    console.log(`\nRemoved ${await removeOldFiles(keys)} old files.`)
    process.exit(0)
  }

  console.log('Shrink older photos to 1024 wide\n')
  await chooseDatabase('shrink photos')
  const payload = await connect()
  const { shrinkExistingPhotos } = await import('../src/media/shrinkExisting')
  const dry = await shrinkExistingPhotos(payload)
  console.log(
    `\nChecked ${dry.checked} photos. ${dry.originalsReplaced} have an original wider than 1024, ` +
      `and ${dry.largeCopies} large copies (1600, 2400, 3200) were found.\n` +
      `Would free about ${mb(dry.bytesFreed)} (${dry.oldKeys.length} files).`,
  )
  if (dry.skipped.length) console.log(`Notes:\n  ${dry.skipped.join('\n  ')}`)
  if (dry.failed.length) console.log(`Could not read:\n  ${dry.failed.join('\n  ')}`)
  if (dry.oldKeys.length === 0) process.exit(0)

  if (
    (await ask(
      '\nType "shrink" to switch these photos to their 1024 copy (old files are kept for now): ',
    )) !== 'shrink'
  ) {
    fail('Not confirmed.')
  }
  const done = await shrinkExistingPhotos(payload, { apply: true })
  const listFile = `shrunk-photos-${new Date().toISOString().slice(0, 10)}.json`
  writeFileSync(listFile, JSON.stringify(done.oldKeys, null, 2))
  console.log(`\nSwitched ${done.originalsReplaced} photos to their 1024 copy.`)
  console.log(`Old files kept; their names are in ${listFile}.`)
  console.log(`In about an hour: pnpm shrink-photos --remove-old ${listFile}`)
  if (done.failed.length) console.log(`Failed:\n  ${done.failed.join('\n  ')}`)
  process.exit(done.failed.length ? 1 : 0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
