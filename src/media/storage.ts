/**
 * Where photos and videos are stored: Cloudflare R2 on staging and production, a local
 * S3-compatible server (SeaweedFS, docker-compose.yml) for development and tests. Never the
 * app's own disk (CLAUDE.md, decided stack).
 *
 * Files are public at MEDIA_PUBLIC_URL, a separate cookie-less domain (doc 04 §8), under a
 * random folder per file so addresses can't be guessed. The bucket itself can't be listed.
 */
import type { S3ClientConfig } from '@aws-sdk/client-s3'

// Trimmed: values pasted into Vercel can carry invisible line breaks, and a key ID with a
// trailing newline makes every upload link invalid (seen on staging, 2026-10-12).
const required = (name: string): string => {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const mediaStorageSettings = () => ({
  bucket: required('MEDIA_S3_BUCKET'),
  publicURL: required('MEDIA_PUBLIC_URL').replace(/\/+$/, ''),
  config: {
    endpoint: required('MEDIA_S3_ENDPOINT'),
    region: 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: required('MEDIA_S3_ACCESS_KEY_ID'),
      secretAccessKey: required('MEDIA_S3_SECRET_ACCESS_KEY'),
    },
    // The AWS toolkit otherwise signs upload links with a checksum of an empty body, so every
    // browser upload is rejected (seen against SeaweedFS; R2 validates checksums the same way).
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  } satisfies S3ClientConfig,
})
