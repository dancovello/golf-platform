import type { Block } from 'payload'

import { isSafeURL } from '../../fields/link'
import { collectArrayRefs, imageField, styleField } from '../shared'
import type { BlockDefinition } from '../types'

/** Partner / Logo Strip (docs/design/11). One block, three design styles. */
const config: Block = {
  slug: 'logoStrip',
  labels: { singular: 'Logo strip', plural: 'Logo strips' },
  interfaceName: 'LogoStripBlock',
  fields: [
    styleField([
      { label: 'A · Row: one quiet row of up to 6 logos', value: 'row' },
      { label: 'B · Grid: a ruled grid beside an introduction', value: 'grid' },
      { label: 'C · Marquee: logos scrolling slowly on the brand colour', value: 'marquee' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line (optional)',
      type: 'text',
      maxLength: 40,
      admin: { description: 'e.g. "Accredited & supported by"' },
    },
    {
      name: 'heading',
      label: 'Heading (style B)',
      type: 'text',
      maxLength: 40,
      admin: { condition: (_d, sibling) => sibling?.style === 'grid' },
    },
    {
      name: 'intro',
      label: 'Introduction (style B, optional)',
      type: 'textarea',
      maxLength: 200,
      admin: { condition: (_d, sibling) => sibling?.style === 'grid' },
    },
    {
      name: 'partners',
      label: 'Logos',
      type: 'array',
      minRows: 1,
      maxRows: 16,
      labels: { singular: 'Logo', plural: 'Logos' },
      admin: {
        initCollapsed: true,
        description: 'Style A shows up to 6. PNG or WebP with a transparent background works best.',
      },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'name', label: 'Organisation', type: 'text', required: true, maxLength: 40 },
            {
              name: 'url',
              label: 'Website (optional)',
              type: 'text',
              validate: (value: unknown) =>
                !value || isSafeURL(value)
                  ? true
                  : 'Use a full web address starting with https://.',
            },
          ],
        },
        imageField('logo', 'Logo (optional; the name is shown until there is one)', false),
      ],
    },
  ],
}

export const logoStrip: BlockDefinition = {
  config,
  refs: (block, path) => collectArrayRefs(block, path, 'partners', { images: ['logo'] }),
}
