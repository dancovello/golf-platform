import type { CollectionConfig } from 'payload'

import { loggedIn, superAdminOnly } from '../access/roles'

// One record per club (src/tenancy.ts, plugin "global" mode). Never a real Payload global,
// which would be shared by every club. Branding fields arrive in build step 5.
export const ClubSettings: CollectionConfig = {
  slug: 'club-settings',
  labels: { singular: 'Club Settings', plural: 'Club Settings' },
  lockDocuments: false,
  admin: { useAsTitle: 'clubName' },
  // Created and removed with the club by the super-admin; editors only update their own.
  access: { create: superAdminOnly, read: loggedIn, update: loggedIn, delete: superAdminOnly },
  fields: [
    { name: 'clubName', label: 'Club name shown on the website', type: 'text', required: true },
  ],
}
