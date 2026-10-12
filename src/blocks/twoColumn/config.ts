import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { collectRefs, imageField, styleField } from '../shared'
import type { BlockDefinition } from '../types'

const onlyFor = (...styles: string[]) => ({
  condition: (_d: unknown, sibling: { style?: string }) => styles.includes(sibling?.style ?? ''),
})

/** Two-Column Image + Text (docs/design/10). One block, three design styles. */
const config: Block = {
  slug: 'twoColumn',
  labels: { singular: 'Image and text', plural: 'Image and text' },
  interfaceName: 'TwoColumnBlock',
  fields: [
    styleField([
      { label: 'A · Split: edge-to-edge photo beside a text panel', value: 'split' },
      { label: 'B · Collage: tall photo with a smaller overlapping photo', value: 'collage' },
      { label: 'C · Key facts: photo, text and up to three facts', value: 'keyFacts' },
    ]),
    {
      type: 'row',
      fields: [
        {
          name: 'imageSide',
          label: 'Photo on the',
          type: 'radio',
          defaultValue: 'left',
          options: [
            { label: 'Left', value: 'left' },
            { label: 'Right', value: 'right' },
          ],
          admin: { description: 'Alternate sides when two of these follow each other.' },
        },
        {
          name: 'tone',
          label: 'Text panel colour',
          type: 'radio',
          defaultValue: 'canvas',
          options: [
            { label: 'Page background', value: 'canvas' },
            { label: 'Brand colour', value: 'brand' },
          ],
          admin: onlyFor('split'),
        },
      ],
    },
    imageField('image', 'Photo'),
    imageField('insetImage', 'Smaller overlapping photo (optional)', false, {
      admin: onlyFor('collage'),
    }),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'body',
      label: 'Text',
      type: 'textarea',
      required: true,
      maxLength: 700,
      admin: {
        description:
          '60–90 words reads best (40–70 with key facts). A blank line starts a new paragraph.',
      },
    },
    {
      name: 'facts',
      label: 'Key facts',
      type: 'array',
      maxRows: 3,
      admin: { ...onlyFor('keyFacts'), description: 'e.g. Opened · 1926' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Label', type: 'text', required: true, maxLength: 20 },
            { name: 'value', label: 'Value', type: 'text', required: true, maxLength: 20 },
          ],
        },
      ],
    },
    linkField({ name: 'link', label: 'Link (optional)', required: false }),
  ],
}

export const twoColumn: BlockDefinition = {
  config,
  refs: (block, path) =>
    collectRefs(block, path, { images: ['image', 'insetImage'], links: ['link'] }),
}
