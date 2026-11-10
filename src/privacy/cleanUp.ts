import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import * as Sentry from '@sentry/nextjs'
import type { Payload, Where } from 'payload'

import { sentryEnabled } from '../monitoring/sentry'

import { folderPattern } from '../media/folders'
import { deleteOldCounts } from '../security/rateLimit'
import { mediaStorageSettings } from '../media/storage'

/**
 * The nightly clean-up (plan part D, 2026-10-20). It keeps four promises:
 *
 * 1. **Enquiries** are deleted 12 months after they're marked handled, or 12 months after
 *    they arrived if nobody ever marked them (Dan chose this, option a). The privacy policy
 *    says so (src/site/privacy/policy.ts, RETENTION.enquiries).
 * 2. **Homepage requests** from the company website are deleted 12 months after the last
 *    contact (decision F).
 * 3. **Demo bookings** are deleted 12 months after their last change.
 *    Audit log entries (src/audit/record.ts) are deleted 12 months after they're made.
 * 4. **Uploads that never became a photo or document** (the browser uploaded the file, then
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
/** A safety brake: if more files than this look unused in one night, something is wrong (say,
 * the wrong or a half-restored database), so nothing is removed and Dan is alerted. Stored
 * files aren't backed up, so a removed file is gone for good (audit CRON-1, 22 Oct 2026). */
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

/** Homepage requests are kept 12 months after the last contact (decision F, 21 October 2026):
 * the last change to the request, so marking it sent or adding a note restarts the clock. */
export const HOMEPAGE_REQUEST_MONTHS = 12

export const deleteOldHomepageRequests = async (payload: Payload, now = new Date()) => {
  const result = await payload.delete({
    collection: 'homepage-requests',
    where: { updatedAt: { less_than: monthsBefore(now, HOMEPAGE_REQUEST_MONTHS) } },
    overrideAccess: true,
    depth: 0,
  })
  if (result.errors.length) {
    payload.logger.error(
      { errors: result.errors },
      'Clean-up: some homepage requests could not be deleted',
    )
  }
  return result.docs.length
}

/** Demo bookings are kept 12 months after the call's day: long enough to follow up. */
export const DEMO_BOOKING_MONTHS = 12

export const deleteOldDemoBookings = async (payload: Payload, now = new Date()) => {
  const result = await payload.delete({
    collection: 'demo-bookings',
    where: { updatedAt: { less_than: monthsBefore(now, DEMO_BOOKING_MONTHS) } },
    overrideAccess: true,
    depth: 0,
  })
  if (result.errors.length) {
    payload.logger.error(
      { errors: result.errors },
      'Clean-up: some demo bookings could not be deleted',
    )
  }
  return result.docs.length
}

/** Audit log entries (src/audit/record.ts) are kept 12 months, then deleted. */
export const AUDIT_LOG_MONTHS = 12
export const deleteOldAuditEntries = async (payload: Payload, now = new Date()) => {
  const result = await payload.delete({
    collection: 'audit-log',
    where: { createdAt: { less_than: monthsBefore(now, AUDIT_LOG_MONTHS) } },
    overrideAccess: true,
    depth: 0,
  })
  if (result.errors.length) {
    payload.logger.error(
      { errors: result.errors },
      'Clean-up: some audit log entries could not be deleted',
    )
  }
  return result.docs.length
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

/** Of these folders, the ones a photo or document record points at. */
const knownFolders = async (payload: Payload, folders: string[]) => {
  const known = new Set<string>()
  for (const collection of ['media', 'documents'] as const) {
    const { docs } = await payload.find({
      collection,
      where: { prefix: { in: folders } },
      select: { prefix: true },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of docs as { prefix?: string | null }[]) {
      if (doc.prefix) known.add(doc.prefix)
    }
  }
  return known
}

/** Files looked at per page of the storage listing; also how many folders are checked against the
 * database at once. */
export const ORPHAN_PAGE_SIZE = 1000
/** Stops looking this long after starting, so the nightly run can't be cut off half way through
 * (the route's time limit is 120 seconds). Anything not reached is looked at on another night. */
export const ORPHAN_SCAN_MS = 90_000

/**
 * Removes stored files whose folder no photo or document points at, once they're a day old.
 * Only touches folders in the exact random-folder format the platform creates
 * (src/media/folders.ts); anything else in the bucket is left alone.
 *
 * Works one page of the storage listing at a time (1,000 files): each page's folders are checked
 * against the database with one query, so memory and time stay flat however many clubs and files
 * there are (audit fix plan step 14, finding M8). It used to load every photo and document record
 * and keep the whole bucket listing in memory.
 */
export const deleteOrphanUploads = async (
  payload: Payload,
  now = new Date(),
  max = ORPHAN_MAX_PER_RUN,
  { pageSize = ORPHAN_PAGE_SIZE, scanMs = ORPHAN_SCAN_MS } = {},
) => {
  const { bucket, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const started = Date.now()
  const due: string[] = []
  let skipped = 0
  let scanned = 0
  let outOfTime = false
  for (const root of ['media', 'documents']) {
    const pattern = folderPattern(root)
    let token: string | undefined
    do {
      if (Date.now() - started > scanMs) {
        outOfTime = true
        break
      }
      const page = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${root}/`,
          ContinuationToken: token,
          MaxKeys: pageSize,
        }),
      )
      // This page's files that are in the platform's folder format and old enough.
      const old: { key: string; folder: string }[] = []
      for (const object of page.Contents ?? []) {
        scanned++
        const key = object.Key ?? ''
        const folder = key.split('/').slice(0, 2).join('/')
        if (!pattern.test(folder)) continue
        const age = now.getTime() - (object.LastModified?.getTime() ?? now.getTime())
        if (age < ORPHAN_MIN_AGE_MS) continue
        old.push({ key, folder })
      }
      const folders = [...new Set(old.map((o) => o.folder))]
      const known = folders.length > 0 ? await knownFolders(payload, folders) : new Set<string>()
      for (const { key, folder } of old) {
        if (known.has(folder)) continue
        if (due.length < max) due.push(key)
        else skipped++
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined
    } while (token)
    if (outOfTime) break
  }
  if (outOfTime) {
    const message = `Clean-up: ran out of time after looking at ${scanned} stored files; the rest are looked at on another night`
    payload.logger.warn(message)
    if (sentryEnabled())
      Sentry.captureMessage('Clean-up ran out of time looking at stored files', 'warning')
  }
  if (skipped) {
    const message = `Clean-up: ${due.length + skipped} unused files found, more than the ${max} allowed in one night. Removed none; please check the database is the right one.`
    payload.logger.error(message)
    if (sentryEnabled()) {
      Sentry.captureMessage(message, 'error')
      await Sentry.flush(2000)
    }
    return { removed: 0, skipped: due.length + skipped, scanned, outOfTime }
  }
  for (let i = 0; i < due.length; i += 1000) {
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: due.slice(i, i + 1000).map((Key) => ({ Key })), Quiet: true },
      }),
    )
  }
  return { removed: due.length, skipped, scanned, outOfTime }
}

/**
 * All three clean-ups. Unused files are only removed on production: staging shares its storage with
 * pull-request previews, whose files belong to other databases (decisions.md, 11 October).
 */
export const runCleanUp = async (
  payload: Payload,
  { now = new Date(), files = process.env.VERCEL_ENV === 'production' } = {},
) => {
  const enquiries = await deleteOldEnquiries(payload, now)
  const homepageRequests = await deleteOldHomepageRequests(payload, now)
  const demoBookings = await deleteOldDemoBookings(payload, now)
  const auditEntries = await deleteOldAuditEntries(payload, now)
  const uploads = files ? await deleteOrphanUploads(payload, now) : null
  const db = (payload.db as unknown as { drizzle: Parameters<typeof deleteOldCounts>[0] }).drizzle
  const counts = await deleteOldCounts(db, now)
  payload.logger.info(
    `Clean-up: deleted ${enquiries} enquiries, ${homepageRequests} homepage requests, ${demoBookings} demo bookings, ${auditEntries} audit log entries and ${counts} old rate-limit counts${uploads ? `, removed ${uploads.removed} unused files` : ''}`,
  )
  return { enquiries, homepageRequests, demoBookings, auditEntries, uploads, counts }
}
