import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import type { Payload, Where } from 'payload'

import { folderPattern } from '../media/folders'
import { deleteOldCounts } from '../security/rateLimit'
import { mediaStorageSettings } from '../media/storage'

/**
 * The nightly clean-up (plan part D, 2026-10-20). It keeps two promises:
 *
 * 1. **Enquiries** are deleted 12 months after they're marked handled, or 12 months after
 *    they arrived if nobody ever marked them (Dan chose this, option a). The privacy policy
 *    says so (src/site/privacy/policy.ts, RETENTION.enquiries).
 * 2. **Uploads that never became a photo or document** (the browser uploaded the file, then
 *    Payload's content check refused the record) are removed from storage after a day.
 *
 * It also deletes rate-limit counts older than a day (src/security/rateLimit.ts): they hold
 * only hashed visitor keys, and no limit needs them.
 *
 * Run by the Payload job queue (src/payload.config.ts, task "cleanUp"), started daily by
 * Vercel's scheduler (vercel.json → src/app/(frontend)/cron/clean-up/route.ts).
 */

export const ENQUIRY_MONTHS = 12
/** An upload younger than this may still be on its way to becoming a record. */
export const ORPHAN_MIN_AGE_MS = 24 * 60 * 60 * 1000
/** A safety brake: never remove more files than this in one night. More than that means
 * something is wrong (say, the wrong database), and a person should look first. */
export const ORPHAN_MAX_PER_RUN = 200

const monthsBefore = (now: Date, months: number) => {
  const d = new Date(now)
  d.setUTCMonth(d.getUTCMonth() - months)
  return d.toISOString()
}

/** Which enquiries are due for deletion. Every club's, by date alone. */
export const enquiriesDue = (now: Date): Where => {
  const cutoff = monthsBefore(now, ENQUIRY_MONTHS)
  return {
    or: [
      // Handled: 12 months after it was marked handled. Enquiries handled before the date was
      // recorded (20 October 2026) use their last change instead.
      {
        and: [
          { status: { equals: 'handled' } },
          {
            or: [
              { handledAt: { less_than: cutoff } },
              { and: [{ handledAt: { exists: false } }, { updatedAt: { less_than: cutoff } }] },
            ],
          },
        ],
      },
      // Never handled: 12 months after it arrived.
      { and: [{ status: { not_equals: 'handled' } }, { createdAt: { less_than: cutoff } }] },
    ],
  }
}

export const deleteOldEnquiries = async (payload: Payload, now = new Date()) => {
  const result = await payload.delete({
    collection: 'enquiries',
    where: enquiriesDue(now),
    overrideAccess: true,
    depth: 0,
  })
  if (result.errors.length) {
    payload.logger.error({ errors: result.errors }, 'Clean-up: some enquiries could not be deleted')
  }
  return result.docs.length
}

/** Every folder a photo or document record points at. */
const knownFolders = async (payload: Payload) => {
  const folders = new Set<string>()
  for (const collection of ['media', 'documents'] as const) {
    const { docs } = await payload.find({
      collection,
      select: { prefix: true },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of docs as { prefix?: string | null }[]) {
      if (doc.prefix) folders.add(doc.prefix)
    }
  }
  return folders
}

/**
 * Removes stored files whose folder no photo or document points at, once they're a day old.
 * Only touches folders in the exact random-folder format the platform creates
 * (src/media/folders.ts); anything else in the bucket is left alone.
 */
export const deleteOrphanUploads = async (
  payload: Payload,
  now = new Date(),
  max = ORPHAN_MAX_PER_RUN,
) => {
  const { bucket, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const known = await knownFolders(payload)
  const due: string[] = []
  let skipped = 0

  for (const root of ['media', 'documents']) {
    const pattern = folderPattern(root)
    let token: string | undefined
    do {
      const page = await s3.send(
        new ListObjectsV2Command({ Bucket: bucket, Prefix: `${root}/`, ContinuationToken: token }),
      )
      for (const object of page.Contents ?? []) {
        const key = object.Key ?? ''
        const folder = key.split('/').slice(0, 2).join('/')
        if (!pattern.test(folder) || known.has(folder)) continue
        const age = now.getTime() - (object.LastModified?.getTime() ?? now.getTime())
        if (age < ORPHAN_MIN_AGE_MS) continue
        if (due.length < max) due.push(key)
        else skipped++
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (token)
  }

  if (skipped) {
    payload.logger.error(
      `Clean-up: ${due.length + skipped} unused files found, more than the ${max} allowed in one night. Removed ${due.length}; please check.`,
    )
  }
  for (let i = 0; i < due.length; i += 1000) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: due.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
      }),
    )
  }
  return { removed: due.length, skipped }
}

/**
 * Both clean-ups. Unused files are only removed on production: staging shares its storage with
 * pull-request previews, whose files belong to other databases (decisions.md, 11 October).
 */
export const runCleanUp = async (
  payload: Payload,
  { now = new Date(), files = process.env.VERCEL_ENV === 'production' } = {},
) => {
  const enquiries = await deleteOldEnquiries(payload, now)
  const uploads = files ? await deleteOrphanUploads(payload, now) : null
  const db = (payload.db as unknown as { drizzle: Parameters<typeof deleteOldCounts>[0] }).drizzle
  const counts = await deleteOldCounts(db, now)
  payload.logger.info(
    `Clean-up: deleted ${enquiries} enquiries and ${counts} old rate-limit counts${uploads ? `, removed ${uploads.removed} unused files` : ''}`,
  )
  return { enquiries, uploads, counts }
}
