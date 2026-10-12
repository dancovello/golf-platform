import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { type BlockDefinition, type BlockRef, idOf } from '../types'

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** CTA Card Grid (docs/design/09). One block, three design styles; 3–6 cards. */
const config: Block = {
  slug: 'ctaCardGrid',
  labels: { singular: 'Card grid', plural: 'Card grids' },
  interfaceName: 'CtaCardGridBlock',
  fields: [
    {
      name: 'style',
      label: 'Design style',
      type: 'select',
      required: true,
      defaultValue: 'editorial',
      options: [
        {
          label: 'A · Editorial: white cards with photo, title, line and link',
          value: 'editorial',
        },
        { label: 'B · Immersive: tall photo cards on the brand colour', value: 'immersive' },
        { label: 'C · Index: numbered, square photos on a hairline rule', value: 'index' },
      ],
    },
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
      admin: { condition: (_d, sibling) => sibling?.style === 'index' },
    },
    {
      ...linkField({
        name: 'viewAll',
        label: '"View all" button (style A, optional)',
        required: false,
      }),
      admin: { condition: (_d, sibling) => sibling?.style === 'editorial' },
    },
    {
      name: 'cards',
      label: 'Cards',
      type: 'array',
      minRows: 3,
      maxRows: 6,
      labels: { singular: 'Card', plural: 'Cards' },
      admin: { description: '3 to 6 cards. Titles of 2–4 words read best.' },
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 30 },
        { name: 'description', label: 'Short line (optional)', type: 'textarea', maxLength: 100 },
        {
          name: 'eyebrow',
          label: 'Small line above the title (style B, optional)',
          type: 'text',
          maxLength: 30,
        },
        {
          name: 'image',
          label: 'Photo',
          type: 'upload',
          relationTo: 'media',
          required: true,
          filterOptions: { mimeType: { in: IMAGE_TYPES } },
        },
        linkField({ name: 'link', label: 'Goes to', withLabel: false }),
      ],
    },
  ],
}

export const ctaCardGrid: BlockDefinition = {
  config,
  refs: (block, path) => {
    const refs: BlockRef[] = []
    const page = (link: unknown, at: string) => {
      const l = (link ?? {}) as { type?: string; page?: unknown }
      const id = l.type === 'url' ? null : idOf(l.page)
      if (id) refs.push({ collection: 'pages', id, path: `${at}.page` })
    }
    page(block.viewAll, `${path}.viewAll`)
    const cards = Array.isArray(block.cards) ? (block.cards as Record<string, unknown>[]) : []
    cards.forEach((card, i) => {
      const image = idOf(card.image)
      if (image) refs.push({ collection: 'media', id: image, path: `${path}.cards.${i}.image` })
      page(card.link, `${path}.cards.${i}.link`)
    })
    return refs
  },
}
