import type { Block } from 'payload'

import { button, marketingHref, maxWords, noTypedPrices, TOKEN_HELP } from './fields'
import { bookingBlocks } from './bookingBlocks'
import { bookingsBlocks } from './bookingsBlocks'
import { builderBlocks } from './builderBlocks'
import { FEATURE_ICONS } from './icons'
import { homeBlocks } from './homeBlocks'
import { pricingBlocks } from './pricingBlocks'
import { switchingBlocks } from './switchingBlocks'
import { marketingRichText } from './richText'

/** Short body copy: under thirty words, and prices only as {price}. */
const shortBody = (value: unknown) => {
  const prices = noTypedPrices(value)
  return prices === true ? maxWords(30)(value, {} as never) : prices
}

/**
 * The marketing site's CMS blocks, built from the Figma section "Marketing · Blocks (CMS)"
 * (210:7925) and its rules (212:8319): editors fill in fields; the blocks decide how it looks.
 * Each block's fields follow its Figma component description.
 */

// Block/Section Header (210:7950): "The only way to put a heading on a page… CMS fields:
// eyebrow (optional), title (plain text, line breaks allowed), body (optional, ≤30 words),
// alignment." The size comes from where it sits: Page for the first one, Section elsewhere.
const sectionHeader: Block = {
  slug: 'mkSectionHeader',
  dbName: 'mk_header',
  interfaceName: 'MarketingSectionHeaderBlock',
  labels: { singular: 'Section header', plural: 'Section headers' },
  fields: [
    {
      name: 'eyebrow',
      label: 'Eyebrow (1–3 words, optional)',
      type: 'text',
      maxLength: 30,
      validate: maxWords(3),
    },
    {
      name: 'title',
      label: 'Title',
      type: 'textarea',
      required: true,
      maxLength: 80,
      validate: maxWords(8, true),
      admin: { description: 'Under eight words. Line breaks are kept.', rows: 2 },
    },
    {
      name: 'subhead',
      label: 'Body (optional)',
      type: 'textarea',
      maxLength: 240,
      validate: shortBody,
      admin: {
        description: `One or two sentences that back the title up. Under thirty words. ${TOKEN_HELP}`,
      },
    },
    {
      name: 'align',
      label: 'Alignment',
      type: 'radio',
      required: true,
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Centre', value: 'center' },
      ],
      admin: { layout: 'horizontal' },
    },
  ],
}

// Block/CTA Band (210:7951): "One per page, always last before the footer. Primary action is
// always Book a demo or the page's main ask; buttons are exposed so labels are editable."
const ctaBand: Block = {
  slug: 'mkCtaBand',
  dbName: 'mk_cta',
  interfaceName: 'MarketingCtaBandBlock',
  labels: { singular: 'Call to action band', plural: 'Call to action bands' },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      maxLength: 80,
      validate: maxWords(8, true),
    },
    {
      name: 'subhead',
      label: 'Body (optional)',
      type: 'textarea',
      maxLength: 240,
      validate: shortBody,
      admin: { description: TOKEN_HELP },
    },
    button('primary', 'Main button', { label: 'Book a demo', href: '/book-a-demo' }),
    button(
      'secondary',
      'Second button (optional)',
      { label: 'Get your free homepage', href: '/switching' },
      'Leave the text empty to show only the main button.',
    ),
  ],
}

// Block/Media (210:8045): "Ratios are fixed presets… always cover-cropped with an editor-set
// focal point. Plain for photography; Window for product screenshots. Alt text required in the
// CMS; caption optional. Width comes from the layout, never set by editors."
const media: Block = {
  slug: 'mkMedia',
  dbName: 'mk_media',
  interfaceName: 'MarketingMediaBlock',
  labels: { singular: 'Photo', plural: 'Photos' },
  fields: [
    {
      name: 'image',
      label: 'Photo',
      type: 'upload',
      relationTo: 'marketing-media',
      required: true,
      admin: { description: 'Cropped around the photo’s focal point, set in the library.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'ratio',
          label: 'Shape',
          type: 'select',
          required: true,
          defaultValue: '16:9',
          options: [
            { label: 'Wide (16:9)', value: '16:9' },
            { label: 'Standard (3:2)', value: '3:2' },
            { label: 'Square (1:1)', value: '1:1' },
            { label: 'Portrait (4:5)', value: '4:5' },
          ],
        },
        {
          name: 'frame',
          label: 'Frame',
          type: 'select',
          required: true,
          defaultValue: 'plain',
          options: [
            { label: 'Plain, for photography', value: 'plain' },
            { label: 'Window, for product screenshots', value: 'window' },
          ],
        },
      ],
    },
    {
      name: 'windowAddress',
      label: 'Address in the window bar',
      type: 'text',
      maxLength: 60,
      admin: {
        condition: (_d: unknown, sibling: { frame?: string }) => sibling?.frame === 'window',
        description: 'The web address shown above the screenshot, e.g. a demo club’s.',
      },
    },
    { name: 'caption', label: 'Caption (optional, one line)', type: 'text', maxLength: 120 },
  ],
}

// Block/Rich Text (210:8046): H2, H3, paragraphs, lists, links and quotes. Nothing else.
const richText: Block = {
  slug: 'mkRichText',
  dbName: 'mk_text',
  interfaceName: 'MarketingRichTextBlock',
  labels: { singular: 'Text', plural: 'Text' },
  fields: [
    { name: 'content', label: 'Text', type: 'richText', required: true, editor: marketingRichText },
  ],
}

// Block/Feature Card (217:32022): "Row (default for feature lists): no box, hairline above, icon
// beside text, in a two-column list. Card: only when the card links somewhere or sits beside
// media." Figma's pages also use Cards for the Trust pillars and the Website builder features,
// so the style is a field. Icons from the shared set only.
const featureCards: Block = {
  slug: 'mkFeatureCards',
  dbName: 'mk_cards',
  interfaceName: 'MarketingFeatureCardsBlock',
  labels: { singular: 'Features', plural: 'Features' },
  fields: [
    {
      name: 'style',
      label: 'Style',
      type: 'radio',
      required: true,
      defaultValue: 'rows',
      options: [
        { label: 'Rows: no box, two columns (default for feature lists)', value: 'rows' },
        { label: 'Cards: boxed, in equal rows', value: 'cards' },
      ],
    },
    {
      name: 'cards',
      label: 'Features',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 8,
      admin: {
        description:
          'Cards: 2 in a row, 3 or 6 in rows of three, 4 in rows of two, 8 in rows of four.',
      },
      validate: (value: unknown) => {
        const count = Array.isArray(value) ? value.length : 0
        return [2, 3, 4, 6, 8].includes(count)
          ? true
          : 'Use 2, 3, 4, 6 or 8 features, so every row is full.'
      },
      fields: [
        {
          name: 'icon',
          label: 'Icon',
          type: 'select',
          required: true,
          defaultValue: 'check',
          options: FEATURE_ICONS.map((i) => ({ label: i.label, value: i.value })),
        },
        {
          name: 'title',
          label: 'Title (the benefit)',
          type: 'text',
          required: true,
          maxLength: 60,
          validate: maxWords(8, true),
        },
        {
          name: 'body',
          label: 'One line of how',
          type: 'textarea',
          required: true,
          maxLength: 200,
          validate: maxWords(30, true),
        },
        {
          name: 'availability',
          label: 'Available',
          type: 'select',
          required: true,
          defaultValue: 'live',
          options: [
            { label: 'Live now', value: 'live' },
            { label: 'Coming next (shows the badge)', value: 'coming-next' },
          ],
          admin: { description: 'Anything not working in production today is “Coming next”.' },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'linkLabel',
              label: 'Link text (optional)',
              type: 'text',
              maxLength: 30,
              validate: maxWords(4),
            },
            {
              name: 'linkHref',
              label: 'Link goes to',
              type: 'text',
              maxLength: 300,
              validate: marketingHref,
            },
          ],
        },
      ],
    },
  ],
}

export const marketingBlocks: Block[] = [
  sectionHeader,
  richText,
  media,
  featureCards,
  ctaBand,
  ...homeBlocks,
  ...pricingBlocks,
  ...switchingBlocks,
  ...bookingBlocks,
  ...builderBlocks,
  ...bookingsBlocks,
]
