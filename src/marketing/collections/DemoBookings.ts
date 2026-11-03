import type { CollectionConfig, FieldAccess } from 'payload'

import { superAdminOnly } from '../../access/roles'
import { MARKETING_GROUP, hiddenFromEditors } from '../access'
import { slotKey } from '../booking/availability'

/** What the visitor sent stays exactly as sent. */
const asSent: { update: FieldAccess } = { update: () => false }

// Platform-level (src/tenancy.ts): a demo call booked on the company website (Book a demo).
// Only the website's booking form creates them, as trusted server code
// (src/marketing/booking/submit.ts), so nobody can add one through the admin or the API. The
// super-admin alone reads them, and marks one cancelled to free its time.
export const DemoBookings: CollectionConfig = {
  slug: 'demo-bookings',
  labels: { singular: 'Demo booking', plural: 'Demo bookings' },
  lockDocuments: false,
  admin: {
    group: MARKETING_GROUP,
    useAsTitle: 'club',
    defaultColumns: ['club', 'date', 'time', 'status', 'email'],
    description:
      'Demo calls booked on the Book a demo page. Mark one cancelled and its time is offered again.',
    hidden: hiddenFromEditors,
  },
  access: {
    create: () => false,
    read: superAdminOnly,
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  defaultSort: 'date',
  hooks: {
    // The slot is unique while booked, so the database itself stops two people taking one time.
    // Cancelled and finished bookings give it up.
    beforeChange: [
      ({ data, originalDoc }) => {
        const merged = { ...originalDoc, ...data }
        return {
          ...data,
          slotKey:
            merged.status === 'booked' && merged.date && merged.time
              ? slotKey(merged.date, merged.time)
              : null,
        }
      },
    ],
  },
  fields: [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'booked',
      options: [
        { label: 'Booked', value: 'booked' },
        { label: 'Done', value: 'done' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'date',
          label: 'Day (UK time)',
          type: 'text',
          required: true,
          access: asSent,
          admin: { description: 'Year-month-day.' },
        },
        { name: 'time', label: 'Time (UK time)', type: 'text', required: true, access: asSent },
      ],
    },
    {
      name: 'slotKey',
      type: 'text',
      unique: true,
      index: true,
      admin: { hidden: true },
    },
    { name: 'name', label: 'Name', type: 'text', required: true, access: asSent },
    { name: 'role', label: 'Role at the club', type: 'text', access: asSent },
    { name: 'club', label: 'Club', type: 'text', required: true, access: asSent },
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
