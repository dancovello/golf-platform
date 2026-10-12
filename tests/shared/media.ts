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
