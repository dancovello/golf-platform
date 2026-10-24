import { emailEnabled } from '../email/adapter'

/** At most one reset email per account every 15 minutes. Payload quietly ignores requests in
 * between (no email, no new link, the earlier link still works), so a stranger can't flood
 * someone's inbox or use up the platform's daily sending allowance. */
export const RESET_EMAIL_INTERVAL_MS = 15 * 60 * 1000

/**
 * The admin's address for links in emails, from ADMIN_URL (e.g. the staging address). Never
 * from the request: anyone can ask for a reset email, and a forged request address would
 * otherwise put someone else's site in the link, which would then receive the reset code.
 */
export const adminURL = (): string | null => {
  const value = process.env.ADMIN_URL?.trim().replace(/\/+$/, '')
  if (!value) return null
  try {
    const url = new URL(value)
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1'
    return url.protocol === 'https:' || (local && url.protocol === 'http:') ? url.origin : null
  } catch {
    return null
  }
}

/** "Forgot password?" works only where email is set up and the admin's address is known. */
export const passwordResetByEmailEnabled = () => emailEnabled() && adminURL() !== null

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export const resetEmailSubject = () => 'Reset your password'

export const resetEmailHTML = (token: string) => {
  const link = `${adminURL()}/admin/reset/${encodeURIComponent(token)}`
  return [
    '<p>Someone asked to reset the password for your club website account.</p>',
    `<p><a href="${escape(link)}">Choose a new password</a></p>`,
    '<p>The link works once, for one hour. If you use two-factor login, you will still need the code from your authenticator app to sign in.</p>',
    '<p>If you didn’t ask for this, you can ignore this email: your password hasn’t changed.</p>',
  ].join('\n')
}
