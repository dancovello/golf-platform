import { cookies } from 'next/headers'
import { type Endpoint, getCookieExpiration, jwtSign, type PayloadRequest } from 'payload'

import { emailEnabled } from '../email/adapter'

import { hasEnteredCode, passwordStrategy } from './fullyAuthenticated'
import { clearCode, codeMatches, countGuess, issueCode, CODE_LIFETIME_MS } from './emailCode'

/**
 * The two endpoints behind the emailed sign-in code (decisions.md, 3 Nov):
 *
 * - POST /api/send-email-code: emails the signed-in-with-password account a fresh code.
 * - POST /api/verify-totp: checks the code. The path keeps payload-totp's name, because its
 *   sign-in redirects, the tests and the rate-limit list all use it. On success it writes the
 *   same "code entered" cookie payload-totp always did, so everything that waits for the code
 *   (payload-totp's access rules, ours in superAdminTwoFactor.ts) opens up unchanged.
 *
 * Both answer with plain JSON `{ ok, message }`, like payload-totp's, so the sign-in screen
 * (src/admin/EmailCodeForm.tsx) shows the message as it is.
 */

type Half = { id: string | number; email?: string; hasTotp?: boolean }

const reply = (ok: boolean, message: string | undefined, status = 200) =>
  Response.json({ ok, ...(message ? { message } : {}) }, { status })

/** The account that has entered its password and still owes a code, or null. */
const owingCode = (req: PayloadRequest): Half | null => {
  const user = req.user as (Half & { collection?: string }) | null
  if (!user || user.collection !== 'users' || !user.hasTotp) return null
  return user
}

const SIGN_IN_FIRST = 'Sign in with your password first.'

export const sendEmailCodeEndpoint: Endpoint = {
  path: '/send-email-code',
  method: 'post',
  handler: async (req) => {
    const user = owingCode(req)
    if (!user || hasEnteredCode(user)) return reply(false, SIGN_IN_FIRST, 401)
    if (!user.email) return reply(false, SIGN_IN_FIRST, 401)
    if (!emailEnabled()) {
      return reply(
        false,
        'Email isn’t set up on this server, so a code can’t be sent. Ask the platform owner for one.',
        503,
      )
    }
    const issued = await issueCode(req.payload, user.id)
    if (issued.tooSoon) {
      return reply(false, 'A code was sent a moment ago. Wait a minute before asking again.', 429)
    }
    const minutes = CODE_LIFETIME_MS / 60_000
    try {
      await req.payload.sendEmail({
        to: user.email,
        subject: 'Your sign-in code',
        text: [
          `Your sign-in code is ${issued.code}`,
          '',
          `It works once and expires in ${minutes} minutes.`,
          '',
          'If you did not just try to sign in, you can ignore this email. Nobody can use the code without your password.',
        ].join('\n'),
        html: [
          `<p>Your sign-in code is:</p>`,
          `<p style="font-size:28px;letter-spacing:6px;font-weight:bold">${issued.code}</p>`,
          `<p>It works once and expires in ${minutes} minutes.</p>`,
          `<p>If you did not just try to sign in, you can ignore this email. Nobody can use the code without your password.</p>`,
        ].join(''),
      })
    } catch (error) {
      // The code itself is never logged.
      req.payload.logger.error({ err: error }, 'Could not send a sign-in code email')
      return reply(false, 'We couldn’t send the email. Try again in a minute.', 502)
    }
    return reply(true, undefined)
  },
}

/** Writes the cookie payload-totp's strategy looks for: signed with the app secret, naming the
 * account and the strategy that signed in with the password. Same settings as the login cookie. */
const markCodeEntered = async (req: PayloadRequest, user: Half) => {
  const { payload } = req
  const originalStrategy = passwordStrategy(user)
  // Nothing sensible to record (the strategy would end up pointing at itself).
  if (!originalStrategy) return false
  const auth = payload.collections.users.config.auth
  const { token } = await jwtSign({
    fieldsToSign: { originalStrategy, userId: user.id },
    secret: payload.secret,
    tokenExpiration: auth.tokenExpiration,
  })
  const sameSite =
    typeof auth.cookies.sameSite === 'string'
      ? (auth.cookies.sameSite.toLowerCase() as 'strict' | 'lax' | 'none')
      : auth.cookies.sameSite
        ? 'strict'
        : undefined
  const store = await cookies()
  store.set(`${payload.config.cookiePrefix}-totp`, token, {
    domain: auth.cookies.domain ?? undefined,
    expires: getCookieExpiration({ seconds: auth.tokenExpiration }),
    httpOnly: true,
    path: '/',
    sameSite,
    secure: auth.cookies.secure,
  })
  return true
}

export const verifyEmailCodeEndpoint: Endpoint = {
  path: '/verify-totp',
  method: 'post',
  handler: async (req) => {
    const user = owingCode(req)
    if (!user) return reply(false, SIGN_IN_FIRST, 401)
    if (hasEnteredCode(user)) return reply(true, undefined)

    let body: unknown
    try {
      body = req.json ? await req.json() : undefined
    } catch {
      body = undefined
    }
    const token = (body as { token?: unknown } | undefined)?.token
    const code = typeof token === 'string' ? token.trim() : ''
    if (!/^\d{6}$/.test(code)) return reply(false, 'Enter the 6-digit code from the email.')

    const auth = req.payload.collections.users.config.auth
    const guess = await countGuess(req.payload, user.id, auth)
    if (guess.refused) {
      return reply(false, 'Too many wrong codes. Wait 10 minutes, then sign in again.', 429)
    }
    if (!(await codeMatches(req.payload, user.id, code))) {
      return reply(false, 'That code is wrong or has expired. Ask for a new one.')
    }
    // Used up straight away, so the same code can't be typed in a second time later.
    await clearCode(req.payload, user.id)
    await guess.reset()
    if (!(await markCodeEntered(req, user))) return reply(false, SIGN_IN_FIRST, 401)
    return reply(true, undefined)
  },
}
