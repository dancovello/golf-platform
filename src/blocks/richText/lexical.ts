import {
  BlockquoteFeature,
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  UploadFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { isSafeURL } from '../../fields/link'
import { type BlockRef, idOf } from '../types'

/**
 * The rich-text editor for club content: only H2/H3, paragraphs, bold/italic, lists, quotes,
 * links and photos (docs/design Rich Text spec: no font or colour controls for editors).
 * Links go to the club's own pages or a safe web address; photos come from the club's library.
 */
export const clubRichText = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    LinkFeature({
      enabledCollections: ['pages'],
      fields: ({ defaultFields }) =>
        defaultFields.map((field) =>
          'name' in field && field.name === 'url'
            ? {
                ...field,
                validate: (value: unknown, options: { siblingData?: { linkType?: string } }) =>
                  options?.siblingData?.linkType === 'internal' || isSafeURL(value)
                    ? true
                    : 'Use a full web address starting with https://, or mailto: / tel:.',
              }
            : field,
        ) as typeof defaultFields,
    }),
    UploadFeature({
      collections: {
        media: { fields: [{ name: 'caption', label: 'Caption', type: 'text', maxLength: 120 }] },
      },
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

type LexicalNode = {
  type?: string
  children?: LexicalNode[]
  relationTo?: string
  value?: unknown
  fields?: { linkType?: string; doc?: { relationTo?: string; value?: unknown } | null }
}

/** Every photo and page a rich-text value points at (for the same-club check). */
export const richTextRefs = (value: unknown, path: string): BlockRef[] => {
  const refs: BlockRef[] = []
  const walk = (node: LexicalNode | undefined) => {
    if (!node) return
    if (node.type === 'upload') {
      const id = idOf(node.value)
      if (id) refs.push({ collection: 'media', id, path })
    }
    if (
      (node.type === 'link' || node.type === 'autolink') &&
      node.fields?.linkType === 'internal'
    ) {
      const id = idOf(node.fields.doc?.value)
      if (id) refs.push({ collection: 'pages', id, path })
    }
    node.children?.forEach(walk)
  }
  walk((value as { root?: LexicalNode } | null)?.root)
  return refs
}
