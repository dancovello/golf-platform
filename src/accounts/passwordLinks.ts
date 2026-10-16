import { randomBytes } from 'node:crypto'

import type { Payload, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { allowAccountCreation } from '../access/accountCreation'

/** How long a "set your password" link works for. */
export const PASSWORD_LINK_HOURS = 72

/**
 * Passed as context when the platform itself creates a link, so it works even where the public
 * "Forgot password?" is off (src/collections/Users.ts).
 */
export const passwordLinkByAdmin = { passwordLinkByAdmin: true }

const linkFor = (serverURL: string, token: string) =>
  `${serverURL.replace(/\/$/, '')}/admin/reset/${token}`

/** A one-time "set your password" link for an existing club editor. */
export const createPasswordLink = async (
  payload: Payload,
  { userID, serverURL, req }: { userID: string; serverURL: string; req?: PayloadRequest },
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
  return { link: linkFor(serverURL, token), email: user.email, expiresInHours: PASSWORD_LINK_HOURS }
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
  return createPasswordLink(payload, { userID: created.id, serverURL, req })
}
