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

import { clubOwnedCollections } from '@/tenancy'

import { seedWorld } from './helpers/seed'

type PoolClient = {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
  release: () => void
}

let payload: Payload
let client: PoolClient

beforeAll(async () => {
  // Its own clubs and accounts (a super-admin and editors), whatever ran before.
  payload = (await seedWorld()).payload
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
  it('golf_app cannot mark a database change as applied', async () => {
    await expect(
      tryAsApp(
        `INSERT INTO payload_migrations (name, batch) VALUES ('29991231_000000_future_fix', 99)`,
      ),
    ).rejects.toThrow(/permission denied/)
  })

  it('golf_app cannot remove a database change from the list', async () => {
    await expect(tryAsApp('DELETE FROM payload_migrations')).rejects.toThrow(/permission denied/)
  })
})

describe('Finding 5 (low): the website account can add a super-admin directly', () => {
  // Super-admins see every club. Only Dan's script should ever make one, but the database lets
  // the website's own account insert one, skipping two-factor set-up and every app check.
  it('golf_app cannot insert a super-admin account', async () => {
    await expect(
      tryAsApp(`INSERT INTO users (email, role) VALUES ('audit-probe@example.com', 'super-admin')`),
    ).rejects.toThrow(/permission denied|super-admin/)
  })
})

describe('Finding 5: no other way for golf_app to make a super-admin', () => {
  // The initial migration's "an account's type and club never change" trigger already refuses
  // this; checked here so the two rules are seen together.
  it('golf_app cannot turn an existing editor into a super-admin', async () => {
    const { rows } = await client.query(`SELECT id FROM users WHERE role = 'editor' LIMIT 1`)
    if (!rows[0]) return
    await expect(
      tryAsApp(`UPDATE users SET role = 'super-admin', tenant_id = NULL WHERE id = $1`, [
        rows[0].id,
      ]),
    ).rejects.toThrow(/cannot be changed/)
  })
})

describe('golf_app can still do what the website needs', () => {
  // Payload saves an existing account as "insert, or update if it exists" (sign-in does it on
  // every login), and Postgres runs insert triggers for that too. The super-admin rule must
  // let it through, or nobody can sign in as a super-admin (seen on CI, 24 Oct 2026).
  it('saves changes to an existing super-admin the way Payload does', async () => {
    const { rows } = await client.query(`SELECT id FROM users WHERE role = 'super-admin' LIMIT 1`)
    expect(rows[0], 'the test database needs a super-admin').toBeTruthy()
    await expect(
      tryAsApp(
        `INSERT INTO users SELECT * FROM users WHERE id = $1
         ON CONFLICT (id) DO UPDATE SET updated_at = now()`,
        [rows[0]!.id],
      ),
    ).resolves.toBeUndefined()
  })

  it('reads the list of applied database changes', async () => {
    await expect(tryAsApp('SELECT count(*) FROM payload_migrations')).resolves.toBeUndefined()
  })

  it('creates an editor (invitations)', async () => {
    const { rows } = await client.query('SELECT id FROM tenants LIMIT 1')
    if (!rows[0]) return
    await expect(
      tryAsApp(`INSERT INTO users (email, role, tenant_id) VALUES ($1, 'editor', $2)`, [
        'audit-editor-probe@example.com',
        rows[0].id,
      ]),
    ).resolves.toBeUndefined()
  })
})

describe('Finding 6 (low): the real database keeps every club link required and refusing', () => {
  // The saved snapshots disagree with the database about these rules (they were written by
  // hand), so this reads the live database: every club-owned table must have a required club,
  // and deleting a club must be refused while it has content.
  it('every club-owned table has a required club that refuses deletion', async () => {
    const tables = Object.keys(clubOwnedCollections).map((slug) => slug.replace(/-/g, '_'))
    const { rows } = await client.query(
      `SELECT c.relname AS table, a.attnotnull AS required, k.confdeltype AS on_delete
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = current_schema()
         LEFT JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'tenant_id'
         LEFT JOIN pg_constraint k ON k.conrelid = c.oid AND k.contype = 'f'
           AND k.conkey = ARRAY[a.attnum] AND k.confrelid = 'tenants'::regclass
        WHERE c.relname = ANY($1)`,
      [tables],
    )
    const found = Object.fromEntries(rows.map((r) => [r.table, r]))
    for (const table of tables) {
      // 'r': ON DELETE RESTRICT.
      expect({ table, ...found[table] }).toEqual({ table, required: true, on_delete: 'r' })
    }
  })
})
