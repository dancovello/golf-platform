import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/roles'

// Club-owned (src/tenancy.ts). The multi-tenant plugin adds the required `tenant` field and
// limits editors to their own club. Blocks arrive in build step 5.
export const Pages: CollectionConfig = {
  slug: 'pages',
  lockDocuments: false,
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  // A slug only has to be unique within one club, so two clubs can both have /membership.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'The page address, e.g. "membership" for /membership.' },
    },
  ],
}
