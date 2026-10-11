import type { Endpoint, PayloadRequest } from 'payload'
import { APIError } from 'payload'

import { isSuperAdmin } from '../access/roles'

import { createPasswordLink, inviteEditor } from './passwordLinks'

/**
 * Custom endpoints aren't covered by payload-totp's access wrapper, so each one checks for a
 * super-admin whose two-factor code has been entered.
 */
const requireSuperAdminWithCode = (req: PayloadRequest) => {
  const user = req.user as (typeof req.user & { _strategy?: string }) | null
  if (!user || !isSuperAdmin(user) || user._strategy !== 'totp') {
    throw new APIError('You are not allowed to perform this action.', 403)
  }
}

const serverURLOf = (req: PayloadRequest) => {
  const url = new URL(req.url ?? 'http://localhost')
  return req.payload.config.serverURL || `${url.protocol}//${url.host}`
}

/** POST /api/users/invite  { email, tenant } -> { link, email, expiresInHours } */
export const inviteEndpoint: Endpoint = {
  path: '/invite',
  method: 'post',
  handler: async (req) => {
    requireSuperAdminWithCode(req)
    const body = (await req.json?.().catch(() => null)) as {
      email?: unknown
      tenant?: unknown
    } | null
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const tenant = typeof body?.tenant === 'string' ? body.tenant : ''
    if (!email.includes('@') || !tenant) {
      throw new APIError('Enter an email address and choose a club.', 400)
    }
    return Response.json(
      await inviteEditor(req.payload, { email, tenant, serverURL: serverURLOf(req), req }),
    )
  },
}

/** POST /api/users/:id/password-link -> { link, email, expiresInHours } */
export const passwordLinkEndpoint: Endpoint = {
  path: '/:id/password-link',
  method: 'post',
  handler: async (req) => {
    requireSuperAdminWithCode(req)
    const userID = String(req.routeParams?.id ?? '')
    return Response.json(
      await createPasswordLink(req.payload, { userID, serverURL: serverURLOf(req), req }),
    )
  },
}
