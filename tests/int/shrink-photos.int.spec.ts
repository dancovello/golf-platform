import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { mediaStorageSettings } from '@/media/storage'
import { shrinkExistingPhotos } from '@/media/shrinkExisting'

import { photoFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

// Photos uploaded before 19 Nov 2026 have a big original and 1600/2400/3200 copies. New uploads
// don't, so the test makes an old-style photo by hand, then checks what the tool does to it.
let w: World
let id: string
let w1024Url: string
let oldOriginalKey: string
let largeKey: string

const row = async () => {
  const { rows } = await w.payload.db.drizzle.execute(
    sql`SELECT url, filename, width, filesize FROM media WHERE id = ${id}`,
  )
  return rows[0] as { url: string; filename: string; width: string; filesize: string }
}

beforeAll(async () => {
  w = await seedWorld()
  const doc = (await w.payload.create({
    collection: 'media',
    data: { alt: 'An old photo', tenant: w.clubA.id },
    file: await photoFile('old.jpg', 1800, 1000),
  })) as { id: string; url: string; sizes: { w1024: { url: string } } }
  id = doc.id
  w1024Url = doc.sizes.w1024.url

  const { bucket, publicURL, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const dir = decodeURIComponent(doc.url.slice(publicURL.length + 1))
    .split('/')
    .slice(0, -1)
  oldOriginalKey = [...dir, 'old-original.webp'].join('/')
  largeKey = [...dir, 'old-1600.webp'].join('/')
  for (const Key of [oldOriginalKey, largeKey]) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key,
        Body: Buffer.from('x'),
        ContentType: 'image/webp',
      }),
    )
  }
  const url = (key: string) => `${publicURL}/${key.split('/').map(encodeURIComponent).join('/')}`
  await w.payload.db.drizzle.execute(sql`
    UPDATE media SET url = ${url(oldOriginalKey)}, filename = 'old-original.webp', width = 3000,
      filesize = 900000, sizes_w1600_url = ${url(largeKey)}, sizes_w1600_filesize = 300000
    WHERE id = ${id}`)
})

describe('shrink existing photos', () => {
  it('a dry run measures and changes nothing', async () => {
    const dry = await shrinkExistingPhotos(w.payload)
    expect(dry.originalsReplaced).toBeGreaterThanOrEqual(1)
    expect(dry.largeCopies).toBeGreaterThanOrEqual(1)
    expect(dry.bytesFreed).toBeGreaterThan(1_000_000) // the old original and the large copy
    expect(dry.oldKeys).toContain(oldOriginalKey)
    expect(dry.oldKeys).toContain(largeKey)
    expect((await row()).width).toBe('3000')
  })

  it('points the main file at the 1024 copy and lists the old files, never the copy itself', async () => {
    const done = await shrinkExistingPhotos(w.payload, { apply: true })
    expect(done.failed).toEqual([])
    const after = await row()
    expect(after.url).toBe(w1024Url)
    expect(Number(after.width)).toBe(1024)
    expect(done.oldKeys).toContain(oldOriginalKey)
    expect(done.oldKeys).toContain(largeKey)
    expect(
      done.oldKeys.some((k) => w1024Url.includes(encodeURIComponent(k.split('/').pop()!))),
    ).toBe(false)
  })

  it('does not replace the main file twice', async () => {
    const again = await shrinkExistingPhotos(w.payload, { apply: true })
    expect(again.oldKeys).not.toContain(oldOriginalKey)
    expect((await row()).url).toBe(w1024Url)
  })
})
