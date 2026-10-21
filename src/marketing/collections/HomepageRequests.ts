import type { CollectionConfig, FieldAccess } from 'payload'

import { superAdminOnly } from '../../access/roles'
import { MARKETING_GROUP, hiddenFromEditors } from '../access'

/** What the prospect sent stays exactly as sent. */
const asSent: { update: FieldAccess } = { update: () => false }

// Platform-level (src/tenancy.ts): a golf club asking for its free homepage on the company
// website (Switching page). Only the website's form creates them, as trusted server code
// (src/marketing/requests/submit.ts), so nobody can add one through the admin or the API.
// The super-admin alone reads them, marks them sent and deletes them.
export const HomepageRequests: CollectionConfig = {
  slug: 'homepage-requests',
  labels: { singular: 'Homepage request', plural: 'Homepage requests' },
  lockDocuments: false,
  admin: {
    group: MARKETING_GROUP,
    useAsTitle: 'clubName',
    defaultColumns: ['clubName', 'website', 'status', 'dueBy', 'createdAt'],
    description:
      'Clubs asking for their free homepage (Switching page). Each one was promised it by the date shown.',
    hidden: hiddenFromEditors,
  },
  access: {
    create: () => false,
    read: superAdminOnly,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  defaultSort: '-createdAt',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          defaultValue: 'new',
          options: [
            { label: 'New', value: 'new' },
            { label: 'Homepage sent', value: 'sent' },
            { label: 'Closed', value: 'closed' },
          ],
        },
        {
          name: 'dueBy',
          label: 'Promised by',
          type: 'date',
          required: true,
          access: asSent,
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'EEEE d MMMM yyyy' },
            description: 'Two UK working days after the request, as the form told them.',
          },
        },
      ],
    },
    { name: 'clubName', label: 'Club name', type: 'text', required: true, access: asSent },
    { name: 'website', label: 'Current website', type: 'text', required: true, access: asSent },
    { name: 'email', label: 'Email', type: 'email', required: true, access: asSent },
    {
      name: 'alertSentAt',
      label: 'Emailed to you',
      type: 'date',
      access: asSent,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'confirmationSentAt',
      label: 'Confirmation emailed to them',
      type: 'date',
      access: asSent,
      admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } },
    },
    { name: 'notes', label: 'Notes', type: 'textarea' },
  ],
}
