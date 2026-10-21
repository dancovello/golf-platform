import type { Block } from 'payload'

import { maxWords } from './fields'
import { marketingRichText } from './richText'

/**
 * The marketing site's CMS blocks (Figma "Marketing · Blocks (CMS)", hand-off §5 and §8).
 * Editors never pick sizes, fonts or colours: a Section Header is page-sized when it comes
 * first on the page and section-sized elsewhere, and every page ends with the CTA Band
 * (except Book a demo). The bespoke sections (Tenant Morph, Pricing Calculator…) join as
 * blocks in later phases.
 */

const sectionHeader: Block = {
  slug: 'mkSectionHeader',
  dbName: 'mk_header',
  interfaceName: 'MarketingSectionHeaderBlock',
  labels: { singular: 'Section header', plural: 'Section headers' },
  fields: [
    {
      name: 'eyebrow',
      label: 'Small line above (1–3 words, optional)',
      type: 'text',
      maxLength: 30,
      validate: maxWords(3),
    },
    {
      name: 'title',
      label: 'Headline',
      type: 'text',
      required: true,
      maxLength: 80,
      validate: maxWords(8, true),
      admin: { description: 'Under 8 words: a claim about the club’s world.' },
    },
    {
      name: 'subhead',
      label: 'Subhead (optional)',
      type: 'textarea',
      maxLength: 240,
      validate: maxWords(30),
      admin: { description: 'One sentence, under 30 words.' },
    },
  ],
}

const ctaBand: Block = {
  slug: 'mkCtaBand',
  dbName: 'mk_cta',
  interfaceName: 'MarketingCtaBandBlock',
  labels: { singular: 'Call to action band', plural: 'Call to action bands' },
  fields: [
    {
      name: 'title',
      label: 'Headline',
      type: 'text',
      required: true,
      maxLength: 80,
      validate: maxWords(8, true),
    },
    {
      name: 'subhead',
      label: 'Subhead (optional)',
      type: 'textarea',
      maxLength: 240,
      validate: maxWords(30),
      admin: {
        description:
          'The buttons are always “Book a demo” and “Get your free homepage” (decided 21 Oct).',
      },
    },
  ],
}

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
            { label: 'Landscape (3:2)', value: '3:2' },
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
            { label: 'Plain, for photos', value: 'plain' },
            { label: 'Window, for product screens', value: 'window' },
          ],
        },
      ],
    },
    { name: 'caption', label: 'Caption (optional)', type: 'text', maxLength: 120 },
  ],
}

const richText: Block = {
  slug: 'mkRichText',
  dbName: 'mk_text',
  interfaceName: 'MarketingRichTextBlock',
  labels: { singular: 'Text', plural: 'Text' },
  fields: [
    { name: 'content', label: 'Text', type: 'richText', required: true, editor: marketingRichText },
  ],
}

const featureCards: Block = {
  slug: 'mkFeatureCards',
  dbName: 'mk_cards',
  interfaceName: 'MarketingFeatureCardsBlock',
  labels: { singular: 'Feature cards', plural: 'Feature cards' },
  fields: [
    {
      name: 'cards',
      label: 'Cards',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 8,
      admin: { description: 'Shown in equal rows of two, three or four.' },
      validate: (value: unknown) => {
        const count = Array.isArray(value) ? value.length : 0
        return [2, 3, 4, 6, 8].includes(count)
          ? true
          : 'Use 2, 3, 4, 6 or 8 cards, so every row is full.'
      },
      fields: [
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
      ],
    },
  ],
}

export const marketingBlocks: Block[] = [sectionHeader, richText, media, featureCards, ctaBand]
