import type { CollectionConfig } from 'payload'

import { clubContentCreate, loggedIn } from '../access/roles'
import { imageField } from '../blocks/shared'
import { linkField } from '../fields/link'
import { checkEventSameClub } from '../site/sameClub'
import { EVENT_CATEGORIES } from './eventCategories'
import { clubBannerField } from '../tenancy'

// Club-owned (src/tenancy.ts): the club is required and editors only see their own events.
// The website shows published events until they start, at /events and in Events blocks.
export const Events: CollectionConfig = {
  slug: 'events',
  labels: { singular: 'Event', plural: 'Events' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'category', 'status'],
  },
  access: { create: clubContentCreate, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: { beforeValidate: [checkEventSameClub] },
  defaultSort: 'startsAt',
  fields: [
    clubBannerField,
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 80 },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: [
            { label: 'Draft (not on the website)', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        },
        {
          name: 'startsAt',
          label: 'Date and start time',
          type: 'date',
          required: true,
          admin: {
            date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy, HH:mm' },
            description: 'UK time. The event leaves the website once it has started.',
          },
        },
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          defaultValue: 'social',
          options: [...EVENT_CATEGORIES],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'venue',
          label: 'Where (optional)',
          type: 'text',
          maxLength: 40,
          admin: { description: 'e.g. "Clubhouse" or "Championship course"' },
        },
        {
          name: 'timeNote',
          label: 'Time note (optional)',
          type: 'text',
          maxLength: 20,
          admin: { description: 'e.g. "shotgun". Shown after the time.' },
        },
      ],
    },
    {
      name: 'summary',
      label: 'Summary (optional)',
      type: 'textarea',
      maxLength: 200,
      admin: { description: 'One or two sentences, shown when the event is featured.' },
    },
    imageField('image', 'Photo (optional)', false),
    {
      type: 'row',
      fields: [
        {
          name: 'price',
          label: 'Price (optional)',
          type: 'text',
          maxLength: 20,
          admin: { description: 'e.g. "£45" or "£20 entry"' },
        },
        {
          name: 'memberPrice',
          label: 'Member price (optional)',
          type: 'text',
          maxLength: 20,
          admin: { description: 'e.g. "£38"' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'booking',
          label: 'Button',
          type: 'select',
          required: true,
          defaultValue: 'book',
          options: [
            { label: 'Book', value: 'book' },
            { label: 'Enquire', value: 'enquire' },
            { label: 'Sold out', value: 'soldOut' },
          ],
        },
        {
          name: 'capacity',
          label: 'Places (optional)',
          type: 'number',
          min: 1,
          max: 5000,
        },
        {
          name: 'placesLeft',
          label: 'Places left (optional)',
          type: 'number',
          min: 0,
          max: 5000,
          admin: { description: 'Shown as "14 of 60 places left" when the event is featured.' },
        },
      ],
    },
    linkField({
      name: 'link',
      label: 'Where the button goes',
      withLabel: false,
      required: false,
    }),
    {
      name: 'featured',
      label: 'Feature this event (Events block style C)',
      type: 'checkbox',
    },
  ],
}
