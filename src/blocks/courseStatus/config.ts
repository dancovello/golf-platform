import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { collectRefs, styleField } from '../shared'
import type { BlockDefinition } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})

/** Course status (docs/design/09). One block, three design styles; the status itself is set in Course status. */
const config: Block = {
  slug: 'courseStatus',
  labels: { singular: 'Course status', plural: 'Course status' },
  interfaceName: 'CourseStatusBlock',
  fields: [
    styleField([
      { label: 'A · Board: the full status, for the course status page', value: 'board' },
      { label: 'B · Band: a compact strip, e.g. under the homepage hero', value: 'band' },
      { label: 'C · Widget: a small card beside some text', value: 'widget' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
      admin: { ...onlyFor('board', 'widget') },
    },
    {
      name: 'heading',
      label: 'Heading',
      type: 'text',
      maxLength: 60,
      admin: { ...onlyFor('board', 'widget'), description: 'e.g. "Course status" (A).' },
    },
    {
      name: 'intro',
      label: 'Text beside the card (style C)',
      type: 'textarea',
      maxLength: 400,
      admin: { ...onlyFor('widget') },
    },
    {
      ...linkField({
        name: 'statusPage',
        label: 'Course status page (optional)',
        withLabel: false,
        required: false,
      }),
      admin: {
        ...onlyFor('band', 'widget'),
        description: 'The page with the full board. The band and "Full report" link to it.',
      },
    },
  ],
}

export const courseStatus: BlockDefinition = {
  config,
  refs: (block, path) => collectRefs(block, path, { links: ['statusPage'] }),
}
