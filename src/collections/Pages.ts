import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/roles'

// Club-owned. The multi-tenant plugin adds the required `tenant` field and scopes access.
export const Pages: CollectionConfig = {
  slug: 'pages',
  // Document locking is off: Payload's lock records are readable by every logged-in user,
  // across clubs. See docs/plans/step-2-spike-findings.md.
  lockDocuments: false,
  admin: { useAsTitle: 'title' },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  // A slug only has to be unique within one club.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, index: true },
  ],
}
