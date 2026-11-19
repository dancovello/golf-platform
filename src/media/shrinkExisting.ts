import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { mediaStorageSettings } from './storage'

/**
 * One-off: gives photos uploaded before 19 November 2026 the same shape as new ones (Dan: the
 * larger sizes "just take up valuable space"; src/media/cleanOriginal.ts). Afterwards every photo
 * is 640 and 1024 wide copies, and nothing bigger is kept.
 *
 *  1. A photo's saved original wider than 1024 is replaced by its own 1024 copy, which already
 *     exists and is the same picture: the record's main file is pointed at it. No new file is made.
 *  2. The 1600, 2400 and 3200 copies are no longer used by anything. They are listed to be removed.
 *
 * Nothing is deleted here: pages are cached for up to an hour and may still point at the old
 * files. Their storage names are returned, to be removed later with `removeOldFiles`
 * (src/media/convertExisting.ts). A dry run (the default) only measures what would be saved.
 *
 * It reads the old size columns straight from the database, because the photo settings no longer
 * know them. So it must be run BEFORE the migration that drops those columns
 * (src/migrations/*_drop_large_photo_sizes.ts), or the large copies can't be found any more.
 *
 * Run through scripts/shrink-photos.ts.
 */
const MAX = 1024
const LARGE = ['w1600', 'w2400', 'w3200'] as const

type Row = {
  id: number | string
  url: string | null
  filename: string | null
  mime_type: string | null
  filesize: string | number | null
  width: string | number | null
  s1024_url: string | null
  s1024_filename: string | null
  s1024_mime_type: string | null
  s1024_filesize: string | number | null
  s1024_width: string | number | null
  s1024_height: string | number | null
  w1600_url: string | null
  w1600_filesize: string | number | null
  w2400_url: string | null
  w2400_filesize: string | number | null
  w3200_url: string | null
  w3200_filesize: string | number | null
}

export type ShrinkResult = {
  /** Photos looked at, per library. */
  checked: number
  /** Photos whose main file was pointed at the 1024 copy. */
  originalsReplaced: number
  /** Large copies found (1600, 2400 and 3200). */
  largeCopies: number
  bytesFreed: number
  skipped: string[]
  failed: string[]
  /** Storage names of the files to remove once cached pages have refreshed. */
  oldKeys: string[]
}

const TABLES = ['media', 'marketing_media'] as const
type Table = (typeof TABLES)[number]

const n = (value: string | number | null | undefined) => Number(value ?? 0) || 0

/** True if the photo table still has the old size columns (they are dropped by the migration). */
const hasLargeColumns = async (payload: Payload, table: Table) => {
  const { rows } = await payload.db.drizzle.execute(sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = ${table} AND column_name = 'sizes_w1600_url'
  `)
  return rows.length > 0
}

const readRows = async (payload: Payload, table: Table): Promise<Row[]> => {
  const query =
    table === 'media'
      ? sql`SELECT id, url, filename, mime_type, filesize, width,
              sizes_w1024_url AS s1024_url, sizes_w1024_filename AS s1024_filename,
              sizes_w1024_mime_type AS s1024_mime_type, sizes_w1024_filesize AS s1024_filesize,
              sizes_w1024_width AS s1024_width, sizes_w1024_height AS s1024_height,
              sizes_w1600_url AS w1600_url, sizes_w1600_filesize AS w1600_filesize,
              sizes_w2400_url AS w2400_url, sizes_w2400_filesize AS w2400_filesize,
              sizes_w3200_url AS w3200_url, sizes_w3200_filesize AS w3200_filesize
            FROM media`
      : sql`SELECT id, url, filename, mime_type, filesize, width,
              sizes_w1024_url AS s1024_url, sizes_w1024_filename AS s1024_filename,
              sizes_w1024_mime_type AS s1024_mime_type, sizes_w1024_filesize AS s1024_filesize,
              sizes_w1024_width AS s1024_width, sizes_w1024_height AS s1024_height,
              sizes_w1600_url AS w1600_url, sizes_w1600_filesize AS w1600_filesize,
              sizes_w2400_url AS w2400_url, sizes_w2400_filesize AS w2400_filesize,
              sizes_w3200_url AS w3200_url, sizes_w3200_filesize AS w3200_filesize
            FROM marketing_media`
  const { rows } = await payload.db.drizzle.execute(query)
  return rows as unknown as Row[]
}

const pointMainFileAt = async (payload: Payload, table: Table, id: Row['id'], row: Row) => {
  const url = row.s1024_url
  const filename = row.s1024_filename
  const mime = row.s1024_mime_type
  const size = n(row.s1024_filesize)
  const width = n(row.s1024_width)
  const height = n(row.s1024_height)
  const query =
    table === 'media'
      ? sql`UPDATE media SET url = ${url}, filename = ${filename}, mime_type = ${mime},
              filesize = ${size}, width = ${width}, height = ${height} WHERE id = ${id}`
      : sql`UPDATE marketing_media SET url = ${url}, filename = ${filename}, mime_type = ${mime},
              filesize = ${size}, width = ${width}, height = ${height} WHERE id = ${id}`
  await payload.db.drizzle.execute(query)
}

export const shrinkExistingPhotos = async (
  payload: Payload,
  { apply = false }: { apply?: boolean } = {},
): Promise<ShrinkResult> => {
  const { bucket, publicURL, config } = mediaStorageSettings()
  const s3 = new S3Client(config)
  const prefix = `${publicURL}/`
  const keyOf = (url: string) => decodeURIComponent(url.slice(prefix.length))
  const dirOf = (key: string) => key.split('/').slice(0, -1).join('/')

  const result: ShrinkResult = {
    checked: 0,
    originalsReplaced: 0,
    largeCopies: 0,
    bytesFreed: 0,
    skipped: [],
    failed: [],
    oldKeys: [],
  }
  const remove = new Set<string>()

  for (const table of TABLES) {
    if (!(await hasLargeColumns(payload, table))) {
      result.skipped.push(`${table}: the old size columns are already gone, nothing to look for`)
      continue
    }
    for (const row of await readRows(payload, table)) {
      if (!row.url?.startsWith(prefix) || !String(row.mime_type ?? '').startsWith('image/'))
        continue
      if (row.mime_type === 'image/svg+xml') continue
      result.checked++
      const label = `${table} ${row.id}`
      try {
        const keep = new Set<string>()
        if (row.s1024_url?.startsWith(prefix)) keep.add(keyOf(row.s1024_url))
        const mainKey = keyOf(row.url)

        // 1. The saved original, if it is bigger than the largest copy we keep.
        let replace = false
        if (n(row.width) > MAX && row.s1024_url?.startsWith(prefix) && row.s1024_filename) {
          const copyKey = keyOf(row.s1024_url)
          if (copyKey === mainKey) {
            // Already the same file.
          } else if (dirOf(copyKey) !== dirOf(mainKey)) {
            result.skipped.push(`${label}: its 1024 copy is in a different folder`)
          } else {
            await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: copyKey })) // must exist
            replace = true
            result.bytesFreed += Math.max(0, n(row.filesize) - n(row.s1024_filesize))
            remove.add(mainKey)
          }
        } else if (n(row.width) > MAX) {
          result.skipped.push(`${label}: original is ${row.width} wide but it has no 1024 copy`)
        }

        // 2. The three large copies.
        for (const name of LARGE) {
          const url = row[`${name}_url`]
          if (!url?.startsWith(prefix)) continue
          const key = keyOf(url)
          if (key === mainKey && !replace) continue // original was never enlarged: same file
          result.largeCopies++
          result.bytesFreed += n(row[`${name}_filesize`])
          remove.add(key)
        }

        if (apply && replace) {
          await pointMainFileAt(payload, table, row.id, row)
          result.originalsReplaced++
        } else if (replace) {
          result.originalsReplaced++
        }
        for (const key of keep) remove.delete(key)
      } catch (error) {
        result.failed.push(`${label}: ${(error as Error).message}`)
      }
    }
  }
  result.oldKeys = [...remove]
  return result
}
