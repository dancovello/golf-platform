import type { Block } from 'payload'

import { collectArrayRefs, imageField, styleField } from '../shared'
import type { BlockDefinition } from '../types'

/** Timeline (docs/design/11). One block, three design styles. */
const config: Block = {
  slug: 'timeline',
  labels: { singular: 'Timeline', plural: 'Timelines' },
  interfaceName: 'TimelineBlock',
  fields: [
    styleField([
      {
        label: 'A · Alternating: a centre line, entries left and right with photos',
        value: 'alternating',
      },
      {
        label: 'B · Horizontal: a scrolling strip of years on the brand colour',
        value: 'horizontal',
      },
      {
        label: 'C · Ledger: an introduction beside a ruled list (good for many entries)',
        value: 'ledger',
      },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'intro',
      label: 'Introduction (style C, optional)',
      type: 'textarea',
      maxLength: 160,
      admin: { condition: (_d, sibling) => sibling?.style === 'ledger' },
    },
    {
      name: 'entries',
      label: 'Milestones',
      type: 'array',
      minRows: 1,
      maxRows: 40,
      labels: { singular: 'Milestone', plural: 'Milestones' },
      admin: { initCollapsed: true },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'year',
              label: 'Year',
              type: 'text',
              required: true,
              maxLength: 9,
              admin: { width: '25%' },
            },
            { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 50 },
          ],
        },
        {
          name: 'text',
          label: 'One line',
          type: 'textarea',
          required: true,
          maxLength: 200,
          admin: { description: 'About 30 words.' },
        },
        imageField('image', 'Photo (style A, optional)', false),
      ],
    },
  ],
}

export const timeline: BlockDefinition = {
  config,
  refs: (block, path) => collectArrayRefs(block, path, 'entries', { images: ['image'] }),
}
