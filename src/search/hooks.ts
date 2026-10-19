import { sql } from '@payloadcms/db-postgres'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import { idOf } from '../blocks/types'

/**
 * Keeping each club's search index up to date, cheaply:
 *
 * 1. Saving or deleting anything a club's site shows adds one to the club's change count
 *    (hooks below, inside the same database transaction as the save).
 * 2. The next search for that club sees the index is behind and rebuilds it first
 *    (ensureFreshIndex in ./fresh.ts), which takes a moment once, then searches are instant again.
 *
 * Nothing is rebuilt while editors type, and a club nobody searches is never rebuilt.
 */

// The parts of Payload's Postgres adapter used here.
type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }
type Adapter = { drizzle: Executor; sessions?: Record<string, { db?: Executor }> }

/** The database connection for this request: its open transaction if it has one. */
const connectionFor = async (req: PayloadRequest): Promise<Executor> => {
  const adapter = req.payload.db as unknown as Adapter
  const id = req.transactionID instanceof Promise ? await req.transactionID : req.transactionID
  return (id && adapter.sessions?.[String(id)]?.db) || adapter.drizzle
}

const markChanged = async (req: PayloadRequest, tenant: unknown) => {
  const tenantID = idOf(tenant)
  if (!tenantID) return
  const db = await connectionFor(req)
  await db.execute(sql`
    INSERT INTO search_state (tenant_id, changes) VALUES (${tenantID}, 1)
    ON CONFLICT (tenant_id) DO UPDATE SET changes = search_state.changes + 1`)
}

/** On every collection whose content the site can show (src/collections). */
export const searchAfterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
  await markChanged(req, doc?.tenant)
  // A record moved to another club changes both clubs' sites (the super-admin can do this).
  if (previousDoc?.tenant && idOf(previousDoc.tenant) !== idOf(doc?.tenant)) {
    await markChanged(req, previousDoc.tenant)
  }
  return doc
}

export const searchAfterDelete: CollectionAfterDeleteHook = async ({ doc, req }) => {
  await markChanged(req, doc?.tenant)
  return doc
}

export const searchHooks = {
  afterChange: [searchAfterChange],
  afterDelete: [searchAfterDelete],
}
