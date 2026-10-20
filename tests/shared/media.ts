import { CreateBucketCommand, S3 } from '@aws-sdk/client-s3'

import { mediaStorageSettings } from '@/media/storage'

/** Creates the test bucket in the local storage stand-in if it isn't there yet. */
export const ensureMediaBucket = async () => {
  const { bucket, config } = mediaStorageSettings()
  if (!/^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(config.endpoint)) {
    throw new Error('Tests must use the local storage stand-in, never real R2')
  }
  try {
    await new S3(config).send(new CreateBucketCommand({ Bucket: bucket }))
  } catch (error) {
    const name = (error as { name?: string }).name
    if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') throw error
  }
}

/** A real 1×1 PNG. */
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

export const pngFile = (name: string, data: Buffer = TINY_PNG) => ({
  data,
  mimetype: 'image/png',
  name,
  size: data.length,
})

/** A real JPEG photo of the given size: a soft two-colour gradient, so resizing has work to do. */
export const photoFile = async (name: string, width = 1800, height = 1000) => {
  const { default: sharp } = await import('sharp')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#5d7a52"/><stop offset="1" stop-color="#c9b48a"/>
    </linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`
  const data = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer()
  return { data, mimetype: 'image/jpeg', name, size: data.length }
}

/** A small, valid one-page PDF (correct cross-reference table), built in code. */
export const TINY_PDF = (() => {
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>',
  ]
  let body = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((o, i) => {
    offsets.push(Buffer.byteLength(body))
    body += `${i + 1} 0 obj\n${o}\nendobj\n`
  })
  const xref = Buffer.byteLength(body)
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  body += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`
  return Buffer.from(body)
})()

export const pdfFile = (name: string) => ({
  data: TINY_PDF,
  mimetype: 'application/pdf',
  name,
  size: TINY_PDF.length,
})
