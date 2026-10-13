import type { CollectionConfig, Field } from 'payload'

import { loggedIn } from '../access/roles'
import { imageField } from '../blocks/shared'
import { checkCourseSameClub } from '../site/sameClub'
import { TEE_COLOURS, yardsField } from './courseTees'

const yards = (colour: (typeof TEE_COLOURS)[number]): Field => ({
  name: yardsField(colour.value),
  label: `${colour.label} yards`,
  type: 'number',
  min: 40,
  max: 800,
  admin: { width: '25%' },
})

// Club-owned (src/tenancy.ts): the club is required and editors only see their own courses.
// Shown on the website only through Hole-by-hole and Scorecard blocks on a page.
export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Course', plural: 'Courses' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
    description: 'Each course’s holes and tees, for the Hole-by-hole and Scorecard blocks.',
  },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: { beforeValidate: [checkCourseSameClub] },
  fields: [
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
      admin: { description: 'The first tee is the one shown when only one yardage fits.' },
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
              name: 'rating',
              label: 'Course rating',
              type: 'number',
              min: 50,
              max: 90,
              admin: { width: '25%', step: 0.1 },
            },
            {
              name: 'slope',
              label: 'Slope',
              type: 'number',
              min: 55,
              max: 155,
              admin: { width: '25%' },
            },
          ],
        },
      ],
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
        { type: 'row', fields: TEE_COLOURS.map(yards) },
        imageField('image', 'Photo (optional)', false),
        {
          name: 'tip',
          label: 'Playing tip (optional)',
          type: 'textarea',
          maxLength: 300,
          admin: { description: 'One or two sentences.' },
        },
      ],
    },
  ],
}
