import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import {
  clearCode,
  CODE_LIFETIME_MS,
  codeMatches,
  countGuess,
  fingerprint,
  issueCode,
  newCode,
  RESEND_INTERVAL_MS,
  storeCode,
} from '@/auth/emailCode'

import { createEditor, seedWorld, type World } from './helpers/seed'

let w: World
let id: string
const auth = { maxLoginAttempts: 5, lockTime: 10 * 60 * 1000 }

beforeAll(async () => {
  w = await seedWorld()
})

/** A fresh account per test, so one test's count or code never leaks into the next. */
const freshAccount = async () => {
  const user = await createEditor(
    w.payload,
    `code-${Date.now()}-${Math.random()}@example.com`,
    w.clubA.id,
  )
  id = user.id
  return user.id
}

const rawRow = async (userID: string) => {
  const result = await w.payload.db.drizzle.execute(
    sql`SELECT * FROM totp_attempts WHERE id = ${userID}`,
  )
  return result.rows[0] as Record<string, unknown> | undefined
}

describe('the emailed sign-in code', () => {
  it('is six digits, and the digits vary', () => {
    const codes = new Set(Array.from({ length: 50 }, newCode))
    expect([...codes].every((c) => /^\d{6}$/.test(c))).toBe(true)
    expect(codes.size).toBeGreaterThan(40)
  })

  it('is stored as a fingerprint, never as the code itself', async () => {
    await freshAccount()
    const issued = await issueCode(w.payload, id)
    if (issued.tooSoon) throw new Error('first code was refused')
    const row = await rawRow(id)
    const stored = JSON.stringify(row)
    expect(stored).not.toContain(issued.code)
    expect(row?.code_hash).toBe(fingerprint(w.payload.secret, id, issued.code))
  })

  it('works with the right code and not with another', async () => {
    await freshAccount()
    const issued = await issueCode(w.payload, id)
    if (issued.tooSoon) throw new Error('first code was refused')
    const wrong = issued.code === '000000' ? '111111' : '000000'
    expect(await codeMatches(w.payload, id, wrong)).toBe(false)
    expect(await codeMatches(w.payload, id, issued.code)).toBe(true)
  })

  it("is tied to its account: another account's row never accepts it", async () => {
    const first = await freshAccount()
    const issued = await issueCode(w.payload, first)
    if (issued.tooSoon) throw new Error('first code was refused')
    const second = await freshAccount()
    await storeCode(w.payload, second, '123456')
    expect(await codeMatches(w.payload, second, issued.code)).toBe(false)
    expect(fingerprint(w.payload.secret, first, '123456')).not.toBe(
      fingerprint(w.payload.secret, second, '123456'),
    )
  })

  it('stops working once used', async () => {
    await freshAccount()
    await storeCode(w.payload, id, '482913')
    expect(await codeMatches(w.payload, id, '482913')).toBe(true)
    await clearCode(w.payload, id)
    expect(await codeMatches(w.payload, id, '482913')).toBe(false)
  })

  it('expires after ten minutes', async () => {
    await freshAccount()
    const now = Date.now()
    await storeCode(w.payload, id, '482913', now)
    expect(await codeMatches(w.payload, id, '482913', now + CODE_LIFETIME_MS - 1000)).toBe(true)
    expect(await codeMatches(w.payload, id, '482913', now + CODE_LIFETIME_MS + 1000)).toBe(false)
  })

  it('a new code replaces the old one', async () => {
    await freshAccount()
    const now = Date.now()
    await storeCode(w.payload, id, '111111', now)
    const next = await issueCode(w.payload, id, now + RESEND_INTERVAL_MS + 1000)
    if (next.tooSoon) throw new Error('second code was refused')
    expect(await codeMatches(w.payload, id, '111111', now + RESEND_INTERVAL_MS + 2000)).toBe(
      next.code === '111111',
    )
    expect(await codeMatches(w.payload, id, next.code, now + RESEND_INTERVAL_MS + 2000)).toBe(true)
  })

  it('can be asked for once a minute, not more', async () => {
    await freshAccount()
    const now = Date.now()
    expect((await issueCode(w.payload, id, now)).tooSoon).toBe(false)
    expect((await issueCode(w.payload, id, now + RESEND_INTERVAL_MS - 1000)).tooSoon).toBe(true)
    expect((await issueCode(w.payload, id, now + RESEND_INTERVAL_MS + 1000)).tooSoon).toBe(false)
  })

  it('an account with no code asked for never matches anything', async () => {
    await freshAccount()
    expect(await codeMatches(w.payload, id, '000000')).toBe(false)
  })
})

describe('wrong codes lock the account, like wrong passwords', () => {
  it('locks after five wrong codes and refuses the sixth outright', async () => {
    await freshAccount()
    for (let i = 0; i < 5; i++) {
      expect((await countGuess(w.payload, id, auth)).refused).toBe(false)
    }
    expect((await countGuess(w.payload, id, auth)).refused).toBe(true)
    // Payload hides the lock from reads, so check it in the database.
    const result = await w.payload.db.drizzle.execute(
      sql`SELECT lock_until FROM users WHERE id = ${id}`,
    )
    const lockUntil = (result.rows[0] as { lock_until: string | Date | null }).lock_until
    expect(new Date(lockUntil as string).getTime()).toBeGreaterThan(Date.now())
  })

  it('asking for new codes does not reset the count', async () => {
    await freshAccount()
    const now = Date.now()
    for (let i = 0; i < 4; i++) await countGuess(w.payload, id, auth)
    await issueCode(w.payload, id, now)
    await issueCode(w.payload, id, now + RESEND_INTERVAL_MS + 1000)
    expect((await countGuess(w.payload, id, auth)).refused).toBe(false) // the fifth
    expect((await countGuess(w.payload, id, auth)).refused).toBe(true) // the sixth
  })

  it('a correct code clears the count', async () => {
    await freshAccount()
    for (let i = 0; i < 3; i++) await countGuess(w.payload, id, auth)
    await (await countGuess(w.payload, id, auth)).reset()
    expect(Number((await rawRow(id))?.attempts)).toBe(0)
  })
})
