import * as Sentry from '@sentry/nextjs'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { GET as check } from '@/app/(frontend)/cron/club-sites/route'

import { seedWorld } from './helpers/seed'

// The hourly club address check (docs/operations/monitoring.md): a Sentry issue of its own for
// every club whose own web address doesn't answer.

vi.mock('@sentry/nextjs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@sentry/nextjs')>()),
  captureMessage: vi.fn(),
  flush: vi.fn(async () => true),
}))

beforeAll(async () => {
  await seedWorld() // Club A (club-a.localhost) and Club B (club-b.localhost) have web addresses.
})

const call = (authorization?: string) =>
  check(
    new Request('http://localhost/cron/club-sites', {
      headers: authorization ? { authorization } : {},
    }),
  )

const asProduction = () => {
  vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
  vi.stubEnv('SENTRY_DSN', 'https://key@o1.ingest.de.sentry.io/1')
  vi.stubEnv('VERCEL_ENV', 'production')
}
const AUTH = 'Bearer test-only-cron-secret'

describe('the hourly club address check', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.mocked(Sentry.captureMessage).mockClear()
  })

  it("doesn't exist without the scheduler's secret", async () => {
    expect((await call('Bearer anything')).status).toBe(404)
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    expect((await call()).status).toBe(404)
    expect((await call('Bearer wrong')).status).toBe(404)
  })

  it('does nothing outside production, where no club has a real address', async () => {
    vi.stubEnv('CRON_SECRET', 'test-only-cron-secret')
    const fetched = vi.fn()
    vi.stubGlobal('fetch', fetched)
    const response = await call(AUTH)
    expect(await response.json()).toMatchObject({ ok: true, skipped: 'not production' })
    expect(fetched).not.toHaveBeenCalled()
  })

  it("answers ok, and tells Sentry nothing, when every club's page loads", async () => {
    asProduction()
    const fetched = vi.fn(async (_url: string) => new Response('home', { status: 200 }))
    vi.stubGlobal('fetch', fetched)
    const response = await call(AUTH)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, checked: 2, down: 0 })
    const asked = fetched.mock.calls.map((c) => String(c[0])).sort()
    expect(asked).toEqual(['https://club-a.localhost/', 'https://club-b.localhost/'])
    expect(Sentry.captureMessage).not.toHaveBeenCalled()
  })

  it('reports each club that does not answer on its own, and only that club', async () => {
    asProduction()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (String(url).includes('club-a')) return new Response('error', { status: 502 })
        return new Response('home', { status: 200 })
      }),
    )
    const response = await call(AUTH)
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ ok: false, checked: 2, down: 1 })
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(1)
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      'Club site not answering: club-a.localhost',
      {
        level: 'error',
        fingerprint: ['club-site-down', 'club-a.localhost'],
      },
    )
  })

  it('counts a timeout or a refused connection as not answering', async () => {
    asProduction()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('fetch failed')
      }),
    )
    const response = await call(AUTH)
    expect(await response.json()).toEqual({ ok: false, checked: 2, down: 2 })
    expect(Sentry.captureMessage).toHaveBeenCalledTimes(2)
  })
})
