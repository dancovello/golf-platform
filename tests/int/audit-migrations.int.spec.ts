/**
 * Security audit of migrations and the release pipeline, 22 Oct 2026
 * (docs/security/audit-migrations.md). Database rights of the website's golf_app account.
 *
 * Each test proves a finding and is marked `it.fails`: it passes CI while the problem exists,
 * and starts failing once the fix lands (the fix's PR then turns `it.fails` into `it`).
 * Every statement runs as golf_app inside a transaction that is always rolled back, so nothing
 * is left behind whether or not the database refuses it.
 */
import type { Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { getTestPayload } from './helpers/seed'

type PoolClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
  release: () => void
}

let payload: Payload
let client: PoolClient

beforeAll(async () => {
  payload = await getTestPayload()
  client = await (
    payload.db as unknown as { pool: { connect: () => Promise<PoolClient> } }
  ).pool.connect()
})

afterAll(() => client.release())

/** Runs one statement as golf_app, then undoes it. Rejects if the database refuses it. */
const tryAsApp = async (statement: string, params: unknown[] = []) => {
  await client.query('BEGIN')
  try {
    await client.query('SET LOCAL ROLE golf_app')
    await client.query(statement, params)
  } finally {
    await client.query('ROLLBACK')
  }
}

describe('Finding 4 (low): the website account can rewrite the list of applied database changes', () => {
  // If the website were ever taken over, an attacker could mark a future security fix as
  // "already applied", and the release would then silently skip it.
  it.fails('golf_app cannot mark a database change as applied', async () => {
    await expect(
      tryAsApp(
        `INSERT INTO payload_migrations (name, batch) VALUES ('29991231_000000_future_fix', 99)`,
      ),
    ).rejects.toThrow(/permission denied/)
  })

  it.fails('golf_app cannot remove a database change from the list', async () => {
    await expect(tryAsApp('DELETE FROM payload_migrations')).rejects.toThrow(/permission denied/)
  })
})

describe('Finding 5 (low): the website account can add a super-admin directly', () => {
  // Super-admins see every club. Only Dan's script should ever make one, but the database lets
  // the website's own account insert one, skipping two-factor set-up and every app check.
  it.fails('golf_app cannot insert a super-admin account', async () => {
    await expect(
      tryAsApp(`INSERT INTO users (email, role) VALUES ('audit-probe@example.com', 'super-admin')`),
    ).rejects.toThrow(/permission denied|super-admin/)
  })
})
