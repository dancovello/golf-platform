import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'

import { convertExistingPhotos } from '@/media/convertExisting'
import { mediaStorageSettings } from '@/media/storage'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const upload = async (data: Buffer, mimetype: string, name: string) =>
  w.payload.create({
    collection: 'media',
    data: { alt: 'webp test', tenant: w.clubA.id },
    file: { data, mimetype, name, size: data.length },
    overrideAccess: false,
    user: w.editorA,
  })

describe('photos are stored as WebP', () => {
  it('turns an uploaded JPEG into a smaller WebP original', async () => {
    const jpeg = await sharp({
      create: { width: 1600, height: 1000, channels: 3, background: '#5d7a52' },
    })
      .jpeg({ quality: 95 })
      .toBuffer()
    const doc = await upload(jpeg, 'image/jpeg', 'course.jpg')
    try {
      expect(doc.mimeType).toBe('image/webp')
      expect(doc.filename).toMatch(/\.webp$/)
      const stored = Buffer.from(await (await fetch(doc.url!)).arrayBuffer())
      expect((await sharp(stored).metadata()).format).toBe('webp')
      expect(stored.length).toBeLessThan(jpeg.length)
    } finally {
      await w.payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
    }
  })

  it('keeps a logo’s transparent background', async () => {
    const png = await sharp({
      create: { width: 400, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toBuffer()
    const doc = await upload(png, 'image/png', 'logo.png')
    try {
      expect(doc.mimeType).toBe('image/webp')
      const stored = Buffer.from(await (await fetch(doc.url!)).arrayBuffer())
      const meta = await sharp(stored).metadata()
      expect(meta.hasAlpha).toBe(true)
      const { data } = await sharp(stored).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      expect(data[3]).toBe(0)
    } finally {
      await w.payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
    }
  })
})

describe('converting photos uploaded before WebP', () => {
  it('moves an old JPEG to WebP, points its record at it and keeps the old file', async () => {
    const { bucket, publicURL, config } = mediaStorageSettings()
    const s3 = new S3Client(config)
    // A record that looks like an old upload: a JPEG original in its own folder.
    const seed = await upload(
      await sharp({ create: { width: 1200, height: 800, channels: 3, background: '#335533' } })
        .png()
        .toBuffer(),
      'image/png',
      'seed.png',
    )
    const jpeg = await sharp({
      create: { width: 1200, height: 800, channels: 3, background: '#335533' },
    })
      .jpeg({ quality: 98 })
      .toBuffer()
    const folder = seed
      .url!.slice(publicURL.length + 1)
      .split('/')
      .slice(0, -1)
      .join('/')
    const oldKey = `${folder}/old-photo.jpg`
    await s3.send(
      new PutObjectCommand({ Bucket: bucket, Key: oldKey, Body: jpeg, ContentType: 'image/jpeg' }),
    )
    await w.payload.db.updateOne({
      collection: 'media',
      id: seed.id,
      data: {
        filename: 'old-photo.jpg',
        url: `${publicURL}/${oldKey}`,
        mimeType: 'image/jpeg',
        filesize: jpeg.length,
      },
    })
    try {
      const dry = await convertExistingPhotos(w.payload, { tenantID: String(w.clubA.id) })
      expect(dry.converted).toBe(0)
      expect(dry.bytesAfter).toBeLessThan(dry.bytesBefore)

      const done = await convertExistingPhotos(w.payload, {
        apply: true,
        tenantID: String(w.clubA.id),
      })
      expect(done.failed).toEqual([])
      expect(done.oldKeys).toContain(oldKey)

      const after = await w.payload.findByID({
        collection: 'media',
        id: seed.id,
        overrideAccess: true,
      })
      expect(after.mimeType).toBe('image/webp')
      expect(after.filename).toBe('old-photo.webp')
      const stored = Buffer.from(await (await fetch(after.url!)).arrayBuffer())
      expect((await sharp(stored).metadata()).format).toBe('webp')
      // The old file is still there for pages that were cached before the change.
      expect((await fetch(`${publicURL}/${oldKey}`)).ok).toBe(true)
    } finally {
      await w.payload.delete({ collection: 'media', id: seed.id, overrideAccess: true })
    }
  })
})
