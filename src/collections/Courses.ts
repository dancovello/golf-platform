import type { CollectionConfig, Field } from 'payload'

import { clubContentCreate, loggedIn } from '../access/roles'
import { IMAGE_TYPES, imageField } from '../blocks/shared'
import { validateVideoURL } from '../blocks/video/embed'
import { checkCourseSameClub } from '../site/sameClub'
import { TEE_COLOURS, TEE_NAME_MAX, yardsField } from './courseTees'
import { clubBannerField } from '../tenancy'
import { searchHooks } from '../search/hooks'

const yards = (colour: (typeof TEE_COLOURS)[number]): Field => ({
  name: yardsField(colour.value),
  label: `${colour.label} yards`,
  type: 'number',
  min: 40,
  max: 800,
  admin: { width: '20%' },
})

/** One of the three "how to play it" notes on a hole's course tour page. */
const tourNote = (name: string, label: string): Field => ({
  name,
  label,
  type: 'textarea',
  maxLength: 500,
})

// Club-owned (src/tenancy.ts): the club is required and editors only see their own courses.
// Shown on the website only through Hole-by-hole, Scorecard and Course tour blocks on a page.
export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Course', plural: 'Courses' },
  lockDocuments: false,
  admin: {
    group: 'Club information',
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    description:
      'Each course’s holes and tees, for the Hole-by-hole, Scorecard and Course tour blocks.',
  },
  access: { create: clubContentCreate, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: { beforeValidate: [checkCourseSameClub], ...searchHooks },
  fields: [
    clubBannerField,
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      maxLength: 60,
      admin: { description: 'e.g. "The Championship course"' },
    },
    {
      name: 'tees',
      label: 'Tees',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      labels: { singular: 'Tee', plural: 'Tees' },
      admin: {
        description:
          'Up to four. The first tee is the one shown when only one yardage fits, and the “Length” on course tour pages.',
      },
      validate: (rows: unknown) => {
        const colours = (Array.isArray(rows) ? rows : []).map((r) => r?.colour)
        return new Set(colours).size === colours.length ? true : 'Each tee colour once only.'
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'colour',
              label: 'Colour',
              type: 'select',
              required: true,
              options: [...TEE_COLOURS],
              admin: { width: '25%' },
            },
            {
              name: 'name',
              label: 'Name (optional)',
              type: 'text',
              maxLength: TEE_NAME_MAX,
              admin: {
                width: '75%',
                description:
                  'Only if the club calls this tee something else, e.g. “Championship”. Otherwise the colour is used.',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'rating',
              label: 'Course rating (men)',
              type: 'number',
              min: 50,
              max: 90,
              admin: { width: '25%', step: 0.1 },
            },
            {
              name: 'slope',
              label: 'Slope (men)',
              type: 'number',
              min: 55,
              max: 155,
              admin: { width: '25%' },
            },
            {
              name: 'ratingWomen',
              label: 'Course rating (women)',
              type: 'number',
              min: 50,
              max: 90,
              admin: { width: '25%', step: 0.1, description: 'Optional.' },
            },
            {
              name: 'slopeWomen',
              label: 'Slope (women)',
              type: 'number',
              min: 55,
              max: 155,
              admin: { width: '25%', description: 'Optional.' },
            },
          ],
        },
      ],
    },
    {
      name: 'tipFrom',
      label: 'Who the playing tips are from (optional)',
      type: 'text',
      maxLength: 80,
      admin: {
        description:
          'Shown under each hole’s playing tip on course tour pages, e.g. “James Holt, Head professional”.',
      },
    },
    {
      name: 'holes',
      label: 'Holes',
      type: 'array',
      minRows: 1,
      maxRows: 18,
      labels: { singular: 'Hole', plural: 'Holes' },
      admin: {
        initCollapsed: true,
        description: 'In order, from hole 1. Fill in the yards for the tees you have.',
      },
      validate: (rows: unknown) =>
        Array.isArray(rows) && (rows.length === 9 || rows.length === 18)
          ? true
          : 'A course has 9 or 18 holes.',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              label: 'Name (optional)',
              type: 'text',
              maxLength: 30,
              admin: { width: '50%' },
            },
            {
              name: 'par',
              label: 'Par',
              type: 'number',
              required: true,
              min: 3,
              max: 6,
              admin: { width: '25%' },
            },
            {
              name: 'strokeIndex',
              label: 'Stroke index',
              type: 'number',
              min: 1,
              max: 18,
              admin: { width: '25%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'ladiesPar',
              label: 'Ladies’ par (only if different)',
              type: 'number',
              min: 3,
              max: 6,
              admin: { width: '50%', description: 'Leave blank when it is the same as the par.' },
            },
            {
              name: 'ladiesStrokeIndex',
              label: 'Ladies’ stroke index (optional)',
              type: 'number',
              min: 1,
              max: 18,
              admin: { width: '50%' },
            },
          ],
        },
        { type: 'row', fields: TEE_COLOURS.map(yards) },
        imageField('image', 'Photo (optional)', false),
        {
          name: 'video',
          label: 'Video (optional)',
          type: 'text',
          maxLength: 300,
          // Empty is fine; anything else must be a YouTube or Vimeo address.
          validate: (value: unknown) =>
            typeof value === 'string' && value.trim() !== '' ? validateVideoURL(value) : true,
          admin: {
            description:
              'A YouTube or Vimeo address. It plays in the hole’s pop-up; the card still shows the photo.',
          },
        },
        {
          name: 'tip',
          label: 'Playing tip (optional)',
          type: 'textarea',
          maxLength: 300,
          admin: { description: 'One or two sentences.' },
        },
        {
          // Only the Course tour block shows these, so clubs that just want a scorecard never
          // need to open it. Every part is optional and leaves no gap when empty.
          type: 'collapsible',
          label: 'Course tour details (optional)',
          admin: { initCollapsed: true },
          fields: [
            {
              name: 'morePhotos',
              label: 'More photos',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              maxRows: 11,
              filterOptions: { mimeType: { in: IMAGE_TYPES } },
              admin: { description: 'Up to 11, shown after the hole’s main photo above.' },
            },
            imageField('plan', 'Hole plan', false, {
              admin: { description: 'A yardage-book drawing or an aerial picture of the hole.' },
            }),
            {
              name: 'description',
              label: 'About the hole',
              type: 'textarea',
              maxLength: 1200,
              admin: { description: 'Leave a blank line between paragraphs.' },
            },
            tourNote('noteTee', 'How to play it: off the tee'),
            tourNote('noteApproach', 'How to play it: the approach'),
            tourNote('noteGreen', 'How to play it: on the green'),
            {
              name: 'hazards',
              label: 'Watch out for',
              type: 'text',
              hasMany: true,
              maxRows: 8,
              validate: (value: unknown) =>
                (Array.isArray(value) ? value : []).every(
                  (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= 24,
                )
                  ? true
                  : 'Each one up to 24 characters.',
              admin: {
                description:
                  'Up to 8 short tags, e.g. “Out of bounds right”. Type one and press Enter.',
              },
            },
          ],
        },
      ],
    },
  ],
}
