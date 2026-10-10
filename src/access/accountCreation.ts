import type { CollectionBeforeChangeHook, RequestContext } from 'payload'
import { APIError } from 'payload'

/**
 * Accounts may only be created by trusted server-side scripts, which pass this context.
 * Payload's built-in "create first user" route skips access functions, so access rules
 * alone can't stop it. This hook runs on every create, whatever the access settings.
 */
export const allowAccountCreation: RequestContext = { allowAccountCreation: true }

export const blockUntrustedAccountCreation: CollectionBeforeChangeHook = ({
  context,
  data,
  operation,
}) => {
  if (operation === 'create' && context.allowAccountCreation !== true) {
    throw new APIError('Accounts can only be created by a platform administrator.', 403)
  }
  return data
}
