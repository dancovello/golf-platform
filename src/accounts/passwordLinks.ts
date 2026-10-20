import { randomBytes } from 'node:crypto'

import type { Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { allowAccountCreation } from '../access/accountCreation'

import { sendLinkEmail } from './inviteEmail'
import { adminURL } from './resetEmail'

/** How long a "set your password" link works for. */
export const PASSWORD_LINK_HOURS = 72

/**
 * Passed as context when the platform itself creates a link, so it works even where the public
 * "Forgot password?" is off (src/collections/Users.ts).
 */
export const passwordLinkByAdmin = { passwordLinkByAdmin: true }

/** The admin's real address (ADMIN_URL) when it's set; otherwise the address the super-admin
 * is using, only ever shown to them on screen to copy (it's never emailed). */
const linkFor = (serverURL: string, token: string) =>
  `${(adminURL() ?? serverURL).replace(/\/$/, '')}/admin/reset/${token}`

/** A one-time "set your password" link for an existing club editor, emailed to them where
 * email is set up (src/accounts/inviteEmail.ts). */
export const createPasswordLink = async (
  payload: Payload,
  {
    userID,
    serverURL,
    req,
    kind = 'new-link',
  }: { userID: string; serverURL: string; req?: PayloadRequest; kind?: 'invite' | 'new-link' },
) => {
  const user = await payload
    .findByID({ collection: 'users', id: userID, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!user || user.role !== 'editor') {
    throw new APIError('Links can only be made for club editors.', 400)
  }
  const token = await payload.forgotPassword({
    collection: 'users',
    data: { email: user.email },
    disableEmail: true,
    expiration: PASSWORD_LINK_HOURS * 60 * 60 * 1000,
    context: passwordLinkByAdmin,
    req,
  })
  if (!token) throw new APIError('Could not create a link.', 500)
  const link = linkFor(serverURL, token)
  const club = user.tenant
    ? await payload
        .findByID({
          collection: 'tenants',
          id: String(user.tenant),
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => null)
    : null
  const sent = await sendLinkEmail(payload, {
    to: user.email,
    clubName: club?.name ?? 'club',
    link,
    expiresInHours: PASSWORD_LINK_HOURS,
    kind,
  })
  return { link, email: user.email, expiresInHours: PASSWORD_LINK_HOURS, ...sent }
}

/** Creates a club editor with an unguessable password, and a link to set their own. */
export const inviteEditor = async (
  payload: Payload,
  {
    email,
    tenant,
    serverURL,
    req,
  }: { email: string; tenant: string; serverURL: string; req?: PayloadRequest },
) => {
  const created = await payload.create({
    collection: 'users',
    data: {
      email,
      // Never told to anyone: the editor sets their own password through the link.
      password: randomBytes(32).toString('base64url'),
      role: 'editor',
      tenant,
    },
    context: allowAccountCreation,
    req,
  })
  return createPasswordLink(payload, { userID: created.id, serverURL, req, kind: 'invite' })
}
