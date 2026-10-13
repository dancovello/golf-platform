import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { collectRefs, styleField } from '../shared'
import { type BlockDefinition, type BlockRef, idOf } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})

/** Team / Staff (docs/design/11). One block, three design styles; people come from Team & staff. */
const config: Block = {
  slug: 'team',
  labels: { singular: 'Team', plural: 'Teams' },
  interfaceName: 'TeamBlock',
  fields: [
    styleField([
      { label: 'A · Grid: portraits, four across', value: 'grid' },
      { label: 'B · Directory: who to contact, by department', value: 'directory' },
      { label: 'C · Featured: one lead person, the rest beside them', value: 'featured' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'featured',
      label: 'Featured person',
      type: 'relationship',
      relationTo: 'staff',
      admin: {
        ...onlyFor('featured'),
        description: 'e.g. the Head Professional. Their bio and email are shown.',
      },
    },
    {
      name: 'people',
      label: 'People',
      type: 'relationship',
      relationTo: 'staff',
      hasMany: true,
      maxRows: 40,
      admin: {
        description:
          'In the order you want them. Style B groups them by department; style C lists up to 4 beside the featured person.',
      },
    },
    {
      ...linkField({ name: 'action', label: 'Button (optional)', required: false }),
      admin: {
        ...onlyFor('directory', 'featured'),
        description: 'e.g. "General enquiries" (B) or "Book a lesson" (C).',
      },
    },
    {
      ...linkField({ name: 'viewAll', label: '"All" link (optional)', required: false }),
      admin: { ...onlyFor('featured'), description: 'e.g. "All professionals".' },
    },
  ],
}

export const team: BlockDefinition = {
  config,
  refs: (block, path) => {
    const refs: BlockRef[] = collectRefs(block, path, { links: ['action', 'viewAll'] })
    const featured = idOf(block.featured)
    if (featured) refs.push({ collection: 'staff', id: featured, path: `${path}.featured` })
    for (const p of Array.isArray(block.people) ? block.people : []) {
      const id = idOf(p)
      if (id) refs.push({ collection: 'staff', id, path: `${path}.people` })
    }
    return refs
  },
}
