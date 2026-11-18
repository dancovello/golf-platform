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

/** Links to the club's own pages or a safe web address. */
const safeLinks = () =>
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
  })

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
    safeLinks(),
    UploadFeature({
      collections: {
        media: { fields: [{ name: 'caption', label: 'Caption', type: 'text', maxLength: 120 }] },
      },
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

/**
 * The privacy policy's "Additional information": paragraphs, bold/italic, lists and links only.
 * No headings, so the policy keeps one heading per section.
 */
export const privacyRichText = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    safeLinks(),
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

/**
 * Pasting from Word can leave a picture with nothing behind it (an "upload" with no photo
 * chosen). That blank placeholder is invisible and stopped the page being published with an
 * unhelpful message (QA-37). Editors upload photos with the photo button, so a picture with no
 * photo is simply dropped before the page is checked. Real photos are left alone.
 */
export const dropEmptyPictures = <T>(value: T): T => {
  const clean = (nodes: LexicalNode[] | undefined): LexicalNode[] | undefined =>
    nodes
      ?.filter((node) => !(node.type === 'upload' && !idOf(node.value)))
      .map((node) => (node.children ? { ...node, children: clean(node.children) } : node))
  const root = (value as { root?: LexicalNode } | null)?.root
  if (!root?.children) return value
  return { ...(value as object), root: { ...root, children: clean(root.children) } } as T
}
