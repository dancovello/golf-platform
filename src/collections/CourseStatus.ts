import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { loggedIn, superAdminOnly } from '../access/roles'
import { NOTICE_KINDS, STATUS_STATES } from './courseStatusStates'

/** The parts that say how the course is today. Notices are planned ahead, so they're not. */
const todaysStatus = (d: Record<string, unknown> | undefined) =>
  JSON.stringify([
    d?.state ?? null,
    (d?.reason as string | null | undefined)?.trim() || null,
    ((d?.facilities as Record<string, unknown>[] | null | undefined) ?? []).map((f) => [
      f.label,
      f.state,
      (f.value as string | null | undefined)?.trim() || null,
    ]),
    (d?.changedBy as string | null | undefined)?.trim() || null,
  ])

const noticesOf = (d: Record<string, unknown> | undefined) =>
  JSON.stringify(
    ((d?.notices as Record<string, unknown>[] | null | undefined) ?? []).map((n) => [
      n.message,
      n.kind,
      n.startsOn,
      n.endsOn ?? null,
    ]),
  )

/**
 * "Last changed" (and the 24-hour check) is about the course today. Adding or editing only
 * notices doesn't count as checking the course, so it keeps the time from before (G4). Any
 * other save, including one that changes nothing (confirming it is still right), counts.
 */
const stampStatusChange: CollectionBeforeChangeHook = ({ data, originalDoc, operation }) => {
  const now = new Date().toISOString()
  if (operation === 'create' || !originalDoc) return { ...data, stateChangedAt: now }
  const merged = { ...originalDoc, ...data }
  const onlyNotices =
    todaysStatus(merged) === todaysStatus(originalDoc) &&
    noticesOf(merged) !== noticesOf(originalDoc)
  return {
    ...data,
    stateChangedAt: onlyNotices
      ? (originalDoc.stateChangedAt ?? originalDoc.updatedAt ?? now)
      : now,
  }
}

const dayOnly = { pickerAppearance: 'dayOnly' as const, displayFormat: 'd MMM yyyy' }

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
  hooks: { beforeChange: [stampStatusChange] },
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
      admin: {
        description:
          'e.g. Buggies: Restricted, "Paths only". For a club with several courses, one line per course, e.g. Heathland course: Open. Up to six.',
      },
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
    {
      // G4, 15 Nov 2026: changes the club knows about in advance (winter mats, a closure, holes
      // out of play). Each shows by itself while it applies, and shortly before.
      name: 'notices',
      label: 'Planned notices',
      type: 'array',
      maxRows: 10,
      labels: { singular: 'Notice', plural: 'Notices' },
      admin: {
        initCollapsed: true,
        components: { RowLabel: '/admin/NoticeRowLabel#NoticeRowLabel' },
        description:
          'For things you know in advance, such as winter mats from 1 December to 28 February. A notice appears on its first day (and as “coming up” in the month before) and goes by itself after its last day, so there is nothing to remember. The line above is still for how the course is today.',
      },
      fields: [
        { name: 'message', label: 'Notice', type: 'text', required: true, maxLength: 120 },
        {
          // G16 (15 Nov 2026): which course, for clubs with more than one. Plain words, so it
          // can't point at another club's course.
          name: 'appliesTo',
          label: 'Which course (optional)',
          type: 'text',
          maxLength: 40,
          admin: { description: 'Only if you have more than one course. e.g. "Heathland course".' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              label: 'Type',
              type: 'select',
              required: true,
              defaultValue: 'restricted',
              options: [...NOTICE_KINDS],
              admin: { width: '34%' },
            },
            {
              name: 'startsOn',
              label: 'From',
              type: 'date',
              required: true,
              admin: { width: '33%', date: dayOnly },
            },
            {
              name: 'endsOn',
              label: 'Until (optional)',
              type: 'date',
              admin: {
                width: '33%',
                date: dayOnly,
                description: 'Blank: until you remove it.',
              },
              validate: (
                value: unknown,
                { siblingData }: { siblingData: { startsOn?: unknown } },
              ) =>
                !value ||
                !siblingData?.startsOn ||
                new Date(String(value)) >= new Date(String(siblingData.startsOn))
                  ? true
                  : 'A notice must end on or after the day it starts.',
            },
          ],
        },
      ],
    },
    {
      // When the course itself was last confirmed or changed (stampStatusChange).
      name: 'stateChangedAt',
      type: 'date',
      admin: { hidden: true },
    },
  ],
}
