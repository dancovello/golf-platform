import type {
  CollectionAfterChangeHook,
  CollectionAfterOperationHook,
  CollectionBeforeChangeHook,
  CollectionBeforeOperationHook,
  Payload,
} from 'payload'

import { isSuperAdmin } from '../access/roles'
import { emailEnabled } from '../email/adapter'
import { publicError } from '../errors'
import { BRAND } from '../brand'

/**
 * Safeguards that come with password-only club editors (decisions.md, 22 Oct).
 *
 * 1. **Editor sessions end after 8 hours.** Payload renews a session each time the admin
 *    refreshes it, so on its own a session can last for ever. After 8 hours from login an
 *    editor's session is no longer renewed: it's deleted, which signs them out on their next
 *    request. Super-admins (who have two-factor) keep Payload's normal renewal.
 * 2. **An email when a password changes**, by the account's own form, an emailed link or a
 *    platform link, so someone else changing it doesn't go unnoticed. Sent only where email is
 *    set up.
 */
export const EDITOR_SESSION_HOURS = 8

type Session = { id: string; createdAt: string | Date; expiresAt: string | Date }

/** Whether a session started more than 8 hours ago. */
export const sessionTooOld = (session: Pick<Session, 'createdAt'>, now = new Date()) =>
  now.getTime() - new Date(session.createdAt).getTime() > EDITOR_SESSION_HOURS * 60 * 60 * 1000

export const endLongEditorSessions: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (operation !== 'refresh') return args
  const user = req.user as { id: string; _sid?: string } | null
  if (!user || isSuperAdmin(user) || !user._sid) return args
  const stored = (await req.payload.db.findOne({
    collection: 'users',
    where: { id: { equals: user.id } },
    req,
  })) as { sessions?: Session[] } | null
  const session = stored?.sessions?.find((s) => s.id === user._sid)
  if (!session || !sessionTooOld(session)) return args
  await req.payload.db.updateOne({
    collection: 'users',
    id: user.id,
    data: { sessions: (stored?.sessions ?? []).filter((s) => s.id !== user._sid) },
    req,
    returning: false,
  })
  throw publicError('Your session has ended after 8 hours. Please log in again.', 401)
}

const sendPasswordChanged = async (payload: Payload, email: unknown) => {
  if (!emailEnabled() || typeof email !== 'string' || !email.includes('@')) return
  try {
    await payload.sendEmail({
      to: email,
      subject: `Your ${BRAND.name} password was set`,
      text: [
        `The password for your ${BRAND.name} account (${email}) was just set.`,
        '',
        'If you set it, you don’t need to do anything.',
        `If you didn’t, contact ${BRAND.email} straight away so we can lock the account.`,
      ].join('\n'),
    })
  } catch (error) {
    payload.logger.error({ err: error }, 'Password-changed email failed')
  }
}

/** Notes that this save sets a new password (the hashed value never reaches afterChange). */
export const notePasswordChange: CollectionBeforeChangeHook = ({ data, operation, req }) => {
  if (operation === 'update' && typeof data?.password === 'string' && data.password.length > 0) {
    req.context.passwordChanged = true
  }
  return data
}

export const emailPasswordChange: CollectionAfterChangeHook = async ({ doc, req, operation }) => {
  if (operation === 'update' && req.context.passwordChanged === true) {
    req.context.passwordChanged = false
    await sendPasswordChanged(req.payload, doc.email)
  }
  return doc
}

/** Setting a password through a link doesn't run the save hooks above. */
export const emailPasswordReset: CollectionAfterOperationHook = async ({
  operation,
  req,
  result,
}) => {
  if (operation === 'resetPassword') {
    // The account in `result` is trimmed by read access (nobody is signed in yet), so look up
    // its email address by ID.
    const id = (result as { user?: { id?: string } })?.user?.id
    const account = id
      ? await req.payload
          .findByID({ collection: 'users', id, depth: 0, overrideAccess: true, req })
          .catch(() => null)
      : null
    await sendPasswordChanged(req.payload, account?.email)
  }
  return result
}
