/** Every route, endpoint and server action has a decided limit (job 4, 21 Oct grilling). */
import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { ENDPOINTS, ROUTES, SERVER_ACTIONS } from '@/security/isolation-manifest'
import { RATE_LIMITS, SIGN_IN_ENDPOINTS } from '@/security/rateLimitInventory'

import { ROOT } from '../shared/sourceScan'

// The isolation manifest is itself checked against the real routes and endpoints
// (tests/int/isolation-manifest.int.spec.ts), so anything new must appear in both.
const everything = [
  ...Object.keys(ROUTES),
  ...Object.keys(ENDPOINTS),
  ...Object.keys(SERVER_ACTIONS),
  ...Object.keys(SIGN_IN_ENDPOINTS),
].sort()

describe('rate-limit inventory', () => {
  it('lists every route, endpoint and server action, and nothing that no longer exists', () => {
    expect(Object.keys(RATE_LIMITS).sort()).toEqual(everything)
  })

  it('every entry says what the limit is and where it is enforced', () => {
    const vague = Object.entries(RATE_LIMITS)
      .filter(([, p]) => p.limit.length < 8 || p.where.length < 8)
      .map(([k]) => k)
    expect(vague).toEqual([])
  })

  it('docs/operations/rate-limits.md names every public sign-in endpoint', () => {
    const doc = fs.readFileSync(path.join(ROOT, 'docs/operations/rate-limits.md'), 'utf8')
    const missing = Object.keys(SIGN_IN_ENDPOINTS)
      .map((k) => k.split(' ')[1])
      .filter((p) => !doc.includes(p))
    expect(missing).toEqual([])
  })
})
