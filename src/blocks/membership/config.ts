import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { collectArrayRefs, collectRefs, styleField } from '../shared'
import type { BlockDefinition } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})
// Inside the tiers array the style lives on the block, not the row.
const blockIs = (...styles: string[]) => ({
  condition: (_d: unknown, _s: unknown, { blockData }: { blockData?: { style?: string } }) =>
    styles.includes(blockData?.style ?? ''),
})

/** Membership Tier Cards (docs/design/10). One block, three design styles, one list of tiers. */
const config: Block = {
  slug: 'membership',
  labels: { singular: 'Membership categories', plural: 'Membership categories' },
  interfaceName: 'MembershipBlock',
  fields: [
    styleField([
      { label: 'A · Cards: a card per category, with prices', value: 'cards' },
      { label: 'B · Compare: a table of what each category includes', value: 'compare' },
      { label: 'C · Enquire: categories without prices, and an enquiry card', value: 'enquire' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    { name: 'intro', label: 'Introduction (optional)', type: 'textarea', maxLength: 240 },
    {
      name: 'features',
      label: 'Table rows (style B): what you compare',
      type: 'array',
      maxRows: 12,
      labels: { singular: 'Row', plural: 'Rows' },
      admin: {
        ...onlyFor('compare'),
        description:
          'Start here. Each row is one thing you compare, e.g. "Playing days" or "Locker". Then, in each category below, fill in "Table values" in the same order: value 1 goes beside row 1, value 2 beside row 2, and so on.',
      },
      validate: (rows: unknown, { siblingData }: { siblingData?: unknown }) => {
        const data = (siblingData ?? {}) as {
          style?: string
          tiers?: { values?: { value?: string | null }[] | null }[] | null
        }
        const typedValues = (data.tiers ?? []).some((t) =>
          (t.values ?? []).some((v) => v?.value?.trim()),
        )
        return data.style === 'compare' && typedValues && !(Array.isArray(rows) && rows.length)
          ? 'The categories have table values, but there are no table rows for them to appear beside. Add a row (e.g. "Playing days") for each value.'
          : true
      },
      fields: [{ name: 'label', label: 'Row', type: 'text', required: true, maxLength: 40 }],
    },
    {
      name: 'tiers',
      label: 'Categories',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      labels: { singular: 'Category', plural: 'Categories' },
      admin: {
        initCollapsed: true,
        description: 'In the order you want them. Style A reads best with three.',
      },
      validate: (rows: unknown) =>
        (Array.isArray(rows) ? rows : []).filter((r) => r?.recommended).length <= 1
          ? true
          : 'Only one category can be marked "Most popular".',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 30 },
            {
              name: 'price',
              label: 'Price (optional)',
              type: 'text',
              maxLength: 12,
              admin: {
                ...blockIs('cards', 'compare'),
                description: 'e.g. "£1,780". Leave empty to show "On application".',
              },
            },
            {
              name: 'period',
              label: 'Price note',
              type: 'text',
              maxLength: 30,
              admin: { ...blockIs('cards', 'compare'), description: 'e.g. "per year".' },
            },
          ],
        },
        {
          name: 'description',
          label: 'Short description',
          type: 'textarea',
          maxLength: 200,
          admin: { description: 'Who it is for, in a sentence or two.' },
        },
        {
          name: 'benefits',
          label: 'What it includes (style A)',
          type: 'array',
          maxRows: 6,
          labels: { singular: 'Line', plural: 'Lines' },
          admin: { ...blockIs('cards'), description: '3 to 6 short lines.' },
          fields: [{ name: 'text', label: 'Line', type: 'text', required: true, maxLength: 60 }],
        },
        {
          name: 'values',
          label: 'Table values (style B): one per table row, in order',
          type: 'array',
          maxRows: 12,
          labels: { singular: 'Value', plural: 'Values' },
          admin: {
            ...blockIs('compare'),
            description:
              'Value 1 appears beside table row 1 (set at the top of this block), value 2 beside row 2, and so on. Type "yes" for a tick; leave empty for a dash. Nothing shows until the table rows exist.',
          },
          fields: [{ name: 'value', label: 'Value', type: 'text', maxLength: 20 }],
        },
        {
          name: 'availability',
          label: 'Availability (style C)',
          type: 'text',
          maxLength: 30,
          admin: { ...blockIs('enquire'), description: 'e.g. "Places available".' },
        },
        {
          name: 'recommended',
          label: 'Most popular (one only)',
          type: 'checkbox',
          admin: { ...blockIs('cards', 'compare') },
        },
        linkField({
          name: 'link',
          label: 'Apply or enquire link',
          withLabel: false,
          required: false,
          allowDocument: true,
        }),
      ],
    },
    {
      name: 'buttonLabel',
      label: 'Button text on each category (optional)',
      type: 'text',
      maxLength: 30,
      admin: {
        description: 'Defaults: "Apply for membership" (A), "Apply" (B), "Enquire" (C).',
      },
    },
    {
      ...linkField({
        name: 'action',
        label: 'Header button (optional)',
        required: false,
        allowDocument: true,
      }),
      admin: { ...onlyFor('compare'), description: 'e.g. "Book a tour".' },
    },
    {
      name: 'card',
      label: 'Enquiry card (style C)',
      type: 'group',
      admin: { ...onlyFor('enquire') },
      fields: [
        { name: 'heading', label: 'Heading', type: 'text', maxLength: 40 },
        { name: 'text', label: 'Text (optional)', type: 'textarea', maxLength: 200 },
        linkField({ name: 'link', label: 'Button', required: false, allowDocument: true }),
        {
          name: 'note',
          label: 'Small print (optional)',
          type: 'text',
          maxLength: 100,
          admin: { description: 'e.g. "The Membership Secretary replies within two days."' },
        },
      ],
    },
    {
      name: 'note',
      label: 'Small print below (optional)',
      type: 'textarea',
      maxLength: 240,
      admin: { description: 'e.g. joining fees, which year the prices are for, VAT.' },
    },
  ],
}

export const membership: BlockDefinition = {
  config,
  refs: (block, path) => [
    ...collectRefs(block, path, { links: ['action'] }),
    ...collectRefs((block.card ?? {}) as Record<string, unknown>, `${path}.card`, {
      links: ['link'],
    }),
    ...collectArrayRefs(block, path, 'tiers', { links: ['link'] }),
  ],
}
