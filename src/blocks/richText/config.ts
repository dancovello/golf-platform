import type { Block } from 'payload'

import { styleField } from '../shared'
import type { BlockDefinition } from '../types'
import { clubRichText, richTextRefs } from './lexical'

const onlyEditorial = {
  condition: (_d: unknown, sibling: { style?: string }) => sibling?.style === 'editorial',
}

/** Rich Text (docs/design/11). One block, three design styles. */
const config: Block = {
  slug: 'richText',
  labels: { singular: 'Text', plural: 'Text' },
  interfaceName: 'RichTextBlock',
  fields: [
    styleField([
      { label: 'A · Article: one readable column', value: 'article' },
      { label: 'B · With contents: an "On this page" list beside the text', value: 'contents' },
      {
        label: 'C · Editorial: large opening paragraph, drop cap and a side note',
        value: 'editorial',
      },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above (style C, optional)',
      type: 'text',
      maxLength: 40,
      admin: onlyEditorial,
    },
    {
      name: 'content',
      label: 'Text',
      type: 'richText',
      required: true,
      editor: clubRichText,
      admin: {
        description:
          'Headings, paragraphs, lists, quotes, links and photos. Style B lists every main heading (H2) in "On this page" once there are three or more. Style C shows the first paragraph larger.',
      },
    },
    {
      type: 'row',
      admin: onlyEditorial,
      fields: [
        { name: 'noteTitle', label: 'Side note heading (optional)', type: 'text', maxLength: 30 },
        { name: 'noteText', label: 'Side note text (optional)', type: 'textarea', maxLength: 200 },
      ],
    },
  ],
}

export const richText: BlockDefinition = {
  config,
  refs: (block, path) => richTextRefs(block.content, `${path}.content`),
}
