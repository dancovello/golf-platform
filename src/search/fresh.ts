import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import { buildClubEntries } from './build'

/** Raise this when the way entries are built changes, so every club's index is rebuilt. */
export const SEARCH_INDEX_VERSION = 1

// The parts of Payload's Postgres adapter used here.
type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }
type Transactor = Executor & {
  transaction: <T>(fn: (tx: Executor) => Promise<T>) => Promise<T>
}
const database = (payload: Payload) => (payload.db as unknown as { drizzle: Transactor }).drizzle

type StateRow = { changes: number; built_changes: number; version: number }

/** Rebuilds a club's index if anything changed since it was built (see ./hooks.ts). Returns
 * whether it did. */
export const ensureFreshIndex = async (payload: Payload, tenantID: string): Promise<boolean> => {
  const { rows } = await database(payload).execute(
    sql`SELECT changes, built_changes, version FROM search_state WHERE tenant_id = ${tenantID}`,
  )
  const state = rows[0] as StateRow | undefined
  if (
    state &&
    state.built_changes === state.changes &&
    state.version === SEARCH_INDEX_VERSION
  ) {
    return false
  }
  await rebuildIndex(payload, tenantID, state?.changes ?? 0)
  return true
}

/**
 * Replaces a club's index with a fresh one. `changes` is the change count it was read at: if
 * something is saved while this runs, the count moves on and the next search rebuilds again.
 */
export const rebuildIndex = async (payload: Payload, tenantID: string, changes: number) => {
  const entries = await buildClubEntries(payload, tenantID)
  await database(payload).transaction(async (tx) => {
    // One rebuild per club at a time.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`search:${tenantID}`}, 0))`)
    await tx.execute(sql`DELETE FROM search_entries WHERE tenant_id = ${tenantID}`)
    for (let i = 0; i < entries.length; i += 200) {
      const rows = entries.slice(i, i + 200).map(
        (e) => sql`(${tenantID}, ${e.kind}, ${e.sourceID}, ${e.title}, ${e.eyebrow}, ${e.excerpt},
          ${e.body}, ${JSON.stringify(e.link)}::jsonb, ${e.details ? JSON.stringify(e.details) : null}::jsonb,
          ${e.date}::timestamptz, ${e.visibleFrom}::timestamptz, ${e.visibleUntil}::timestamptz)`,
      )
      await tx.execute(sql`
        INSERT INTO search_entries (tenant_id, kind, source_id, title, eyebrow, excerpt, body,
          link, details, date, visible_from, visible_until)
        VALUES ${sql.join(rows, sql`, `)}`)
    }
    await tx.execute(sql`
      INSERT INTO search_state (tenant_id, changes, built_changes, version, built_at)
      VALUES (${tenantID}, ${changes}, ${changes}, ${SEARCH_INDEX_VERSION}, now())
      ON CONFLICT (tenant_id) DO UPDATE
        SET built_changes = ${changes}, version = ${SEARCH_INDEX_VERSION}, built_at = now()`)
  })
}
