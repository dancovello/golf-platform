import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sql } from '@payloadcms/db-postgres'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { GET as nightly } from '@/app/(frontend)/cron/clean-up/route'
import { mediaStorageSettings } from '@/media/storage'
import { deleteOrphanUploads } from '@/privacy/cleanUp'

import { seedWorld, type World } from './helpers/seed'

/**
 * Security audit of the cron and background jobs, 22 October 2026
 * (docs/security/audit-cron-jobs.md). Each test proves one finding.
 *
 * KNOWN FAILURES: these are marked `it.fails`, so they pass while the problem is still there
 * and don't block CI. When a fix lands, its test starts failing: change `it.fails` to `it`.
 */

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const DAY = 24 * 60 * 60 * 1000

describe('CRON-1: the nightly brake on removing files', () => {
  const { bucket, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const stored = (key: string) =>
    s3
      .send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      .then(() => true)
      .catch(() => false)

  // KNOWN FAILURE (CRON-1, medium). Today it removes the first 200 and only writes a log line,
  // every night, so a wrong or half-restored database loses 200 club files a night for good
  // (stored files aren't backed up). It should remove nothing and raise an alert.
  it.fails('removes nothing when more files look unused than the nightly limit', async () => {
    const keys = ['a', 'b', 'c'].map((name) => `media/${randomUUID()}/${name}.png`)
    for (const key of keys) {
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'x' }))
    }
    const later = new Date(Date.now() + 2 * DAY)
    const result = await deleteOrphanUploads(w.payload, later, 1)
    expect(result.removed).toBe(0)
    for (const key of keys) expect(await stored(key)).toBe(true)
  })
})

describe('CRON-2: a failed clean-up is reported as a success', () => {
  afterEach(async () => {
    vi.unstubAllEnvs()
    // Leave no failed job behind for the other tests.
    await (
      w.payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }
    ).drizzle.execute(sql`DELETE FROM payload_jobs`)
  })

  // KNOWN FAILURE (CRON-2, low). The job queue catches the error, the route answers 200
  // {"ok":true}, and nothing reaches Sentry. The privacy policy's 12-month promise could stop
  // being kept with no one told. It should answer 500 and report to Sentry.
  it.fails("doesn't answer 'ok' when the clean-up fails", async () => {
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    // Production, with storage settings broken: the file clean-up throws.
    vi.stubEnv('VERCEL_ENV', 'production')
    vi.stubEnv('MEDIA_S3_BUCKET', '')
    const response = await nightly(
      new Request('http://localhost/cron/clean-up', {
        headers: { authorization: 'Bearer test-only-cron-secret' },
      }),
    )
    expect(response.status).toBe(500)
  })
})
