import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'
import type { Payload } from 'payload'
import sharp from 'sharp'

import { cleanOriginal } from './cleanOriginal'
import { mediaStorageSettings } from './storage'

/**
 * One-off: saves photos uploaded before 9 November 2026 as WebP, like new uploads are
 * (src/collections/Media.ts), to save storage (Bearwood's imported photos came to over 500MB).
 *
 * Only JPEG and PNG originals are converted; WebP, AVIF, SVG and videos are left alone. Each
 * photo is saved under the same random folder with a .webp name, and its record is pointed at
 * the new file. The OLD file is NOT deleted here: pages are cached for up to an hour and may
 * still point at it. Its storage name is returned so it can be removed later with
 * `removeOldFiles`. A dry run (the default) only measures what would be saved.
 *
 * Run through scripts/convert-photos-to-webp.ts.
 */
type Photo = {
  id: string | number
  url?: string | null
  filename?: string | null
  mimeType?: string | null
  tenant?: unknown
}

const CONVERTIBLE = new Set(['image/jpeg', 'image/png'])

export type ConvertResult = {
  checked: number
  converted: number
  skipped: string[]
  failed: string[]
  bytesBefore: number
  bytesAfter: number
  /** Storage names of the old files, to remove once cached pages have refreshed. */
  oldKeys: string[]
}

export const convertExistingPhotos = async (
  payload: Payload,
  { apply = false, tenantID }: { apply?: boolean; tenantID?: string } = {},
): Promise<ConvertResult> => {
  const { bucket, publicURL, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const result: ConvertResult = {
    checked: 0,
    converted: 0,
    skipped: [],
    failed: [],
    bytesBefore: 0,
    bytesAfter: 0,
    oldKeys: [],
  }

  const { docs } = await payload.find({
    collection: 'media',
    pagination: false,
    depth: 0,
    overrideAccess: true,
    ...(tenantID ? { where: { tenant: { equals: tenantID } } } : {}),
  })

  for (const doc of docs as Photo[]) {
    if (!CONVERTIBLE.has(doc.mimeType ?? '') || !doc.url?.startsWith(`${publicURL}/`)) continue
    result.checked++
    const key = decodeURIComponent(doc.url.slice(publicURL.length + 1))
    const newKey = key.replace(/\.[A-Za-z0-9]+$/, '') + '.webp'
    const newName =
      (doc.filename ?? key.split('/').pop() ?? '').replace(/\.[A-Za-z0-9]+$/, '') + '.webp'
    try {
      const object = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      const original = Buffer.from(await object.Body!.transformToByteArray())
      const { data, info } = await sharp(original)
        .rotate()
        .resize(cleanOriginal)
        .webp({ quality: 88, smartSubsample: true, alphaQuality: 100 })
        .toBuffer({ resolveWithObject: true })
      // Never swap in a file that isn't smaller.
      if (data.length >= original.length) {
        result.skipped.push(`${doc.id}: WebP not smaller`)
        continue
      }
      result.bytesBefore += original.length
      result.bytesAfter += data.length
      if (!apply) continue

      const clash = await payload.count({
        collection: 'media',
        overrideAccess: true,
        where: {
          and: [
            { filename: { equals: newName } },
            { prefix: { equals: key.split('/').slice(0, -1).join('/') } },
          ],
        },
      })
      if (clash.totalDocs > 0) {
        result.skipped.push(`${doc.id}: ${newName} already exists in that folder`)
        continue
      }
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: newKey,
          Body: data,
          ContentType: 'image/webp',
        }),
      )
      await payload.db.updateOne({
        collection: 'media',
        id: doc.id,
        data: {
          filename: newName,
          url: `${publicURL}/${newKey.split('/').map(encodeURIComponent).join('/')}`,
          mimeType: 'image/webp',
          filesize: data.length,
          width: info.width,
          height: info.height,
        },
      })
      result.oldKeys.push(key)
      result.converted++
    } catch (error) {
      result.failed.push(`media ${doc.id}: ${(error as Error).message}`)
    }
  }
  return result
}

/** Deletes old originals listed by a previous conversion. Returns how many were removed. */
export const removeOldFiles = async (keys: string[]) => {
  const { bucket, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  let removed = 0
  for (const Key of keys) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key }))
    removed++
  }
  return removed
}
