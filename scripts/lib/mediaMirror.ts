/**
 * The nightly second copy of the live photos, videos and documents (audit fix plan, step 5).
 * Run by `.github/workflows/media-backup.yml` through `scripts/media-backup.ts`; the same code
 * is tested against the local storage stand-in (tests/int/media-mirror.int.spec.ts).
 *
 * - **New files are copied.** Every file in the live bucket that the backup doesn't have yet
 *   is copied to `<backup prefix><same key>`. Files are never changed once saved (each sits in
 *   its own random folder), so a file counts as copied when its key and size are already there.
 * - **Removed files are set aside, not deleted.** A file that's in the backup but no longer in
 *   the live bucket is moved to `<removed prefix><same key>`. A lifecycle rule on that prefix
 *   (set in Cloudflare) deletes it 7 days later, so a file removed by mistake can be got back
 *   for a week, and the privacy policy's "backups are deleted within 35 days" stays true.
 * - **A safety brake.** If more files than `maxMoves` look removed, or the live bucket looks
 *   empty while the backup isn't (the wrong or an unreadable bucket), nothing is set aside and
 *   the run fails, so one bad night can't empty the backup. New files are still copied first.
 */
import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3'

export type MirrorSide = {
  client: S3Client
  bucket: string
  /** Everything under this prefix, e.g. "media/production/". Empty means the whole bucket. */
  prefix: string
}

export type MirrorResult = { copied: number; setAside: number; kept: number; bytes: number }

/** More files than this looking removed in one night means something is wrong. */
export const MAX_SET_ASIDE = 200

const CONCURRENCY = 6

/** Every key under the prefix, with its size, with the prefix taken off. */
export const listKeys = async ({ client, bucket, prefix }: MirrorSide) => {
  const found = new Map<string, number>()
  let token: string | undefined
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }),
    )
    for (const object of page.Contents ?? []) {
      const key = object.Key ?? ''
      // A "folder" placeholder, not a file.
      if (!key || key.endsWith('/')) continue
      found.set(key.slice(prefix.length), object.Size ?? 0)
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (token)
  return found
}

/** Runs `task` for each item, a few at a time. The first failure stops the run. */
const inParallel = async <T>(items: T[], task: (item: T) => Promise<void>) => {
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const item = items[next++]!
      await task(item)
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, worker))
}

const copyFile = async (source: MirrorSide, backup: MirrorSide, key: string, size: number) => {
  const got = await source.client.send(
    new GetObjectCommand({ Bucket: source.bucket, Key: `${source.prefix}${key}` }),
  )
  const body = await got.Body!.transformToByteArray()
  await backup.client.send(
    new PutObjectCommand({
      Bucket: backup.bucket,
      Key: `${backup.prefix}${key}`,
      Body: body,
      ContentType: got.ContentType,
    }),
  )
  // Read it back: what was stored must be the size of what was read.
  const head = await backup.client.send(
    new HeadObjectCommand({ Bucket: backup.bucket, Key: `${backup.prefix}${key}` }),
  )
  if (head.ContentLength !== body.length || body.length !== size) {
    throw new Error(`Copy of ${key} is the wrong size (${head.ContentLength} of ${size})`)
  }
}

/** Moves a file inside the backup bucket: copied under the new key, then removed from the old. */
const setAside = async (backup: MirrorSide, from: string, to: string) => {
  const encoded = `${backup.bucket}/${from}`.split('/').map(encodeURIComponent).join('/')
  await backup.client.send(
    new CopyObjectCommand({ Bucket: backup.bucket, Key: to, CopySource: encoded }),
  )
  await backup.client.send(new DeleteObjectCommand({ Bucket: backup.bucket, Key: from }))
}

export const mirrorMedia = async ({
  source,
  backup,
  removedPrefix,
  maxSetAside = MAX_SET_ASIDE,
}: {
  source: MirrorSide
  backup: MirrorSide
  /** Where removed files go, in the backup bucket, e.g. "media/removed/". */
  removedPrefix: string
  maxSetAside?: number
}): Promise<MirrorResult> => {
  if (!backup.prefix || !removedPrefix || removedPrefix.startsWith(backup.prefix)) {
    throw new Error('The backup and removed prefixes must be different, non-empty folders')
  }
  const live = await listKeys(source)
  const saved = await listKeys(backup)

  const toCopy = [...live].filter(([key, size]) => saved.get(key) !== size)
  const removed = [...saved.keys()].filter((key) => !live.has(key))

  // New files first: copying is always safe, even on a night the brake stops the rest.
  let bytes = 0
  await inParallel(toCopy, async ([key, size]) => {
    await copyFile(source, backup, key, size)
    bytes += size
  })

  if (removed.length > 0 && live.size === 0) {
    throw new Error(
      `The live bucket looks empty but the backup has ${saved.size} files. Set nothing aside; check the bucket and the token.`,
    )
  }
  if (removed.length > maxSetAside) {
    throw new Error(
      `${removed.length} files look removed from the live bucket, more than the ${maxSetAside} allowed in one night. Set none aside; check it is the right bucket.`,
    )
  }
  await inParallel(removed, (key) =>
    setAside(backup, `${backup.prefix}${key}`, `${removedPrefix}${key}`),
  )

  return {
    copied: toCopy.length,
    setAside: removed.length,
    kept: live.size - toCopy.length,
    bytes,
  }
}
