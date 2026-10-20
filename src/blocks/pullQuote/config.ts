import type { Block } from 'payload'

import { collectRefs, imageField, styleField } from '../shared'
import type { BlockDefinition } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})

/** Pull-Quote (docs/design/11). One block, three design styles. */
const config: Block = {
  slug: 'pullQuote',
  labels: { singular: 'Quote', plural: 'Quotes' },
  interfaceName: 'PullQuoteBlock',
  fields: [
    styleField([
      { label: 'A · Centred: a quiet quote between sections', value: 'centred' },
      { label: 'B · Over a photo: full-width photo behind the quote', value: 'overImage' },
      { label: 'C · Split: beside a photo, with the publication named', value: 'split' },
    ]),
    {
      name: 'quote',
      label: 'Quote',
      type: 'textarea',
      required: true,
      maxLength: 200,
      admin: { description: 'Without quotation marks; they are added for you.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'name', label: 'Who said it', type: 'text', required: true, maxLength: 60 },
        {
          name: 'role',
          label: 'Role or date (optional)',
          type: 'text',
          maxLength: 60,
          admin: { description: 'e.g. "Member since 1985"' },
        },
      ],
    },
    {
      type: 'row',
      admin: onlyFor('split'),
      fields: [
        { name: 'publication', label: 'Publication (optional)', type: 'text', maxLength: 40 },
        { name: 'year', label: 'Year', type: 'text', maxLength: 4 },
      ],
    },
    imageField('image', 'Photo', false, { admin: onlyFor('overImage', 'split') }),
  ],
}

export const pullQuote: BlockDefinition = {
  config,
  refs: (block, path) => collectRefs(block, path, { images: ['image'] }),
}
