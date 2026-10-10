import type { CollectionConfig } from 'payload'

import { loggedIn, superAdminOnly } from '../access/roles'

// One record per club (the plugin's isGlobal mode). Never a real Payload global,
// which would be shared by every club.
export const ClubSettings: CollectionConfig = {
  slug: 'club-settings',
  labels: { singular: 'Club Settings', plural: 'Club Settings' },
  // Document locking is off: Payload's lock records are readable by every logged-in user,
  // across clubs. See docs/plans/step-2-spike-findings.md.
  lockDocuments: false,
  admin: { useAsTitle: 'clubName' },
  access: { create: superAdminOnly, read: loggedIn, update: loggedIn, delete: superAdminOnly },
  fields: [{ name: 'clubName', type: 'text', required: true }],
}
