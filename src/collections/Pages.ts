import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/roles'
import { pageBlocks } from '../blocks'
import { checkPageSameClub } from '../site/sameClub'

// Club-owned (src/tenancy.ts). The multi-tenant plugin adds the required `tenant` field and
// limits editors to their own club. The page is built from blocks (src/blocks).
export const Pages: CollectionConfig = {
  slug: 'pages',
  lockDocuments: false,
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'updatedAt'] },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  // A slug only has to be unique within one club, so two clubs can both have /membership.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  hooks: { beforeValidate: [checkPageSameClub] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'The page address, e.g. "membership" for /membership. Use "home" for the home page.',
      },
    },
    {
      name: 'layout',
      label: 'Page content',
      type: 'blocks',
      blocks: pageBlocks,
      admin: { initCollapsed: false },
    },
  ],
}
