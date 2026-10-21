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
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { isSafeURL } from '../fields/link'

/**
 * The marketing site's text editor (Figma "CMS block rules"): H2, H3, paragraphs, lists, links
 * and quotes. No font, size or colour controls, and no photos (the Media block does those).
 * Links go to another marketing page or a safe web address.
 */
export const marketingRichText = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }),
    BoldFeature(),
    ItalicFeature(),
    UnorderedListFeature(),
    OrderedListFeature(),
    BlockquoteFeature(),
    LinkFeature({
      enabledCollections: ['marketing-pages'],
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
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
