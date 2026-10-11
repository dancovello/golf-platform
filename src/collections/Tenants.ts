import type { CollectionConfig } from 'payload'

import { editorTenantID, isSuperAdmin, superAdminOnly } from '../access/roles'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: 'Club', plural: 'Clubs' },
  // Document locking is off everywhere: Payload's lock records are readable by every
  // logged-in user, across clubs (docs/plans/step-2-spike-findings.md, finding 2).
  lockDocuments: false,
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  access: {
    create: superAdminOnly,
    // An editor can read only their own club's record.
    read: ({ req: { user } }) => {
      if (isSuperAdmin(user)) return true
      const tenantID = editorTenantID(user)
      return tenantID === null ? false : { id: { equals: tenantID } }
    },
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  hooks: {
    // Every club gets its Club Settings record straight away (one per club).
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        await req.payload.create({
          collection: 'club-settings',
          data: { clubName: doc.name, tenant: doc.id },
          req,
        })
        return doc
      },
    ],
  },
  fields: [{ name: 'name', label: 'Club name', type: 'text', required: true }],
}
