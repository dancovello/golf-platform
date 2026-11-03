import type { Endpoint, Payload } from 'payload'

import { isSuperAdminWithCode } from './fullyAuthenticated'
import { publicError } from '../errors'

/**
 * Clears an account's old authenticator secret, so a club editor who had set it up signs in
 * with their password alone again. (Codes are emailed now and nobody can set the authenticator
 * up any more: decisions.md, 3 Nov.)
 */
export const resetTwoFactor = (payload: Payload, userID: string) =>
  payload.update({
    collection: 'users',
    id: userID,
    data: { totpSecret: null } as never,
    overrideAccess: true,
  })

/**
 * POST /api/users/:id/reset-two-factor. A super-admin, with their own code entered, can reset
 * a club editor. A super-admin's own reset is only possible with `pnpm reset-two-factor`.
 * Custom endpoints aren't covered by payload-totp's access wrapper, so this checks the code
 * session itself.
 */
export const resetTwoFactorEndpoint: Endpoint = {
  path: '/:id/reset-two-factor',
  method: 'post',
  handler: async (req) => {
    if (!isSuperAdminWithCode(req.user)) {
      throw publicError('You are not allowed to perform this action.', 403)
    }
    const id = String(req.routeParams?.id ?? '')
    const target = await req.payload
      .findByID({ collection: 'users', id, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (!target || target.role !== 'editor') {
      throw publicError('Only a club editor’s two-factor can be reset here.', 400)
    }
    await resetTwoFactor(req.payload, id)
    return Response.json({
      message: 'Done. They now sign in with their password alone, with no emailed code.',
    })
  },
}
