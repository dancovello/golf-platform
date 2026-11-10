import config from '@payload-config'
import { getPayload } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET as health } from '@/app/(frontend)/health/database/route'
import { forgetDatabaseAnswer } from '@/monitoring/databaseHealth'

// The release check: a deployment that can't use its database must not count as healthy.

const database = async () => {
  const payload = await getPayload({ config: await config })
  return (payload.db as unknown as { drizzle: { execute: () => Promise<unknown> } }).drizzle
}

describe('the database health check', () => {
  afterEach(() => {
    forgetDatabaseAnswer()
    vi.restoreAllMocks()
  })

  it('answers ok when the database answers', async () => {
    const response = await health()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok' })
  })

  it("fails when the database doesn't answer, and says nothing about why", async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(await database(), 'execute').mockRejectedValueOnce(
      new Error('password authentication failed for user golf_app'),
    )
    const response = await health()
    expect(response.status).toBe(503)
    const body = await response.text()
    expect(body).toBe('{"status":"database unavailable"}')
    expect(body).not.toContain('golf_app')
  })

  it('fails when the clubs table cannot be read (an unfinished database change)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(await database(), 'execute').mockRejectedValueOnce(
      new Error('relation "tenants" does not exist'),
    )
    expect((await health()).status).toBe(503)
  })

  it('asks the database once for a burst of calls', async () => {
    const execute = vi.spyOn(await database(), 'execute')
    await Promise.all([health(), health(), health()])
    await health()
    expect(execute).toHaveBeenCalledTimes(1)
  })
})
