/**
 * The nightly second copy of the live photos and documents (scripts/lib/mediaMirror.ts), against
 * the local storage stand-in with two throwaway buckets. Never real R2.
 */
import {
  CreateBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { mediaStorageSettings } from '@/media/storage'

import { listKeys, mirrorMedia } from '../../scripts/lib/mediaMirror'

const LIVE = 'golf-mirror-test-live'
const BACKUP = 'golf-mirror-test-backup'
const COPY = 'media/production/'
const REMOVED = 'media/removed/'

let s3: S3Client
const live = () => ({ client: s3, bucket: LIVE, prefix: '' })
const backup = () => ({ client: s3, bucket: BACKUP, prefix: COPY })
const run = (maxSetAside?: number) =>
  mirrorMedia({ source: live(), backup: backup(), removedPrefix: REMOVED, maxSetAside })

const put = (bucket: string, key: string, text: string, type = 'image/webp') =>
  s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: text, ContentType: type }))

const keysIn = async (bucket: string, prefix = '') =>
  [...(await listKeys({ client: s3, bucket, prefix })).keys()].sort()

const emptyBucket = async (bucket: string) => {
  const page = await s3.send(new ListObjectsV2Command({ Bucket: bucket }))
  for (const object of page.Contents ?? []) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: object.Key! }))
  }
}

beforeAll(async () => {
  const { config } = mediaStorageSettings()
  if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(config.endpoint)) {
    throw new Error('Tests must use the local storage stand-in, never real R2')
  }
  s3 = new S3Client(config)
  for (const Bucket of [LIVE, BACKUP]) {
    try {
      await s3.send(new CreateBucketCommand({ Bucket }))
    } catch (error) {
      const name = (error as { name?: string }).name
      if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') throw error
    }
  }
})

beforeEach(async () => {
  await emptyBucket(LIVE)
  await emptyBucket(BACKUP)
})

describe('the nightly media copy', () => {
  it('copies new files with the same key and content, and a second run changes nothing', async () => {
    await put(LIVE, 'media/aaa/one.webp', 'photo one')
    await put(LIVE, 'documents/bbb/rules.pdf', 'document', 'application/pdf')
    await put(LIVE, 'marketing-media/ccc/logo.svg', '<svg/>', 'image/svg+xml')

    const first = await run()
    expect(first).toMatchObject({ copied: 3, setAside: 0, kept: 0 })
    expect(await keysIn(BACKUP, COPY)).toEqual([
      'documents/bbb/rules.pdf',
      'marketing-media/ccc/logo.svg',
      'media/aaa/one.webp',
    ])
    const copy = await s3.send(
      new GetObjectCommand({ Bucket: BACKUP, Key: `${COPY}documents/bbb/rules.pdf` }),
    )
    expect(await copy.Body!.transformToString()).toBe('document')
    expect(copy.ContentType).toBe('application/pdf')

    expect(await run()).toMatchObject({ copied: 0, setAside: 0, kept: 3 })
  })

  it('copies only what is new on later nights', async () => {
    await put(LIVE, 'media/aaa/one.webp', 'photo one')
    await run()
    await put(LIVE, 'media/ddd/two.webp', 'photo two')
    expect(await run()).toMatchObject({ copied: 1, setAside: 0, kept: 1 })
    expect(await keysIn(BACKUP, COPY)).toEqual(['media/aaa/one.webp', 'media/ddd/two.webp'])
  })

  it('sets a removed file aside, never deletes it, and copies it back if it returns', async () => {
    await put(LIVE, 'media/aaa/one.webp', 'photo one')
    await put(LIVE, 'media/ddd/two.webp', 'photo two')
    await run()

    await s3.send(new DeleteObjectCommand({ Bucket: LIVE, Key: 'media/aaa/one.webp' }))
    expect(await run()).toMatchObject({ copied: 0, setAside: 1, kept: 1 })
    expect(await keysIn(BACKUP, COPY)).toEqual(['media/ddd/two.webp'])
    expect(await keysIn(BACKUP, REMOVED)).toEqual(['media/aaa/one.webp'])
    const kept = await s3.send(
      new GetObjectCommand({ Bucket: BACKUP, Key: `${REMOVED}media/aaa/one.webp` }),
    )
    expect(await kept.Body!.transformToString()).toBe('photo one')

    await put(LIVE, 'media/aaa/one.webp', 'photo one')
    expect(await run()).toMatchObject({ copied: 1, setAside: 0 })
    expect(await keysIn(BACKUP, COPY)).toEqual(['media/aaa/one.webp', 'media/ddd/two.webp'])
  })

  it('handles file names with spaces and accents', async () => {
    await put(LIVE, 'media/eee/Café menu (final).webp', 'menu')
    // Another file stays, so the live bucket isn't empty (which would stop the run).
    await put(LIVE, 'media/fff/other.webp', 'other')
    await run()
    await s3.send(
      new DeleteObjectCommand({ Bucket: LIVE, Key: 'media/eee/Café menu (final).webp' }),
    )
    await run()
    expect(await keysIn(BACKUP, REMOVED)).toEqual(['media/eee/Café menu (final).webp'])
  })

  it('stops, setting nothing aside, when too many files look removed', async () => {
    for (let i = 0; i < 6; i++) await put(LIVE, `media/f${i}/p.webp`, `photo ${i}`)
    await run()
    for (let i = 0; i < 4; i++) {
      await s3.send(new DeleteObjectCommand({ Bucket: LIVE, Key: `media/f${i}/p.webp` }))
    }
    await put(LIVE, 'media/new/p.webp', 'new photo')

    await expect(run(3)).rejects.toThrow(/4 files look removed.*more than the 3/)
    // New files were still copied; nothing was set aside.
    expect(await keysIn(BACKUP, COPY)).toHaveLength(7)
    expect(await keysIn(BACKUP, REMOVED)).toEqual([])
    // Within the limit it goes through.
    expect(await run(4)).toMatchObject({ setAside: 4 })
  })

  it('stops, setting nothing aside, when the live bucket looks empty', async () => {
    await put(LIVE, 'media/aaa/one.webp', 'photo one')
    await run()
    await emptyBucket(LIVE)
    await expect(run()).rejects.toThrow(/looks empty/)
    expect(await keysIn(BACKUP, COPY)).toEqual(['media/aaa/one.webp'])
    expect(await keysIn(BACKUP, REMOVED)).toEqual([])
  })

  it('refuses a removed folder inside the copy folder, which would copy files onto themselves', async () => {
    await expect(
      mirrorMedia({ source: live(), backup: backup(), removedPrefix: `${COPY}removed/` }),
    ).rejects.toThrow(/different, non-empty folders/)
  })
})
