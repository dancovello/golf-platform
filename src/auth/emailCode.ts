import { createHmac, randomInt, timingSafeEqual } from 'node:crypto'

import type { Payload } from 'payload'

/**
 * The emailed sign-in code that replaces the authenticator app (decisions.md, 3 Nov).
 *
 * How it works, in plain English: after the password is accepted, the person asks for a code,
 * we email six digits, and they type them in. A code works once and expires after ten minutes.
 * We never store the code itself, only a keyed fingerprint of it, so a leaked database or
 * backup can't be used to sign in. Wrong guesses are counted and lock the account, exactly as
 * wrong passwords do (5 wrong in a row locks it for 10 minutes).
 *
 * Where it lives: on the `totp-attempts` table that payload-totp already keeps for its code
 * lockout (one row per account, reachable only through the database adapter, never through the
 * API). We add three columns to it (see superAdminTwoFactor.ts). payload-totp still does the
 * rest of the sign-in work: it holds the "code entered" session cookie and refuses access
 * until that cookie is there.
 *
 * The counting below is a copy of payload-totp's own (its internals aren't exported), kept
 * the same on purpose: it counts a guess *before* checking it, with an atomic increment, so a
 * burst of parallel guesses can't get more than the allowed number of tries.
 */

const ATTEMPTS = 'totp-attempts' as never

/** A code works for ten minutes. */
export const CODE_LIFETIME_MS = 10 * 60 * 1000
/** At most one email a minute per account (a double click shouldn't send two). */
export const RESEND_INTERVAL_MS = 60 * 1000

type Row = {
  id: string
  attempts?: number | null
  lockUntil?: string | null
  codeHash?: string | null
  codeExpires?: string | null
  codeSentAt?: string | null
}

/** Six random digits, leading zeros kept. */
export const newCode = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0')

/** The keyed fingerprint stored instead of the code. Tied to the account, so one account's
 * fingerprint can't be copied onto another's row. */
export const fingerprint = (secret: string, userID: string | number, code: string): string =>
  createHmac('sha256', secret).update(`email-code:${userID}:${code}`).digest('hex')

const sameFingerprint = (a: string, b: string): boolean => {
  const x = Buffer.from(a, 'hex')
  const y = Buffer.from(b, 'hex')
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y)
}

// No `req` on any of these calls: a transaction would hide a count from parallel requests.
const findRow = (payload: Payload, userID: string | number): Promise<Row | null> =>
  payload.db.findOne({
    collection: ATTEMPTS,
    where: { id: { equals: String(userID) } },
  }) as Promise<Row | null>

const updateRow = (payload: Payload, userID: string | number, data: Record<string, unknown>) =>
  payload.db.updateOne({
    id: String(userID),
    collection: ATTEMPTS,
    data,
  }) as Promise<Row | null>

/** The account's row, created on first use. A parallel first request may create it between the
 * read and the write: the primary key refuses the second, and the row is then there to read. */
const findOrCreateRow = async (payload: Payload, userID: string | number): Promise<Row> => {
  const existing = await findRow(payload, userID)
  if (existing) return existing
  try {
    return (await payload.db.create({
      collection: ATTEMPTS,
      data: { id: String(userID), attempts: 0 },
    })) as Row
  } catch (error) {
    const created = await findRow(payload, userID)
    if (!created) throw error
    return created
  }
}

const isLocked = (row: Row | null | undefined) =>
  Boolean(row?.lockUntil) && new Date(row!.lockUntil as string) > new Date()

/**
 * Stores a fresh code for the account and returns it for emailing. Refused (`tooSoon`) when
 * one was sent less than a minute ago. A new code replaces the old one, so only the latest
 * works. It does not reset the wrong-guess count, so asking for new codes can't buy more tries.
 */
export const issueCode = async (
  payload: Payload,
  userID: string | number,
  now = Date.now(),
): Promise<{ tooSoon: true } | { tooSoon: false; code: string }> => {
  const row = await findOrCreateRow(payload, userID)
  if (row.codeSentAt && now - new Date(row.codeSentAt).getTime() < RESEND_INTERVAL_MS) {
    return { tooSoon: true }
  }
  const code = newCode()
  await storeCode(payload, userID, code, now)
  return { tooSoon: false, code }
}

/** Saves `code` (as its fingerprint) as the account's current one. `issueCode` uses it with a
 * random code; the tests use it to plant a known one, since they can't read the inbox. */
export const storeCode = async (
  payload: Payload,
  userID: string | number,
  code: string,
  now = Date.now(),
) => {
  await findOrCreateRow(payload, userID)
  await updateRow(payload, userID, {
    codeHash: fingerprint(payload.secret, userID, code),
    codeExpires: new Date(now + CODE_LIFETIME_MS).toISOString(),
    codeSentAt: new Date(now).toISOString(),
  })
}

/** True when `code` is the account's current, unexpired code. Does not use it up. */
export const codeMatches = async (
  payload: Payload,
  userID: string | number,
  code: string,
  now = Date.now(),
): Promise<boolean> => {
  const row = await findRow(payload, userID)
  if (!row?.codeHash || !row.codeExpires) return false
  if (new Date(row.codeExpires).getTime() <= now) return false
  return sameFingerprint(row.codeHash, fingerprint(payload.secret, userID, code))
}

/** Uses the code up, so it can't be typed in a second time. */
export const clearCode = async (payload: Payload, userID: string | number) => {
  await updateRow(payload, userID, { codeHash: null, codeExpires: null })
}

export type GuessCount = {
  /** True when this guess must not even be checked: the account is locked. */
  refused: boolean
  /** Call after a correct code: clears the count and any lock. */
  reset: () => Promise<void>
}

/**
 * Counts one submitted code, so six-digit codes can't be brute-forced. After `maxLoginAttempts`
 * wrong codes the account is locked for `lockTime` (both are the users collection's own login
 * settings, the same as for passwords). The lock is copied onto the account so the password
 * login is refused too.
 */
export const countGuess = async (
  payload: Payload,
  userID: string | number,
  auth: { maxLoginAttempts: number; lockTime: number },
): Promise<GuessCount> => {
  const { maxLoginAttempts, lockTime } = auth
  const none: GuessCount = { refused: false, reset: async () => {} }
  if (maxLoginAttempts <= 0) return none
  const refused: GuessCount = { refused: true, reset: async () => {} }

  const row = await findOrCreateRow(payload, userID)
  if (isLocked(row)) return refused

  const lockAccount = (lockUntil: string | null) =>
    payload.db.updateOne({
      id: userID,
      collection: 'users',
      data: { lockUntil },
      returning: false,
    })

  const counted = await updateRow(payload, userID, { attempts: { $inc: 1 } })
  // A guess that couldn't be counted is not checked.
  if (typeof counted?.attempts !== 'number') return refused
  const attempts = counted.attempts
  // Locked by a parallel request since the read. The lock starts the count over.
  if (isLocked(counted)) {
    await updateRow(payload, userID, { attempts: 0 })
    return refused
  }
  if (attempts >= maxLoginAttempts) {
    const lockUntil = new Date(Date.now() + lockTime).toISOString()
    await updateRow(payload, userID, { attempts: 0, lockUntil })
    await lockAccount(lockUntil)
  }
  // Past the limit: parallel requests already used the last allowed try.
  if (attempts > maxLoginAttempts) return refused
  return {
    refused: false,
    // The last allowed try locked the account before it was checked; a correct code lifts that.
    reset: async () => {
      if (attempts === maxLoginAttempts) {
        await updateRow(payload, userID, { attempts: 0, lockUntil: null })
        await lockAccount(null)
      } else {
        await updateRow(payload, userID, { attempts: 0 })
      }
    },
  }
}
