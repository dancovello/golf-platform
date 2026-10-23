import { describe, expect, it } from 'vitest'

import { probeAsCanaryA, type CanaryTargets } from '@/canary/probe'

/**
 * Security audit of the cron and background jobs, 22 October 2026
 * (docs/security/audit-cron-jobs.md), finding CRON-3.
 *
 * KNOWN FAILURE: marked `it.fails`, so it passes while the gap is still there and doesn't
 * block CI. When the fix lands it starts failing: change `it.fails` to `it`.
 */

const targets: CanaryTargets = {
  clubB: { id: '11111111-1111-4111-8111-111111111111', slug: 'canary-b' },
  records: [{ collection: 'pages', id: '22222222-2222-4222-8222-222222222222' }],
  marker: 'CANARY-B-ONLY',
}

/** Runs the probe against a pretend site that refuses everything, and records what it tried. */
const attempts = async () => {
  const seen: { url: string; cookie: string }[] = []
  const fakeFetch = (async (input: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers)
    seen.push({ url: String(input), cookie: headers.get('cookie') ?? '' })
    if (String(input).endsWith('/api/users/login')) return Response.json({ token: 't' })
    return new Response('Not found', { status: 404 })
  }) as typeof fetch
  await probeAsCanaryA({
    baseURL: 'https://admin.example.test',
    email: 'canary-a@example.test',
    password: 'x',
    targets,
    fetch: fakeFetch,
  })
  return seen
}

describe('CRON-3: the canary tries the ways in an attacker would try first', () => {
  // KNOWN FAILURE (CRON-3, low). The canary never sends the club-switcher cookie
  // ("payload-tenant", the multi-tenant plugin's own way of picking a club), never lists the
  // clubs (club editors mustn't even learn club B exists) and never looks at accounts. A leak
  // through any of these would go unnoticed by the canary.
  it.fails(
    'picks club B with the club-switcher cookie, lists clubs and lists accounts',
    async () => {
      const seen = await attempts()
      const path = (url: string) => new URL(url).pathname
      expect(seen.some((s) => s.cookie.includes(`payload-tenant=${targets.clubB.id}`))).toBe(true)
      expect(seen.some((s) => path(s.url) === '/api/tenants')).toBe(true)
      expect(seen.some((s) => path(s.url) === '/api/users')).toBe(true)
    },
  )
})
