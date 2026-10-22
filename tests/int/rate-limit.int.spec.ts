/**
 * Shared rate limits (job 4, 21 Oct grilling): two servers counting into one database enforce
 * one limit between them, not one each.
 */
import { sql } from '@payloadcms/db-postgres'
import { drizzle } from '@payloadcms/db-postgres/drizzle/node-postgres'
import type { Payload } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { runCleanUp } from '@/privacy/cleanUp'
import { allowRequest, type Limit } from '@/security/rateLimit'

import { getTestPayload } from './helpers/seed'

type Db = Parameters<typeof allowRequest>[0]

let payload: Payload
let serverA: Db
let serverB: Db
let pool: { end: () => Promise<void> }

const LIMIT: Limit = { name: 'test', max: 5, windowSeconds: 60 }
const now = new Date('2026-10-22T10:00:10Z')

beforeAll(async () => {
  payload = await getTestPayload()
  serverA = (payload.db as unknown as { drizzle: Db }).drizzle
  // A second, separate connection pool to the same database: a second server.
  const { Pool } = (payload.db as unknown as { pg: { Pool: new (o: object) => typeof pool } }).pg
  pool = new Pool({ connectionString: process.env.DATABASE_URL })
  serverB = drizzle({ client: pool as never }) as unknown as Db
})

afterAll(async () => {
  await pool.end()
})

beforeEach(async () => {
  await serverA.execute(sql`DELETE FROM rate_limits`)
})

describe('one limit, however many servers', () => {
  it('two servers sharing the database allow the limit between them, not each', async () => {
    const results: boolean[] = []
    for (let i = 0; i < 8; i++) {
      results.push(await allowRequest(i % 2 ? serverB : serverA, LIMIT, '203.0.113.9', now))
    }
    expect(results).toEqual([true, true, true, true, true, false, false, false])
  })

  it('counts arriving at the same moment still stop at the limit', async () => {
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        allowRequest(i % 2 ? serverB : serverA, LIMIT, '203.0.113.10', now),
      ),
    )
    expect(results.filter(Boolean)).toHaveLength(LIMIT.max)
  })

  it('another visitor, another limit and the next window each start afresh', async () => {
    for (let i = 0; i < LIMIT.max; i++) await allowRequest(serverA, LIMIT, '203.0.113.11', now)
    expect(await allowRequest(serverB, LIMIT, '203.0.113.11', now)).toBe(false)
    expect(await allowRequest(serverB, LIMIT, '198.51.100.1', now)).toBe(true)
    expect(await allowRequest(serverB, { ...LIMIT, name: 'other' }, '203.0.113.11', now)).toBe(true)
    const nextWindow = new Date(now.getTime() + 60_000)
    expect(await allowRequest(serverB, LIMIT, '203.0.113.11', nextWindow)).toBe(true)
  })

  it('never stores an address', async () => {
    await allowRequest(serverA, LIMIT, '203.0.113.12', now)
    const { rows } = await serverA.execute(sql`SELECT key FROM rate_limits`)
    expect(JSON.stringify(rows)).not.toContain('203.0.113')
  })

  it('the nightly clean-up deletes counts more than a day old', async () => {
    const old = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    await allowRequest(serverA, LIMIT, '203.0.113.13', old)
    await allowRequest(serverA, LIMIT, '203.0.113.13', new Date())
    const result = await runCleanUp(payload, { files: false })
    expect(result.counts).toBe(1)
    const { rows } = await serverA.execute(sql`SELECT count(*)::int AS n FROM rate_limits`)
    expect((rows[0] as { n: number }).n).toBe(1)
  })
})
