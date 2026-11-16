import type { Block } from 'payload'

import type { BlockDefinition } from '../types'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
].map((label, i) => ({ label, value: String(i + 1) }))

/**
 * Visitor times (feature gap G4, 15 Nov 2026): when visitors can play, day by day, e.g.
 * "Thursday: members only" or "Saturday: after 1pm". 18 of 50 audited clubs publish this.
 * Up to three timetables (e.g. summer and winter); the one for this month opens first.
 * One style for now; not yet drawn in Figma, so it borrows the Price table's look.
 */
const config: Block = {
  slug: 'visitorTimes',
  labels: { singular: 'Visitor times', plural: 'Visitor times' },
  interfaceName: 'VisitorTimesBlock',
  fields: [
    // One style for now, so there is nothing to choose: the picker is hidden.
    {
      name: 'style',
      label: 'Design style',
      type: 'select',
      required: true,
      defaultValue: 'table',
      options: [{ label: 'A · Table: a row per day, a tab per season', value: 'table' }],
      admin: { hidden: true },
    },
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    {
      name: 'heading',
      label: 'Heading',
      type: 'text',
      required: true,
      maxLength: 60,
      defaultValue: 'When visitors can play',
    },
    { name: 'intro', label: 'Introduction (optional)', type: 'textarea', maxLength: 200 },
    {
      name: 'timetables',
      label: 'Timetables',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      labels: { singular: 'Timetable', plural: 'Timetables' },
      admin: {
        description:
          'One is enough if the times never change. Add one per season (e.g. "Summer", "Winter") if they do; the one for this month is shown first.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'name',
              label: 'Name',
              type: 'text',
              maxLength: 24,
              admin: { width: '40%', description: 'e.g. "Summer". Shown as the tab.' },
            },
            {
              name: 'startMonth',
              label: 'From (optional)',
              type: 'select',
              options: MONTHS,
              admin: { width: '30%' },
            },
            {
              name: 'endMonth',
              label: 'To (optional)',
              type: 'select',
              options: MONTHS,
              admin: { width: '30%' },
            },
          ],
        },
        {
          name: 'rows',
          label: 'Days',
          type: 'array',
          minRows: 1,
          maxRows: 10,
          labels: { singular: 'Day', plural: 'Days' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'days',
                  label: 'Day or days',
                  type: 'text',
                  required: true,
                  maxLength: 30,
                  admin: { width: '30%', description: 'e.g. "Monday to Friday"' },
                },
                {
                  name: 'times',
                  label: 'Visitor times',
                  type: 'text',
                  required: true,
                  maxLength: 40,
                  admin: { width: '30%', description: 'e.g. "9:30am to 1pm" or "Members only"' },
                },
                {
                  name: 'note',
                  label: 'Note (optional)',
                  type: 'text',
                  maxLength: 60,
                  admin: { width: '40%', description: 'e.g. "Two-balls only before 10am"' },
                },
              ],
            },
          ],
        },
      ],
    },
    { name: 'footnote', label: 'Footnote (optional)', type: 'textarea', maxLength: 240 },
  ],
}

export const visitorTimes: BlockDefinition = { config, refs: () => [] }
