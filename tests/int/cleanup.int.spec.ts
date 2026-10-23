import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sql } from '@payloadcms/db-postgres'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { mediaStorageSettings } from '@/media/storage'
import { GET as nightly } from '@/app/(frontend)/cron/clean-up/route'
import { deleteOldEnquiries, deleteOrphanUploads, runCleanUp } from '@/privacy/cleanUp'
import { jobs } from '@/privacy/jobs'

import { pngFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

// The nightly clean-up that keeps the privacy policy's promises (plan part D).

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const db = () =>
  (w.payload.db as unknown as { drizzle: { execute: (q: unknown) => Promise<unknown> } }).drizzle

let n = 0
const enquiry = async (tenant: string, status: 'new' | 'handled' = 'new') =>
  w.payload.create({
    collection: 'enquiries',
    data: {
      reference: `CLEAN-${++n}`,
      purpose: 'general',
      name: 'Visitor',
      email: 'visitor@example.com',
      message: 'Hello',
      status,
      tenant,
    },
    overrideAccess: true,
  })

/** Moves an enquiry's dates into the past, as if it had been in the database a while. */
const backdate = (
  id: string,
  dates: { created?: string; updated?: string; handled?: string | null },
) =>
  db().execute(sql`
    UPDATE enquiries SET
      created_at = COALESCE(${dates.created ?? null}::timestamptz, created_at),
      updated_at = COALESCE(${dates.updated ?? null}::timestamptz, updated_at),
      handled_at = ${dates.handled === undefined ? sql`handled_at` : sql`${dates.handled}::timestamptz`}
    WHERE id = ${id}`)

const exists = async (id: string) =>
  (
    await w.payload.find({
      collection: 'enquiries',
      where: { id: { equals: id } },
      overrideAccess: true,
    })
  ).totalDocs === 1

const NOW = new Date('2027-11-01T03:30:00Z')

describe('"marked handled on" is set by the server', () => {
  it('is stamped when an editor marks an enquiry handled, and cleared if reopened', async () => {
    const e = await enquiry(w.clubA.id)
    expect(e.handledAt ?? null).toBeNull()
    const handled = await w.payload.update({
      collection: 'enquiries',
      id: e.id,
      data: { status: 'handled' },
      user: w.editorA,
      overrideAccess: false,
    })
    expect(handled.handledAt).toBeTruthy()
    const noted = await w.payload.update({
      collection: 'enquiries',
      id: e.id,
      data: { notes: 'Phoned back' },
      user: w.editorA,
      overrideAccess: false,
    })
    expect(noted.handledAt).toBe(handled.handledAt)
    const reopened = await w.payload.update({
      collection: 'enquiries',
      id: e.id,
      data: { status: 'new' },
      user: w.editorA,
      overrideAccess: false,
    })
    expect(reopened.handledAt ?? null).toBeNull()
  })

  it("an editor can't type the date themselves", async () => {
    const e = await enquiry(w.clubA.id)
    const updated = await w.payload.update({
      collection: 'enquiries',
      id: e.id,
      data: { handledAt: '2020-01-01T00:00:00.000Z' } as never,
      user: w.editorA,
      overrideAccess: false,
    })
    expect(updated.handledAt ?? null).toBeNull()
  })
})

describe('enquiries are deleted after 12 months (privacy policy)', () => {
  it('deletes handled ones 12 months after handling, and unhandled ones 12 months after arriving, in every club', async () => {
    const oldHandledA = await enquiry(w.clubA.id, 'handled')
    await backdate(oldHandledA.id, { created: '2026-01-01', handled: '2026-10-15' })
    const recentHandledA = await enquiry(w.clubA.id, 'handled')
    // Arrived long ago, but handled only 11 months ago: kept.
    await backdate(recentHandledA.id, { created: '2025-01-01', handled: '2026-12-01' })
    const oldNewB = await enquiry(w.clubB.id)
    await backdate(oldNewB.id, { created: '2026-10-20' })
    const recentNewB = await enquiry(w.clubB.id)
    await backdate(recentNewB.id, { created: '2027-01-15' })
    // Handled before the date was recorded: its last change counts.
    const legacyHandled = await enquiry(w.clubA.id, 'handled')
    await backdate(legacyHandled.id, {
      created: '2026-01-01',
      updated: '2026-06-01',
      handled: null,
    })

    const deleted = await deleteOldEnquiries(w.payload, NOW)

    expect(deleted).toBeGreaterThanOrEqual(3)
    expect(await exists(oldHandledA.id)).toBe(false)
    expect(await exists(oldNewB.id)).toBe(false)
    expect(await exists(legacyHandled.id)).toBe(false)
    expect(await exists(recentHandledA.id)).toBe(true)
    expect(await exists(recentNewB.id)).toBe(true)
  })

  it('leaves this year’s enquiries alone', async () => {
    const fresh = await enquiry(w.clubA.id)
    await deleteOldEnquiries(w.payload)
    expect(await exists(fresh.id)).toBe(true)
  })
})

describe('unused uploads are removed from storage', () => {
  const { bucket, config, publicURL } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const stored = async (key: string) =>
    s3
      .send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
      .then(() => true)
      .catch(() => false)

  it('removes files no photo or document points at, and keeps every real one', async () => {
    // A real photo, uploaded the normal way.
    const photo = await w.payload.create({
      collection: 'media',
      data: { alt: 'Kept', tenant: w.clubA.id },
      file: pngFile('kept.png'),
    })
    const photoKey = `${photo.prefix}/${photo.filename}`
    expect(photo.url).toBe(`${publicURL}/${photoKey}`)
    // A file that reached storage but never became a record (refused by the content check).
    const orphanKey = `media/${randomUUID()}/refused.png`
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: orphanKey, Body: 'x' }))
    // Something in the bucket that isn't in the platform's folder format: never touched.
    const otherKey = `media/not-a-platform-folder/file.txt`
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: otherKey, Body: 'x' }))

    // (Local test storage keeps files from earlier runs, so no limit on how many go here.)
    const noLimit = 1_000_000
    // Same day: too new, it might still be on its way to becoming a record.
    await deleteOrphanUploads(w.payload, new Date(), noLimit)
    expect(await stored(orphanKey)).toBe(true)

    // Two days later.
    const later = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const result = await deleteOrphanUploads(w.payload, later, noLimit)
    expect(result.removed).toBeGreaterThanOrEqual(1)
    expect(await stored(orphanKey)).toBe(false)
    expect(await stored(photoKey)).toBe(true)
    expect(await stored(otherKey)).toBe(true)
  })

  it('removes nothing past the nightly limit, so a wrong database can never empty storage', async () => {
    for (const name of ['a', 'b', 'c']) {
      const key = `media/${randomUUID()}/${name}.png`
      await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: 'x' }))
    }
    const later = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const result = await deleteOrphanUploads(w.payload, later, 1)
    expect(result.removed).toBe(0)
    expect(result.skipped).toBeGreaterThanOrEqual(3)
  })

  it('only touches storage on production (staging shares it with pull-request previews)', async () => {
    const orphanKey = `media/${randomUUID()}/staging.png`
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: orphanKey, Body: 'x' }))
    const later = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    const result = await runCleanUp(w.payload, { now: later })
    expect(result.uploads).toBeNull()
    expect(await stored(orphanKey)).toBe(true)
  })
})

describe("the nightly schedule's entry point", () => {
  afterEach(() => vi.unstubAllEnvs())
  const call = (authorization?: string) =>
    nightly(
      new Request('http://localhost/cron/clean-up', {
        headers: authorization ? { authorization } : {},
      }),
    )

  it("doesn't exist without the scheduler's secret", async () => {
    expect((await call('Bearer anything')).status).toBe(404)
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    expect((await call()).status).toBe(404)
    expect((await call('Bearer wrong')).status).toBe(404)
  })

  it('with it, runs the clean-up through the job queue and leaves no job behind', async () => {
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    const old = await enquiry(w.clubA.id)
    await backdate(old.id, { created: '2020-01-01' })
    const response = await call('Bearer test-only-cron-secret')
    expect(response.status).toBe(200)
    expect(await exists(old.id)).toBe(false)
    const jobs = await w.payload.find({ collection: 'payload-jobs', overrideAccess: true })
    expect(jobs.totalDocs).toBe(0)
  })
})

describe('running jobs by hand', () => {
  it('only a super-admin with their code entered may (Payload would allow any account)', async () => {
    const may = (user: unknown) =>
      Promise.all(
        (['run', 'queue', 'cancel'] as const).map((op) =>
          (jobs.access?.[op] as (a: unknown) => unknown)({ req: { user } }),
        ),
      )
    expect(await may(null)).toEqual([false, false, false])
    expect(await may({ ...w.editorA, _strategy: 'totp' })).toEqual([false, false, false])
    expect(await may({ ...w.superAdmin, _strategy: 'local-jwt' })).toEqual([false, false, false])
    expect(await may({ ...w.superAdmin, _strategy: 'totp' })).toEqual([true, true, true])
  })
})
