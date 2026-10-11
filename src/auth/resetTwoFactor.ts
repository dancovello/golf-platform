import type { Endpoint, Payload } from 'payload'
import { APIError } from 'payload'

import { isSuperAdmin } from '../access/roles'

/**
 * Clears an account's two-factor secret, so they set it up again at their next login
 * (lost phone). There are no backup codes in v1 (docs/architecture/decisions.md).
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
    const user = req.user as (typeof req.user & { _strategy?: string }) | null
    if (!user || !isSuperAdmin(user) || user._strategy !== 'totp') {
      throw new APIError('You are not allowed to perform this action.', 403)
    }
    const id = String(req.routeParams?.id ?? '')
    const target = await req.payload
      .findByID({ collection: 'users', id, depth: 0, overrideAccess: true })
      .catch(() => null)
    if (!target || target.role !== 'editor') {
      throw new APIError('Only a club editor’s two-factor can be reset here.', 400)
    }
    await resetTwoFactor(req.payload, id)
    return Response.json({
      message: 'Two-factor reset. They will set it up again when they next log in.',
    })
  },
}
