/**
 * Saves photos uploaded before 9 November 2026 as WebP, to save storage (new uploads already
 * are). Run with:  pnpm convert-photos-to-webp
 *
 * It first measures how much space would be saved and changes nothing. Then it asks before
 * converting. The old files are kept (pages may still point at them for up to an hour); their
 * names are saved to a list file. About an hour later remove them with:
 *   pnpm convert-photos-to-webp --remove-old <list file>
 *
 * Running it against PRODUCTION needs Dan's explicit approval: removing the old files cannot be
 * undone (original photos are not backed up).
 */
import { readFileSync, writeFileSync } from 'node:fs'

import { ask, chooseDatabase, connect, fail } from './lib/prompts'

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

const main = async () => {
  const removeIndex = process.argv.indexOf('--remove-old')
  if (removeIndex !== -1) {
    const listFile = process.argv[removeIndex + 1]
    if (!listFile) fail('Give the list file: --remove-old <list file>')
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

  console.log('Save older photos as WebP\n')
  await chooseDatabase('convert photos to WebP')
  const payload = await connect()
  const { convertExistingPhotos } = await import('../src/media/convertExisting')
  const dry = await convertExistingPhotos(payload)
  console.log(
    `\nChecked ${dry.checked} JPEG/PNG photos. Would save ${mb(dry.bytesBefore - dry.bytesAfter)} ` +
      `(${mb(dry.bytesBefore)} down to ${mb(dry.bytesAfter)}).`,
  )
  if (dry.skipped.length) console.log(`Would skip:\n  ${dry.skipped.join('\n  ')}`)
  if (dry.failed.length) console.log(`Could not read:\n  ${dry.failed.join('\n  ')}`)
  if (dry.bytesBefore === dry.bytesAfter) process.exit(0)

  if (
    (await ask('\nType "convert" to save these as WebP (old files are kept for now): ')) !==
    'convert'
  ) {
    fail('Not confirmed.')
  }
  const done = await convertExistingPhotos(payload, { apply: true })
  const listFile = `converted-photos-${new Date().toISOString().slice(0, 10)}.json`
  writeFileSync(listFile, JSON.stringify(done.oldKeys, null, 2))
  console.log(`\nConverted ${done.converted} photos.`)
  console.log(`Old files kept; their names are in ${listFile}.`)
  console.log(`In about an hour: pnpm convert-photos-to-webp --remove-old ${listFile}`)
  if (done.skipped.length) console.log(`Skipped:\n  ${done.skipped.join('\n  ')}`)
  if (done.failed.length) console.log(`Failed:\n  ${done.failed.join('\n  ')}`)
  process.exit(done.failed.length ? 1 : 0)
}

// Awaited at the top level: `payload run` exits as soon as this module finishes loading.
await main()
