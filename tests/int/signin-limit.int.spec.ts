/**
 * Sign-in limits in code (audit fix plan, step 9, finding M5; audit-auth.md H1): a limit per
 * address on sign-in and reset links, and a daily cap on two-factor code attempts per account.
 */
import { sql } from '@payloadcms/db-postgres'
import type { Payload, PayloadRequest } from 'payload'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { limitCodeAttempts } from '@/auth/superAdminTwoFactor'
import { SIGN_IN_LIMIT, TWO_FACTOR_CODE_LIMIT } from '@/security/rateLimit'

import { PASSWORD, seedWorld, type World } from './helpers/seed'

vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

let w: World
let p: Payload

beforeAll(async () => {
  w = await seedWorld()
  p = w.payload
})

beforeEach(async () => {
  await p.db.drizzle.execute(sql`DELETE FROM rate_limits`)
})

const from = (ip: string) => ({ headers: new Headers({ 'x-real-ip': ip }) }) as never
const attempt = (email: string, password: string, ip?: string) =>
  p
    .login({ collection: 'users', data: { email, password }, ...(ip ? { req: from(ip) } : {}) })
    .then(() => 'signed in')
    .catch((e: Error) => e.message)

describe('sign-in attempts per address', () => {
  it('refuses an address after its limit, even with the right password, and not others', async () => {
    for (let i = 0; i < SIGN_IN_LIMIT.max; i++) {
      // Different, unknown emails: no account locks, only the address count rises.
      expect(
        await attempt(`nobody-${i}@example.com`, 'wrong-password-xyz', '203.0.113.7'),
      ).not.toMatch(/Too many sign-in attempts/)
    }
    expect(await attempt(w.editorA.email, PASSWORD, '203.0.113.7')).toMatch(
      /Too many sign-in attempts from this address/,
    )
    // Another address is unaffected.
    expect(await attempt(w.editorA.email, PASSWORD, '203.0.113.8')).toBe('signed in')
  })

  it('counts "forgot password" against the same limit', async () => {
    for (let i = 0; i < SIGN_IN_LIMIT.max; i++) {
      await p
        .forgotPassword({
          collection: 'users',
          data: { email: `nobody-${i}@example.com` },
          disableEmail: true,
          req: from('203.0.113.9'),
        })
        .catch(() => null)
    }
    expect(await attempt(w.editorA.email, PASSWORD, '203.0.113.9')).toMatch(/Too many sign-in/)
  })

  it('counts nothing where there is no visitor address (scripts, tests, the local API)', async () => {
    for (let i = 0; i < SIGN_IN_LIMIT.max + 5; i++) {
      expect(await attempt(`nobody-${i}@example.com`, 'wrong-password-xyz')).not.toMatch(
        /Too many sign-in/,
      )
    }
    expect(await attempt(w.editorA.email, PASSWORD)).toBe('signed in')
  })

  it('the error does not say whether an email has an account', async () => {
    for (let i = 0; i < SIGN_IN_LIMIT.max; i++)
      await attempt(`a-${i}@example.com`, 'x', '203.0.113.20')
    const known = await attempt(w.editorA.email, 'wrong', '203.0.113.20')
    const unknown = await attempt('no-such@example.com', 'wrong', '203.0.113.20')
    expect(known).toBe(unknown)
  })
})

describe('two-factor code attempts per account, a day', () => {
  const calls = { n: 0 }
  const verify = limitCodeAttempts({
    path: '/verify-totp',
    method: 'post',
    handler: async () => {
      calls.n++
      return Response.json({ ok: true })
    },
  })
  const asUser = (id: string) =>
    ({ payload: p, user: { id }, headers: new Headers() }) as unknown as PayloadRequest

  it('passes attempts through up to the cap, then answers 429 without checking the code', async () => {
    calls.n = 0
    for (let i = 0; i < TWO_FACTOR_CODE_LIMIT.max; i++) {
      expect((await verify.handler(asUser('user-a'))).status).toBe(200)
    }
    const refused = await verify.handler(asUser('user-a'))
    expect(refused.status).toBe(429)
    expect(await refused.text()).toMatch(/Too many code attempts today/)
    expect(calls.n).toBe(TWO_FACTOR_CODE_LIMIT.max)
    // Another account is unaffected.
    expect((await verify.handler(asUser('user-b'))).status).toBe(200)
  })

  it('counts nothing with no signed-in account and no address', async () => {
    calls.n = 0
    const nobody = { payload: p, user: null, headers: new Headers() } as unknown as PayloadRequest
    for (let i = 0; i < TWO_FACTOR_CODE_LIMIT.max + 2; i++) await verify.handler(nobody)
    expect(calls.n).toBe(TWO_FACTOR_CODE_LIMIT.max + 2)
  })
})
