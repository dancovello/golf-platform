import type { Block, Field } from 'payload'

import { linkField } from '../../fields/link'
import { collectRefs, styleField } from '../shared'
import type { BlockDefinition } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})
// Inside nested arrays the style lives on the block, not the row.
const blockIs = (...styles: string[]) => ({
  condition: (_d: unknown, _s: unknown, { blockData }: { blockData?: { style?: string } }) =>
    styles.includes(blockData?.style ?? ''),
})

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

const price = (n: number): Field => ({
  name: `price${n}`,
  label: `Price ${n}`,
  type: 'text',
  maxLength: 12,
  admin: { width: '25%' },
})

/**
 * Rate / Pricing Table (docs/design/10). One block, three design styles, one data shape:
 * tabs (A: seasons; B and C: audiences), each holding one or more price lists.
 */
const config: Block = {
  slug: 'rateTable',
  labels: { singular: 'Price table', plural: 'Price tables' },
  interfaceName: 'RateTableBlock',
  fields: [
    styleField([
      { label: 'A · Classic: season tabs above one table', value: 'classic' },
      { label: 'B · Seasons: a card per season, the current one highlighted', value: 'seasons' },
      { label: 'C · Matrix: a four-price table with a booking panel', value: 'matrix' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    { name: 'intro', label: 'Introduction (optional)', type: 'textarea', maxLength: 200 },
    {
      name: 'columns',
      label: 'Price columns',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      labels: { singular: 'Column', plural: 'Columns' },
      admin: {
        ...onlyFor('classic', 'matrix'),
        description:
          'e.g. "Mon–Thu" and "Fri–Sun & BH" (A), or Weekday AM / PM, Weekend AM / PM (C).',
      },
      fields: [
        { name: 'label', label: 'Column heading', type: 'text', required: true, maxLength: 20 },
      ],
    },
    {
      name: 'tabs',
      label: 'Tabs',
      type: 'array',
      minRows: 1,
      maxRows: 3,
      labels: { singular: 'Tab', plural: 'Tabs' },
      admin: {
        description:
          'Style A: one tab per season (e.g. "2026 season"). Styles B and C: one per audience (e.g. "Visitor", "Member’s guest", "Society"). One tab shows no tabs.',
      },
      fields: [
        { name: 'label', label: 'Tab name', type: 'text', required: true, maxLength: 24 },
        {
          name: 'sections',
          label: 'Price lists',
          type: 'array',
          minRows: 1,
          maxRows: 4,
          labels: { singular: 'Price list', plural: 'Price lists' },
          admin: { description: 'Style B: one per season. Styles A and C: usually one.' },
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'name',
                  label: 'Season name (style B)',
                  type: 'text',
                  maxLength: 30,
                  admin: blockIs('seasons'),
                },
                {
                  name: 'period',
                  label: 'Dates shown (style B)',
                  type: 'text',
                  maxLength: 40,
                  admin: { ...blockIs('seasons'), description: 'e.g. "1 June – 30 September"' },
                },
              ],
            },
            {
              type: 'row',
              admin: blockIs('seasons'),
              fields: [
                {
                  name: 'startMonth',
                  label: 'Repeats every year: starts in',
                  type: 'select',
                  options: MONTHS,
                },
                { name: 'endMonth', label: 'ends in', type: 'select', options: MONTHS },
              ],
            },
            {
              // G2, 15 Nov 2026: dated lists switch over by themselves, so last year's prices
              // never stay up. Collapsed and optional: most clubs never open it.
              type: 'collapsible',
              label: 'Dates: when do these prices apply? (optional)',
              admin: {
                initCollapsed: true,
                description:
                  'Add dates and the website switches over by itself: this list appears on its first day and disappears after its last, so old prices never stay up. Leave blank to always show it.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'validFrom',
                      label: 'First day',
                      type: 'date',
                      admin: {
                        width: '50%',
                        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
                      },
                    },
                    {
                      name: 'validUntil',
                      label: 'Last day',
                      type: 'date',
                      admin: {
                        width: '50%',
                        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
                      },
                      validate: (
                        value: unknown,
                        { siblingData }: { siblingData: { validFrom?: unknown } },
                      ) =>
                        !value ||
                        !siblingData?.validFrom ||
                        new Date(String(value)) >= new Date(String(siblingData.validFrom))
                          ? true
                          : 'The last day can’t be before the first day.',
                    },
                  ],
                },
              ],
            },
            {
              name: 'rows',
              label: 'Rates',
              type: 'array',
              minRows: 1,
              maxRows: 12,
              labels: { singular: 'Rate', plural: 'Rates' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'label', label: 'Rate', type: 'text', required: true, maxLength: 40 },
                    {
                      name: 'subLabel',
                      label: 'Small print (optional)',
                      type: 'text',
                      maxLength: 60,
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [price(1), price(2), price(3), price(4)],
                },
              ],
            },
            {
              name: 'note',
              label: 'Note under the list (style B, optional)',
              type: 'text',
              maxLength: 80,
              admin: blockIs('seasons'),
            },
          ],
        },
      ],
    },
    {
      name: 'showUpcoming',
      label: 'Show next year’s prices early',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        // Only matters once a list has a first day, so it stays out of the way until then.
        condition: (data) =>
          ((data?.tabs ?? []) as { sections?: { validFrom?: unknown }[] }[]).some((t) =>
            (t.sections ?? []).some((s) => Boolean(s.validFrom)),
          ),
        description:
          'Tick this if you take bookings a year ahead: next year’s prices then show now, marked “These prices apply from …”. Leave it off and they appear on their first day.',
      },
    },
    { name: 'footnote', label: 'Footnote (optional)', type: 'textarea', maxLength: 240 },
    {
      ...linkField({
        name: 'button',
        label: 'Button (optional)',
        required: false,
        allowDocument: true,
      }),
      admin: { description: 'Leave empty to use the club’s "Book a tee time" button.' },
    },
    {
      type: 'collapsible',
      label: 'Booking panel (style C)',
      admin: onlyFor('matrix'),
      fields: [
        { name: 'asideEyebrow', label: 'Small line', type: 'text', maxLength: 30 },
        { name: 'asideHeading', label: 'Heading', type: 'text', maxLength: 40 },
        {
          name: 'included',
          label: 'What’s included',
          type: 'array',
          maxRows: 5,
          fields: [{ name: 'item', label: 'Item', type: 'text', required: true, maxLength: 50 }],
        },
        {
          name: 'showPhone',
          label: 'Show the club phone number',
          type: 'checkbox',
          defaultValue: true,
        },
      ],
    },
  ],
}

export const rateTable: BlockDefinition = {
  config,
  refs: (block, path) => collectRefs(block, path, { links: ['button'] }),
}
