import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { collectRefs, styleField } from '../shared'
import type { BlockDefinition } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})

/** FAQ / Accordion (docs/design/11). One block, three design styles. */
const config: Block = {
  slug: 'faq',
  labels: { singular: 'Questions and answers', plural: 'Questions and answers' },
  interfaceName: 'FaqBlock',
  fields: [
    styleField([
      { label: 'A · Centred: one column, with a contact prompt below', value: 'centred' },
      { label: 'B · With contact: a contact card beside the questions', value: 'withContact' },
      {
        label: 'C · Search & topics: search and topic tabs, for many questions',
        value: 'searchTopics',
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
      name: 'items',
      label: 'Questions',
      type: 'array',
      minRows: 1,
      maxRows: 40,
      labels: { singular: 'Question', plural: 'Questions' },
      admin: { initCollapsed: true, description: 'Style A reads best with up to 10.' },
      fields: [
        { name: 'question', label: 'Question', type: 'text', required: true, maxLength: 120 },
        { name: 'answer', label: 'Answer', type: 'textarea', required: true, maxLength: 800 },
        {
          name: 'topic',
          label: 'Topic (style C)',
          type: 'text',
          maxLength: 24,
          admin: { description: 'e.g. "Visitors". 2–4 topics work best.' },
        },
      ],
    },
    { name: 'firstOpen', label: 'Open the first answer', type: 'checkbox', defaultValue: true },
    {
      name: 'cardHeading',
      label: 'Contact card heading (style B)',
      type: 'text',
      maxLength: 40,
      admin: {
        ...onlyFor('withContact'),
        description: 'e.g. "Talk to the pro shop". Phone, email and hours come from Club Settings.',
      },
    },
    {
      ...linkField({ name: 'contactLink', label: 'Contact link (optional)', required: false }),
      admin: { description: 'e.g. "Contact the pro shop" (A, C) or "Send a message" (B).' },
    },
  ],
}

export const faq: BlockDefinition = {
  config,
  refs: (block, path) => collectRefs(block, path, { links: ['contactLink'] }),
}
