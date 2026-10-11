import type { CollectionBeforeChangeHook, RequestContext } from 'payload'
import { APIError } from 'payload'

import { isSuperAdmin } from './roles'

/**
 * Passed as `context` by trusted server-side scripts (scripts/create-super-admin.ts, test seeds).
 * Payload's built-in "create first user" route skips access functions, so access rules alone
 * can't stop it; this hook runs on every create, whatever the access settings.
 */
export const allowAccountCreation: RequestContext = { allowAccountCreation: true }

const refuse = (message: string) => new APIError(message, 403)

/**
 * - Super-admins: only via a trusted script.
 * - Editors: via a trusted script, or by a logged-in super-admin.
 * - Anything else: refused.
 */
export const enforceAccountCreationRules: CollectionBeforeChangeHook = ({
  context,
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data
  const trustedScript = context.allowAccountCreation === true

  if (data.role === 'super-admin') {
    if (!trustedScript) {
      throw refuse('Super-admin accounts can only be created by the platform script.')
    }
    return data
  }
  if (data.role === 'editor') {
    if (!trustedScript && !isSuperAdmin(req.user)) {
      throw refuse('Accounts can only be created by a platform administrator.')
    }
    return data
  }
  throw refuse('Accounts can only be created by a platform administrator.')
}
