import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { collectRefs, styleField } from '../shared'
import { type BlockDefinition, type BlockRef, idOf } from '../types'

/** Document List (docs/design/11). One block, three design styles. */
const config: Block = {
  slug: 'documentList',
  labels: { singular: 'Document list', plural: 'Document lists' },
  interfaceName: 'DocumentListBlock',
  fields: [
    styleField([
      { label: 'A · Grouped: by category, categories down the left', value: 'grouped' },
      { label: 'B · Cards: a few key documents as cards', value: 'cards' },
      { label: 'C · Library: searchable table with category tabs', value: 'table' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'documents',
      label: 'Documents',
      type: 'relationship',
      relationTo: 'documents',
      hasMany: true,
      required: true,
      maxRows: 60,
      admin: { description: 'In the order you want them. Style A groups them by category.' },
    },
    {
      ...linkField({
        name: 'viewAll',
        label: '"All documents" link (style B, optional)',
        required: false,
      }),
      admin: { condition: (_d, sibling) => sibling?.style === 'cards' },
    },
  ],
}

export const documentList: BlockDefinition = {
  config,
  refs: (block, path) => {
    const refs: BlockRef[] = collectRefs(block, path, { links: ['viewAll'] })
    const docs = Array.isArray(block.documents) ? block.documents : []
    for (const d of docs) {
      const id = idOf(d)
      if (id) refs.push({ collection: 'documents', id, path: `${path}.documents` })
    }
    return refs
  },
}
