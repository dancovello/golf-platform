import type { CollectionConfig, FieldAccess } from 'payload'

import { loggedIn } from '../access/roles'
import { ENQUIRY_PURPOSES } from './enquiryPurposes'

/** What the visitor sent stays exactly as sent: editors can read it but not change it. */
const asSent: { update: FieldAccess } = { update: () => false }

// Club-owned (src/tenancy.ts): the club is required and editors only see their own club's
// messages. Only the website's Contact page creates them (src/site/contact/submit.ts, as
// trusted server code), so nobody can add one through the admin or the API. Editors mark
// them handled, add notes, and can delete them (spam, or someone asking to be forgotten).
export const Enquiries: CollectionConfig = {
  slug: 'enquiries',
  labels: { singular: 'Enquiry', plural: 'Enquiries' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'purpose', 'status', 'reference', 'createdAt'],
    description:
      'Messages sent from the Contact page on your website. Each new one is also emailed to your club (Club Settings → Contact page says where).',
  },
  access: { create: () => false, read: loggedIn, update: loggedIn, delete: loggedIn },
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
            { label: 'Handled', value: 'handled' },
          ],
        },
        {
          name: 'reference',
          label: 'Reference',
          type: 'text',
          required: true,
          index: true,
          access: asSent,
          admin: { description: 'The visitor was given this reference.' },
        },
        {
          name: 'purpose',
          label: 'About',
          type: 'select',
          required: true,
          options: [...ENQUIRY_PURPOSES],
          access: asSent,
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          maxLength: 100,
          access: asSent,
        },
        { name: 'email', label: 'Email address', type: 'email', required: true, access: asSent },
        { name: 'phone', label: 'Phone', type: 'text', maxLength: 30, access: asSent },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'membershipType',
          label: 'Membership type',
          type: 'text',
          maxLength: 60,
          access: asSent,
          admin: { condition: (data) => data?.purpose === 'membership' },
        },
        {
          name: 'preferredDate',
          label: 'Date',
          type: 'date',
          access: asSent,
          admin: {
            condition: (data) => data?.purpose === 'visitor' || data?.purpose === 'events',
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
          },
        },
        {
          name: 'groupSize',
          label: 'Number of people',
          type: 'number',
          min: 1,
          max: 500,
          access: asSent,
          admin: {
            condition: (data) => data?.purpose === 'visitor' || data?.purpose === 'events',
          },
        },
      ],
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      maxLength: 1000,
      access: asSent,
    },
    {
      name: 'newsletter',
      label: 'Asked for the club newsletter',
      type: 'checkbox',
      defaultValue: false,
      access: asSent,
    },
    {
      name: 'alertSentAt',
      label: 'Emailed to the club',
      type: 'date',
      access: asSent,
      admin: {
        readOnly: true,
        date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' },
        description: 'Blank if the email alert wasn’t sent: check this list for anything missed.',
      },
    },
    {
      name: 'notes',
      label: 'Notes (only you can see these)',
      type: 'textarea',
      maxLength: 2000,
    },
  ],
}
