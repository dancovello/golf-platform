/**
 * Copies the production photos, videos and documents into the backup bucket
 * (scripts/lib/mediaMirror.ts). Run nightly by `.github/workflows/media-backup.yml`.
 *
 *   node scripts/media-backup.ts
 *
 * Settings come from environment variables only (GitHub's `release-production` environment):
 *   R2_ENDPOINT                        the Cloudflare R2 address, with no bucket name on the end
 *   MEDIA_SOURCE_BUCKET                the live bucket, e.g. golf-platform-media-production
 *   R2_MEDIA_READ_ACCESS_KEY_ID        a token that can only READ that bucket
 *   R2_MEDIA_READ_SECRET_ACCESS_KEY
 *   BACKUP_BUCKET                      golf-platform-backups
 *   R2_ACCESS_KEY_ID                   the backups token (read and write on the backup bucket)
 *   R2_SECRET_ACCESS_KEY
 */
import { appendFileSync } from 'node:fs'

import { S3Client } from '@aws-sdk/client-s3'

import { mirrorMedia } from './lib/mediaMirror.ts'

const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

const client = (accessKeyId: string, secretAccessKey: string) =>
  new S3Client({
    endpoint: required('R2_ENDPOINT'),
    region: 'auto',
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
    // As the website's own storage settings (src/media/storage.ts): R2 validates checksums.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })

const main = async () => {
  const result = await mirrorMedia({
    source: {
      client: client(
        required('R2_MEDIA_READ_ACCESS_KEY_ID'),
        required('R2_MEDIA_READ_SECRET_ACCESS_KEY'),
      ),
      bucket: required('MEDIA_SOURCE_BUCKET'),
      prefix: '',
    },
    backup: {
      client: client(required('R2_ACCESS_KEY_ID'), required('R2_SECRET_ACCESS_KEY')),
      bucket: required('BACKUP_BUCKET'),
      prefix: 'media/production/',
    },
    removedPrefix: 'media/removed/',
  })
  const mb = (result.bytes / 1024 / 1024).toFixed(1)
  const line = `Media backup: ${result.copied} new files copied (${mb} MB), ${result.kept} already backed up, ${result.setAside} removed files set aside for 7 days.`
  console.log(line)
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
