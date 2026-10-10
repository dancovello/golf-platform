import type { CollectionConfig } from 'payload'

import { denyAll, selfOnly } from '../access'
import { blockUntrustedAccountCreation } from '../access/accountCreation'

// Step 1 placeholder. Account types (super-admin vs club editor) and tenant scoping
// arrive in step 2, following docs/architecture/decisions.md.
export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    admin: ({ req: { user } }) => Boolean(user),
    // Accounts are only ever created by a script, never through the admin UI or API.
    create: denyAll,
    read: selfOnly,
    update: selfOnly,
    delete: denyAll,
  },
  hooks: {
    beforeChange: [blockUntrustedAccountCreation],
  },
  fields: [],
}
