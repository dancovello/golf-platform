import type { Block } from 'payload'

import { styleField } from '../shared'
import { type BlockDefinition, type BlockRef, idOf } from '../types'

/** Scorecard (docs/design/09). One block, three design styles, reading one of the club's courses. */
const config: Block = {
  slug: 'scorecard',
  labels: { singular: 'Scorecard', plural: 'Scorecards' },
  interfaceName: 'ScorecardBlock',
  fields: [
    styleField([
      { label: 'A · Classic: the printed card, holes across', value: 'classic' },
      { label: 'B · Vertical: holes down, front and back nine side by side', value: 'vertical' },
      { label: 'C · Tee selector: all 18 on one strip, pick a tee', value: 'teeSelector' },
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
      admin: { description: 'Holes, tees, ratings and slopes come from Courses.' },
    },
    {
      name: 'download',
      label: 'Printable scorecard (optional)',
      type: 'relationship',
      relationTo: 'documents',
      admin: { description: 'Shown as a "Download scorecard" button.' },
    },
    {
      name: 'linkToGuide',
      label: 'Link each hole to the course guide on this page',
      type: 'checkbox',
      admin: {
        condition: (_d, sibling) => sibling?.style === 'vertical',
        description: 'Only if this page also has a Hole by hole block in style C.',
      },
    },
    {
      name: 'note',
      label: 'Small print below (optional)',
      type: 'textarea',
      maxLength: 240,
      admin: { description: 'e.g. "Yardages measured from the back of each tee."' },
    },
  ],
}

export const scorecard: BlockDefinition = {
  config,
  refs: (block, path) => {
    const refs: BlockRef[] = []
    const course = idOf(block.course)
    if (course) refs.push({ collection: 'courses', id: course, path: `${path}.course` })
    const download = idOf(block.download)
    if (download) refs.push({ collection: 'documents', id: download, path: `${path}.download` })
    return refs
  },
}
