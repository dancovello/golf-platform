import type { ErrorEvent } from '@sentry/nextjs'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { scrubEvent, sentryEnabled, sentryOptions } from '@/monitoring/sentry'

describe('error alerts never send personal details (step 6)', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('is off without SENTRY_DSN', () => {
    vi.stubEnv('SENTRY_DSN', '')
    expect(sentryEnabled()).toBe(false)
    vi.stubEnv('SENTRY_DSN', 'https://key@o1.ingest.de.sentry.io/1')
    expect(sentryEnabled()).toBe(true)
  })

  it('keeps only the method and path of the request', () => {
    const event = scrubEvent({
      type: undefined,
      message: 'Failed for visitor@example.com',
      request: {
        method: 'POST',
        url: 'https://www.club.co.uk/contact?about=membership&email=a@b.co',
        headers: { cookie: 'payload-token=secret', 'x-forwarded-for': '203.0.113.9' },
        cookies: { 'payload-token': 'secret' },
        data: { name: 'Dan', email: 'dan@example.com' },
        query_string: 'email=a@b.co',
      },
      user: { id: '1', email: 'editor@example.com', ip_address: '203.0.113.9' },
      breadcrumbs: [{ message: 'typed dan@example.com' }],
      extra: { body: 'secret' },
      exception: { values: [{ type: 'Error', value: 'No account for editor@example.com' }] },
    } as ErrorEvent)
    expect(event.request).toEqual({ method: 'POST', url: 'https://www.club.co.uk/contact' })
    expect(event.user).toBeUndefined()
    expect(event.breadcrumbs).toBeUndefined()
    expect(event.extra).toBeUndefined()
    expect(event.message).toBe('Failed for [email]')
    expect(event.exception?.values?.[0].value).toBe('No account for [email]')
    expect(JSON.stringify(event)).not.toMatch(/@example\.com|203\.0\.113\.9|secret/)
  })

  it('sends errors only, with no tracing or default personal data', () => {
    const options = sentryOptions()
    expect(options).toMatchObject({ tracesSampleRate: 0, maxBreadcrumbs: 0, sendDefaultPii: false })
  })
})
