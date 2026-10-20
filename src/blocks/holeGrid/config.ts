import type { Block } from 'payload'

import { styleField } from '../shared'
import { type BlockDefinition, idOf } from '../types'

/** Hole-by-hole (docs/design/09). One block, three design styles, reading one of the club's courses. */
const config: Block = {
  slug: 'holeGrid',
  labels: { singular: 'Hole by hole', plural: 'Hole by hole' },
  interfaceName: 'HoleGridBlock',
  fields: [
    styleField([
      { label: 'A · Cards: a photo card per hole, front and back nine tabs', value: 'cards' },
      { label: 'B · Carousel: large photo cards on the brand colour', value: 'carousel' },
      { label: 'C · Course guide: a row per hole with its tip and every tee', value: 'guide' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'course',
      label: 'Course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      admin: { description: 'Holes, tees and photos come from Courses.' },
    },
  ],
}

export const holeGrid: BlockDefinition = {
  config,
  refs: (block, path) => {
    const id = idOf(block.course)
    return id ? [{ collection: 'courses', id, path: `${path}.course` }] : []
  },
}
