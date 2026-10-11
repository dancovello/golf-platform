import type { Payload } from 'payload'

import { allowAccountCreation } from '../access/accountCreation'

/**
 * The only way to create a super-admin. Called by scripts/create-super-admin.ts.
 * Running it against production needs Dan's explicit approval (docs/architecture/decisions.md).
 */
export const createSuperAdmin = async (
  payload: Payload,
  { email, password }: { email: string; password: string },
) =>
  payload.create({
    collection: 'users',
    data: { email, password, role: 'super-admin', tenant: null },
    context: allowAccountCreation,
  })
