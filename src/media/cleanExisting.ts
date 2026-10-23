import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { Payload } from 'payload'
import sharp, { type Sharp } from 'sharp'

import { mediaStorageSettings } from './storage'

/**
 * One-off clean-up for photos uploaded before 23 October 2026 (uploads audit, finding 1): new
 * uploads are cleaned by Payload (src/media/cleanOriginal.ts), older originals still carry the
 * phone's hidden details. Re-saves each original that has any, in the same place, the right way
 * up, at high quality. The smaller copies were always clean, so they're left alone.
 *
 * Run through scripts/clean-photo-details.ts. A dry run unless `apply` is true.
 */
const ENCODE: Record<string, (s: Sharp) => Sharp> = {
  'image/jpeg': (s) => s.jpeg({ quality: 92 }),
  'image/png': (s) => s.png(),
  'image/webp': (s) => s.webp({ quality: 92 }),
  'image/avif': (s) => s.avif({ quality: 70 }),
}

type Photo = { id: string | number; url?: string | null; mimeType?: string | null }

export const cleanExistingPhotos = async (payload: Payload, { apply = false } = {}) => {
  const { bucket, publicURL, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const result = { checked: 0, withDetails: 0, cleaned: 0, failed: [] as string[] }

  for (const collection of ['media', 'marketing-media'] as const) {
    const { docs } = await payload.find({
      collection,
      pagination: false,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of docs as Photo[]) {
      const encode = ENCODE[doc.mimeType ?? '']
      if (!encode || !doc.url?.startsWith(`${publicURL}/`)) continue
      result.checked++
      const key = decodeURIComponent(doc.url.slice(publicURL.length + 1))
      try {
        const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
        const original = Buffer.from(await object.Body!.transformToByteArray())
        const meta = await sharp(original).metadata()
        if (!meta.exif && !meta.xmp && !meta.iptc) continue
        result.withDetails++
        if (!apply) continue
        const { data, info } = await encode(sharp(original).rotate().keepIccProfile()).toBuffer({
          resolveWithObject: true,
        })
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: data,
            ContentType: doc.mimeType!,
          }),
        )
        // Turning it the right way up can swap width and height.
        await payload.db.updateOne({
          collection,
          id: doc.id,
          data: { width: info.width, height: info.height, filesize: data.length },
        })
        result.cleaned++
      } catch (error) {
        result.failed.push(`${collection} ${doc.id}: ${(error as Error).message}`)
      }
    }
  }
  return result
}
