import type { CollectionConfig } from 'payload'

import { isSuperAdmin, superAdminOnly } from '../access/roles'

// Platform-level (src/tenancy.ts): each time someone opens a page of a prospect demo
// (src/site/demoVisits.ts). Only the time and the page are kept: nothing about who opened it
// (Dan, 25 Nov 2026). Written only by the demo pages themselves, so nobody can add or change
// one through the admin or the API. Only the super-admin reads them, on the club's own page
// (src/admin/DemoVisitsField.tsx); club editors can't see they exist. Deleted 120 days after
// the visit (src/privacy/cleanUp.ts). The club is stored as a plain ID, like the audit log,
// so a club can still be deleted while it has visits.
export const DemoVisits: CollectionConfig = {
  slug: 'demo-visits',
  labels: { singular: 'Demo visit', plural: 'Demo visits' },
  lockDocuments: false,
  admin: {
    group: 'Platform',
    useAsTitle: 'page',
    defaultColumns: ['visitedAt', 'page', 'clubId'],
    description:
      'Each time a page of a prospect demo was opened: the time and the page only. Shown on each club’s page under its demo link. Deleted 120 days after the visit.',
    hidden: true,
  },
  access: {
    create: () => false,
    read: superAdminOnly,
    update: () => false,
    delete: ({ req: { user } }) => isSuperAdmin(user),
  },
  defaultSort: '-visitedAt',
  fields: [
    { name: 'clubId', label: 'Club ID', type: 'text', required: true, index: true },
    { name: 'visitedAt', label: 'Opened', type: 'date', required: true, index: true },
    { name: 'page', label: 'Page', type: 'text', required: true, maxLength: 200 },
  ],
}
