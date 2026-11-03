import { isSuperAdmin } from '../access/roles'

/**
 * Whether a signed-in account has finished logging in (decisions.md, 22 Oct: password-only
 * club editors). The only place in the app that reads how someone signed in (`_strategy`);
 * tests/unit/fully-authenticated.spec.ts fails if any other file does.
 *
 * - **Super-admins** need their two-factor code entered in this session, always.
 * - **Club editors who have set up two-factor** keep needing their code (payload-totp asks).
 * - **Other club editors** are signed in once their password is accepted.
 */
export const isFullyAuthenticated = (user: unknown): boolean => {
  if (!user || typeof user !== 'object') return false
  const u = user as { _strategy?: string; hasTotp?: boolean }
  if (u._strategy === 'totp') return true
  if (isSuperAdmin(user) || u.hasTotp) return false
  return u._strategy === 'local-jwt'
}

/** A super-admin who has entered their two-factor code in this session. */
export const isSuperAdminWithCode = (user: unknown): boolean =>
  isSuperAdmin(user) && isFullyAuthenticated(user)

/** Whether this account has already entered its emailed code in this session. */
export const hasEnteredCode = (user: unknown): boolean =>
  Boolean(user) && (user as { _strategy?: string })._strategy === 'totp'

/** The strategy that accepted the password, to record in the "code entered" cookie. Nothing
 * when the code is already in (the strategy is then the code cookie itself) or unknown. */
export const passwordStrategy = (user: unknown): string | undefined => {
  const strategy = user ? (user as { _strategy?: string })._strategy : undefined
  return strategy && strategy !== 'totp' ? strategy : undefined
}
