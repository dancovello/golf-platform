import type { CollectionConfig } from 'payload'

import { loggedIn, superAdminOnly } from '../access/roles'
import { STATUS_STATES } from './courseStatusStates'

// One record per club (src/tenancy.ts, plugin "global" mode), created with the club. Kept
// short so greenstaff can update it from a phone. Shown by the Course status block.
export const CourseStatus: CollectionConfig = {
  slug: 'course-status',
  labels: { singular: 'Course status', plural: 'Course status' },
  lockDocuments: false,
  admin: {
    group: 'Website',
    useAsTitle: 'state',
    description:
      'Update whenever the course changes. If it isn’t updated for 24 hours the website says so and asks visitors to call.',
  },
  // Created and removed with the club by the super-admin; editors only update their own.
  access: { create: superAdminOnly, read: loggedIn, update: loggedIn, delete: superAdminOnly },
  fields: [
    {
      name: 'state',
      label: 'The course is',
      type: 'radio',
      required: true,
      defaultValue: 'open',
      options: [...STATUS_STATES],
    },
    {
      name: 'reason',
      label: 'In a sentence or two (optional)',
      type: 'textarea',
      maxLength: 200,
      admin: { description: 'e.g. "All 36 holes in play. Temporary green on the 7th."' },
    },
    {
      name: 'facilities',
      label: 'Status of each part',
      type: 'array',
      maxRows: 6,
      labels: { singular: 'Line', plural: 'Lines' },
      admin: { description: 'e.g. Buggies: Restricted, "Paths only". Up to six.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'What', type: 'text', required: true, maxLength: 24 },
            {
              name: 'state',
              label: 'Status',
              type: 'select',
              required: true,
              defaultValue: 'open',
              options: [...STATUS_STATES],
            },
            {
              name: 'value',
              label: 'Words shown (optional)',
              type: 'text',
              maxLength: 28,
              admin: { description: 'Defaults to the status, e.g. "Open".' },
            },
          ],
        },
      ],
    },
    {
      name: 'changedBy',
      label: 'Changed by (optional)',
      type: 'text',
      maxLength: 40,
      admin: { description: 'e.g. "the Course Manager". Shown beside the time.' },
    },
  ],
}
