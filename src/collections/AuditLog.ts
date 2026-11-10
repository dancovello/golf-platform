import type { CollectionConfig } from 'payload'

import { isSuperAdmin, superAdminOnly } from '../access/roles'
import { AUDIT_ACTIONS } from '../audit/record'

// Platform-level (src/tenancy.ts): who did what, and when (src/audit/record.ts). Entries are
// written only by trusted server code, so nobody can add, change or delete one through the
// admin or the API, not even the super-admin. Only the super-admin reads them. Club editors
// can't see that the log exists. Deleted 12 months after they're made (src/privacy/cleanUp.ts).
export const AuditLog: CollectionConfig = {
  slug: 'audit-log',
  labels: { singular: 'Log entry', plural: 'Audit log' },
  lockDocuments: false,
  admin: {
    group: 'Platform',
    useAsTitle: 'action',
    defaultColumns: ['createdAt', 'action', 'actorEmail', 'clubName', 'target'],
    description:
      'Who did what, and when. Sign-ins, account and password changes, two-factor, clubs, and deleted club content. Read-only: nothing here can be changed. Kept for 12 months.',
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  access: {
    create: () => false,
    read: superAdminOnly,
    update: () => false,
    delete: () => false,
  },
  defaultSort: '-createdAt',
  fields: [
    {
      name: 'action',
      label: 'What happened',
      type: 'select',
      required: true,
      index: true,
      options: AUDIT_ACTIONS.map((a) => ({ label: a.label, value: a.value })),
    },
    {
      type: 'row',
      fields: [
        { name: 'actorRole', label: 'Who: account type', type: 'text', index: true },
        { name: 'actorEmail', label: 'Who: email', type: 'text' },
        { name: 'actorId', label: 'Who: account ID', type: 'text' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'clubName', label: 'Club', type: 'text' },
        { name: 'clubId', label: 'Club ID', type: 'text', index: true },
      ],
    },
    { name: 'target', label: 'Done to', type: 'text' },
    { name: 'detail', label: 'Detail', type: 'text' },
  ],
}
