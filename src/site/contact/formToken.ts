import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * The Contact form's time check. The page hands out a token saying which club the form is for
 * and when it was shown, signed with the app's secret so it can't be forged. A message sent
 * within seconds of the page loading is almost certainly a bot; a token over a day old has
 * expired. No IP address or other visitor detail goes into it.
 */
export const MIN_FILL_MS = 3_000
export const MAX_AGE_MS = 24 * 60 * 60 * 1000

const sign = (body: string) => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) throw new Error('PAYLOAD_SECRET is not set')
  return createHmac('sha256', `contact-form:${secret}`).update(body).digest('base64url')
}

export const issueFormToken = (tenantID: string, now = Date.now()) => {
  const body = `${tenantID}.${now}`
  return `${body}.${sign(body)}`
}

export type TokenCheck = 'ok' | 'too-fast' | 'expired' | 'invalid'

export const checkFormToken = (token: unknown, tenantID: string, now = Date.now()): TokenCheck => {
  if (typeof token !== 'string' || token.length > 200) return 'invalid'
  const parts = token.split('.')
  if (parts.length !== 3) return 'invalid'
  const [club, issuedAt, signature] = parts
  const expected = Buffer.from(sign(`${club}.${issuedAt}`))
  const given = Buffer.from(signature)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return 'invalid'
  if (club !== tenantID) return 'invalid'
  const age = now - Number(issuedAt)
  if (!Number.isFinite(age) || age < 0) return 'invalid'
  if (age < MIN_FILL_MS) return 'too-fast'
  return age > MAX_AGE_MS ? 'expired' : 'ok'
}
