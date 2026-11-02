import type { CollectionBeforeChangeHook, RequestContext } from 'payload'

import { isSuperAdmin } from './roles'
import { publicError } from '../errors'

/**
 * Passed as `context` by trusted server-side scripts (scripts/create-super-admin.ts, test seeds).
 * Payload's built-in "create first user" route skips access functions, so access rules alone
 * can't stop it; this hook runs on every create, whatever the access settings.
 */
export const allowAccountCreation: RequestContext = { allowAccountCreation: true }

const refuse = (message: string) => publicError(message, 403)

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

/**
 * A prospect demo (src/site/demo.ts) has no editor accounts: the club isn't live yet. Runs on
 * every create or change, whatever created the account, so an editor can't be placed in a demo
 * club by any route. Turn the demo off first (going live).
 */
export const noAccountsInDemoClubs: CollectionBeforeChangeHook = async ({ data, req }) => {
  const tenant = data?.tenant
  if (data?.role !== 'editor' || tenant === undefined || tenant === null) return data
  const id = typeof tenant === 'object' ? (tenant as { id?: unknown }).id : tenant
  if (typeof id !== 'string' && typeof id !== 'number') return data
  const club = await req.payload.findByID({
    collection: 'tenants',
    id,
    depth: 0,
    select: { demoEnabled: true },
    overrideAccess: true,
    req,
  })
  if (club?.demoEnabled) {
    throw refuse('A demo club can’t have editor accounts. Turn the demo off first.')
  }
  return data
}
