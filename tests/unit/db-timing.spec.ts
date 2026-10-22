import { describe, expect, it } from 'vitest'

import { dbTimingEnabled, instrumentPool, type Stats } from '@/monitoring/dbTiming'

const fakePool = () => {
  const client = { query: async (sql: unknown) => ({ rows: [sql] }) }
  return {
    client,
    query: async (sql: unknown) => {
      if (sql === 'bad') throw new Error('boom')
      await new Promise((r) => setTimeout(r, 5))
      return { rows: [sql] }
    },
    connect: async () => client,
  }
}

describe('database timing (docs/operations/performance.md)', () => {
  it('is never on in production, whatever else is set', () => {
    expect(dbTimingEnabled({ VERCEL_ENV: 'production' })).toBe(false)
    expect(dbTimingEnabled({ VERCEL_ENV: 'production', DB_TIMING: '1' })).toBe(false)
  })

  it('is on for staging and previews, and locally only when asked', () => {
    expect(dbTimingEnabled({ VERCEL_ENV: 'preview' })).toBe(true)
    expect(dbTimingEnabled({ VERCEL_ENV: 'staging' })).toBe(true)
    expect(dbTimingEnabled({})).toBe(false)
    expect(dbTimingEnabled({ DB_TIMING: '1' })).toBe(true)
  })

  it('counts reads and transaction queries without changing their results or errors', async () => {
    const stats: Stats = { queries: 0, ms: 0, started: 0, reported: false }
    const pool = fakePool()
    instrumentPool(pool, () => stats)
    instrumentPool(pool, () => stats) // a second call changes nothing

    expect(await pool.query('a')).toEqual({ rows: ['a'] })
    await expect(pool.query('bad')).rejects.toThrow('boom')
    const client = await pool.connect()
    expect(await client.query('b')).toEqual({ rows: ['b'] })

    expect(stats.queries).toBe(3)
    expect(stats.ms).toBeGreaterThan(0)
  })
})
