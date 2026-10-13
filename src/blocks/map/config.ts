import type { Block } from 'payload'

import { styleField } from '../shared'
import type { BlockDefinition } from '../types'

/**
 * Map / Location (docs/design/11). One block, three design styles. The club's position,
 * address and contact details come from Club Settings (Location, Footer and Header tabs).
 */
const config: Block = {
  slug: 'map',
  labels: { singular: 'Map and directions', plural: 'Maps and directions' },
  interfaceName: 'MapBlock',
  fields: [
    styleField([
      { label: 'A · Split: map beside address and contact details', value: 'split' },
      { label: 'B · Full-width: wide map with a floating card', value: 'fullBleed' },
      { label: 'C · Getting here: route cards above a map strip', value: 'gettingHere' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'routes',
      label: 'Ways to get here (style C)',
      type: 'array',
      minRows: 0,
      maxRows: 4,
      admin: { condition: (_d, sibling) => sibling?.style === 'gettingHere' },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'mode',
              label: 'By',
              type: 'select',
              required: true,
              options: [
                { label: 'Car', value: 'car' },
                { label: 'Train', value: 'train' },
                { label: 'Air', value: 'air' },
                { label: 'Bus', value: 'bus' },
                { label: 'Bike or on foot', value: 'walk' },
              ],
            },
            {
              name: 'distance',
              label: 'Time or distance',
              type: 'text',
              maxLength: 30,
              admin: { description: 'e.g. "5 min from M25"' },
            },
          ],
        },
        {
          name: 'directions',
          label: 'Directions',
          type: 'textarea',
          required: true,
          maxLength: 300,
          admin: { description: 'About 45 words.' },
        },
      ],
    },
  ],
}

export const map: BlockDefinition = { config, refs: () => [] }
