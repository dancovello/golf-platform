import type { CollectionConfig } from 'payload'

import { editorTenantID, isSuperAdmin, superAdminOnly } from '../access/roles'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: 'Club', plural: 'Clubs' },
  // Document locking is off: Payload's lock records are readable by every logged-in user,
  // across clubs. See docs/plans/step-2-spike-findings.md.
  lockDocuments: false,
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  access: {
    create: superAdminOnly,
    read: ({ req: { user } }) => {
      if (isSuperAdmin(user)) return true
      const tenantID = editorTenantID(user)
      return tenantID === null ? false : { id: { equals: tenantID } }
    },
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  fields: [{ name: 'name', type: 'text', required: true }],
}
