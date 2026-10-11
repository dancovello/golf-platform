/**
 * The website's database account (golf_app) can read and write data and nothing more
 * (src/migrations/*_app_role_grants.ts). Each check runs as golf_app via SET ROLE.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { seedWorld, type World } from './helpers/seed'

let w: World
// The small part of node-postgres used here (it comes with Payload's database adapter).
type QueryResult = { rows: Record<string, unknown>[] }
type PoolClient = {
  query: (sql: string, params?: unknown[]) => Promise<QueryResult>
  release: () => void
}
type Pool = { connect: () => Promise<PoolClient> }

let client: PoolClient

beforeAll(async () => {
  w = await seedWorld()
  client = await (w.payload.db as unknown as { pool: Pool }).pool.connect()
})

afterAll(() => client.release())

/** Runs one statement as golf_app, then switches back. */
const asApp = async (statement: string, params: unknown[] = []) => {
  await client.query('SET ROLE golf_app')
  try {
    return await client.query(statement, params)
  } finally {
    await client.query('RESET ROLE')
  }
}

describe('golf_app can do what the website needs', () => {
  it('reads data', async () => {
    const result = await asApp('SELECT count(*)::int AS n FROM pages')
    expect(result.rows[0].n).toBeGreaterThan(0)
  })

  it('creates, changes and deletes records', async () => {
    const inserted = await asApp(
      'INSERT INTO pages (title, slug, tenant_id) VALUES ($1, $2, $3) RETURNING id',
      ['Role check', `role-check-${Date.now()}`, w.clubA.id],
    )
    const id = inserted.rows[0].id
    await asApp('UPDATE pages SET title = $1 WHERE id = $2', ['Role check 2', id])
    await asApp('DELETE FROM pages WHERE id = $1', [id])
  })

  it('uses the counters some Payload tables need', async () => {
    await expect(
      asApp("SELECT nextval(pg_get_serial_sequence('payload_preferences_rels', 'id'))"),
    ).resolves.toBeDefined()
  })
})

describe('golf_app cannot change the database structure or accounts', () => {
  it.each([
    ['create a table', 'CREATE TABLE app_role_probe (id int)'],
    ['change a table', 'ALTER TABLE pages ADD COLUMN probe int'],
    ['drop a table', 'DROP TABLE pages'],
    ['empty a table', 'TRUNCATE pages'],
    ['remove a database rule', 'ALTER TABLE users DROP CONSTRAINT users_role_tenant_check'],
    ['create an account', 'CREATE ROLE app_role_probe LOGIN'],
  ])('cannot %s', async (_label, statement) => {
    await expect(asApp(statement)).rejects.toThrow(/permission denied|must be owner|must be/)
  })

  it('cannot give itself more rights (Postgres grants nothing, with a warning)', async () => {
    await asApp('GRANT ALL ON ALL TABLES IN SCHEMA public TO golf_app WITH GRANT OPTION')
    const rights = await client.query(
      `SELECT has_table_privilege('golf_app', 'pages', 'TRUNCATE') AS truncate,
              has_table_privilege('golf_app', 'pages', 'SELECT WITH GRANT OPTION') AS can_grant`,
    )
    expect(rights.rows[0]).toEqual({ truncate: false, can_grant: false })
  })

  it('the pages table is still intact afterwards', async () => {
    const result = await client.query('SELECT count(*)::int AS n FROM pages')
    expect(result.rows[0].n).toBeGreaterThan(0)
  })
})
