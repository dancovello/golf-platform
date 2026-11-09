import config from '@payload-config'
import * as Sentry from '@sentry/nextjs'
import { getPayload } from 'payload'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { GET as check } from '@/app/(frontend)/cron/database-check/route'

// The hourly database check (docs/operations/monitoring.md): emails through Sentry when the
// club sites can't reach the database.

vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  captureMessage: vi.fn(),
  flush: vi.fn(async () => true),
}))

const call = (authorization?: string) =>
  check(
    new Request('http://localhost/cron/database-check', {
      headers: authorization ? { authorization } : {},
    }),
  )

describe('the hourly database check', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    vi.mocked(Sentry.captureMessage).mockClear()
  })

  it("doesn't exist without the scheduler's secret", async () => {
    expect((await call('Bearer anything')).status).toBe(404)
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    expect((await call()).status).toBe(404)
    expect((await call('Bearer wrong')).status).toBe(404)
  })

  it('answers ok when the database answers, and sends nothing to Sentry', async () => {
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    vi.stubEnv('SENTRY_DSN', 'https://key@o1.ingest.de.sentry.io/1')
    const response = await call('Bearer test-only-cron-secret')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it("reports to Sentry when the database doesn't answer", async () => {
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    vi.stubEnv('SENTRY_DSN', 'https://key@o1.ingest.de.sentry.io/1')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const payload = await getPayload({ config: await config })
    const db = (payload.db as unknown as { drizzle: { execute: () => Promise<unknown> } }).drizzle
    vi.spyOn(db, 'execute').mockRejectedValueOnce(new Error('Connection terminated'))

    const response = await call('Bearer test-only-cron-secret')
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ ok: false })
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Database check failed: club sites cannot reach the database',
      'fatal',
    )
  })
})
