import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

/** Long enough for a sleeping database to wake up, short enough to report a hung one. */
export const TIMEOUT_MS = 15_000
/** A flood of calls costs one database query per instance per this long, not one per call. */
export const REUSE_MS = 10_000

type Drizzle = { execute: (query: unknown) => Promise<unknown> }

/**
 * Proves the website can really use its database: it connects as the website's own limited
 * account, and reads the clubs table (so a missing or unfinished database change, or a lost
 * permission, fails too). Nothing from the table is returned or kept.
 */
const ask = async () => {
  const payload = await getPayload({ config })
  const db = (payload.db as unknown as { drizzle: Drizzle }).drizzle
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('no answer in time')), TIMEOUT_MS)
  })
  await Promise.race([db.execute(sql`SELECT 1 FROM tenants LIMIT 1`), timeout]).finally(() =>
    clearTimeout(timer),
  )
}

let last: { at: number; answer: Promise<boolean> } | undefined

/** True when the database answered. The reason for a failure goes to the server log only. */
export const databaseAnswers = (now = Date.now()): Promise<boolean> => {
  if (last && now - last.at < REUSE_MS) return last.answer
  const answer = ask().then(
    () => true,
    (error) => {
      console.error(
        `Health check: the database did not answer (${error instanceof Error ? error.message : 'unknown'})`,
      )
      return false
    },
  )
  last = { at: now, answer }
  return answer
}

/** For tests. */
export const forgetDatabaseAnswer = () => {
  last = undefined
}
