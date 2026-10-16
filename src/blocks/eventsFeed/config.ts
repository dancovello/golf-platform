import type { Block } from 'payload'

import { EVENT_CATEGORIES } from '../../collections/eventCategories'
import { styleField } from '../shared'
import type { BlockDefinition } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})

/** Events (doc 14). One block, three design styles; always the club's next published events. */
const config: Block = {
  slug: 'eventsFeed',
  labels: { singular: 'Upcoming events', plural: 'Upcoming events' },
  interfaceName: 'EventsFeedBlock',
  fields: [
    styleField([
      { label: 'A · Card carousel: the next six, ending on "All events"', value: 'carousel' },
      { label: 'B · Agenda: the next four as a list beside some text', value: 'agenda' },
      {
        label: 'C · Featured: one event large (the one marked featured), and the next two',
        value: 'featured',
      },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading',
      type: 'text',
      defaultValue: 'What’s on',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'intro',
      label: 'Text beside the list (style B, optional)',
      type: 'textarea',
      maxLength: 200,
      admin: { ...onlyFor('agenda') },
    },
    {
      name: 'category',
      label: 'Only this category (optional)',
      type: 'select',
      options: [...EVENT_CATEGORIES],
      admin: { ...onlyFor('carousel', 'agenda'), description: 'Leave empty for all events.' },
    },
  ],
}

export const eventsFeed: BlockDefinition = { config, refs: () => [] }
