import type { CollectionBeforeChangeHook, CollectionConfig, Field } from 'payload'

import { clubContentCreate, loggedIn } from '../access/roles'
import { IMAGE_TYPES, imageField } from '../blocks/shared'
import { validateVideoURL } from '../blocks/video/embed'
import { checkCourseSameClub } from '../site/sameClub'
import {
  MAX_TEES,
  TEE_COLOURS,
  TEE_NAME_MAX,
  TEE_PLAYERS,
  TEE_SLOTS,
  teeName,
  teeSlots,
  yardsSlotField,
  type TeeColour,
  type TeePlayers,
} from './courseTees'
import { clubBannerField } from '../tenancy'
import { searchHooks } from '../search/hooks'

type TeeRow = {
  colour?: TeeColour
  name?: string | null
  players?: TeePlayers | null
  winter?: boolean | null
  slot?: number | null
}

/** A hole's yards for one tee slot. Shown only while a tee uses the slot, labelled with its name. */
const yards = (slot: number): Field => ({
  name: yardsSlotField(slot),
  label: `Tee ${slot} yards`,
  type: 'number',
  min: 40,
  max: 800,
  admin: {
    width: '25%',
    condition: (data) => teeSlots((data?.tees ?? []) as TeeRow[]).includes(slot),
    components: { Label: '/admin/TeeYardsLabel#TeeYardsLabel' },
  },
})

/**
 * Before G1 (15 Nov 2026) yards were stored by colour. These columns are kept, hidden and no
 * longer read, so the change deletes nothing; the migration copied them into the tee slots.
 * A later, approved migration can drop them.
 */
const LEGACY_YARDS = ['White', 'Yellow', 'Red', 'Blue', 'Black'].map((c): Field => ({
  name: `yards${c}`,
  type: 'number',
  admin: { hidden: true, disableListColumn: true, disableListFilter: true },
}))

/** Gives each tee its slot and empties the yards of slots no tee uses any more. */
const assignTeeSlots: CollectionBeforeChangeHook = ({ data }) => {
  if (!Array.isArray(data.tees)) return data
  const tees = data.tees as TeeRow[]
  const slots = teeSlots(tees)
  data.tees = tees.map((t, i) => ({ ...t, slot: slots[i] }))
  if (Array.isArray(data.holes)) {
    const used = new Set(slots)
    data.holes = (data.holes as Record<string, unknown>[]).map((h) => {
      const next = { ...h }
      for (const s of TEE_SLOTS) if (!used.has(s)) next[yardsSlotField(s)] = null
      return next
    })
  }
  return data
}

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
  hooks: { beforeValidate: [checkCourseSameClub], beforeChange: [assignTeeSlots], ...searchHooks },
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
      maxRows: MAX_TEES,
      labels: { singular: 'Tee', plural: 'Tees' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '/admin/TeeRowLabel#TeeRowLabel' },
        description:
          'One row per set of tee markers, up to eight. Most clubs need two or three. Add a women’s tee or a winter tee here too. The first one is used for the “Length” on course tour pages. After adding a tee, type its yards on each hole below.',
      },
      validate: (rows: unknown) => {
        const names = (Array.isArray(rows) ? (rows as TeeRow[]) : [])
          .filter((r) => r?.colour)
          .map((r) => teeName(r as TeeRow & { colour: TeeColour }).toLowerCase())
        return new Set(names).size === names.length
          ? true
          : 'Two tees have the same name. Give one of them its own name, e.g. “Medal yellow”.'
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
                  'Only if the club calls this tee something else, e.g. “Championship” or “60”. Otherwise it is named from its colour, e.g. “Women’s red” or “Winter yellow”.',
              },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'players',
              label: 'Who plays it',
              type: 'select',
              defaultValue: 'both',
              options: [...TEE_PLAYERS],
              admin: {
                width: '25%',
                description:
                  'Choose Women for a tee only women play: it uses the ladies’ par and stroke index.',
              },
            },
            {
              name: 'winter',
              label: 'Winter tee',
              type: 'checkbox',
              defaultValue: false,
              admin: { width: '75%', description: 'Tick for a tee only used in winter.' },
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
              admin: {
                width: '25%',
                step: 0.1,
                condition: (_, sibling) => sibling?.players !== 'women',
              },
            },
            {
              name: 'slope',
              label: 'Slope (men)',
              type: 'number',
              min: 55,
              max: 155,
              admin: { width: '25%', condition: (_, sibling) => sibling?.players !== 'women' },
            },
            {
              name: 'ratingWomen',
              label: 'Course rating (women)',
              type: 'number',
              min: 50,
              max: 90,
              admin: {
                width: '25%',
                step: 0.1,
                description: 'Optional.',
                condition: (_, sibling) => sibling?.players !== 'men',
              },
            },
            {
              name: 'slopeWomen',
              label: 'Slope (women)',
              type: 'number',
              min: 55,
              max: 155,
              admin: {
                width: '25%',
                description: 'Optional.',
                condition: (_, sibling) => sibling?.players !== 'men',
              },
            },
          ],
        },
        {
          // Which yards boxes on each hole belong to this tee. Set on save (assignTeeSlots).
          name: 'slot',
          type: 'number',
          min: 1,
          max: MAX_TEES,
          admin: { hidden: true },
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
        { type: 'row', fields: TEE_SLOTS.map(yards) },
        ...LEGACY_YARDS,
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
