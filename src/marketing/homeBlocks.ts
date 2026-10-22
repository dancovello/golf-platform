import type { Block, Field } from 'payload'

import { maxWords, marketingHref } from './fields'

/**
 * The home page's own sections (Figma "Home — Desktop" 176:2178 and "Home — Mobile" 273:8954).
 * Bespoke marketing blocks, as the hand-off says (§5): each has the fields its Figma section
 * needs. A Section Header block comes before the ones that have a heading.
 */

const button = (name: string, label: string, defaults: { label: string; href: string }): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'label',
          label: 'Button text',
          type: 'text',
          maxLength: 30,
          defaultValue: defaults.label,
          validate: maxWords(4),
        },
        {
          name: 'href',
          label: 'Goes to',
          type: 'text',
          maxLength: 300,
          defaultValue: defaults.href,
          validate: marketingHref,
        },
      ],
    },
  ],
})

/** No numbers typed into the copy: prices come from the settings ({price}). */
const noTypedPrices = (value: unknown) =>
  typeof value === 'string' && /£\s?\d/.test(value)
    ? 'Use {price} for the monthly price, so it always matches the settings.'
    : true

// Hero (176:2213): headline, subhead, two buttons, a proof line, the Tenant Morph and its note.
const homeHero: Block = {
  slug: 'mkHomeHero',
  dbName: 'mk_home_hero',
  interfaceName: 'MarketingHomeHeroBlock',
  labels: { singular: 'Home hero', plural: 'Home heroes' },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'textarea',
      required: true,
      maxLength: 80,
      validate: maxWords(8, true),
      admin: { rows: 2, description: 'The page’s one main heading. Line breaks are kept.' },
    },
    {
      name: 'subhead',
      label: 'Body',
      type: 'textarea',
      maxLength: 240,
      validate: maxWords(30),
    },
    button('primary', 'Main button', { label: 'Book a demo', href: '/book-a-demo' }),
    button('secondary', 'Second button', { label: 'Get your free homepage', href: '/switching' }),
    {
      name: 'proofLine',
      label: 'Proof line (small, under the buttons)',
      type: 'text',
      maxLength: 160,
      validate: noTypedPrices,
      admin: {
        description:
          'Separate items with “ · ”. Use {price} for the monthly price from Settings, e.g. “{price} a month”.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'note',
          label: 'Note under the demo',
          type: 'text',
          maxLength: 80,
        },
        {
          name: 'noteStrong',
          label: 'Note, emphasised part',
          type: 'text',
          maxLength: 80,
        },
      ],
    },
  ],
}

// Proof Stats row (First impressions, 180:2674): researched numbers, each with its source.
const proofStats: Block = {
  slug: 'mkProofStats',
  dbName: 'mk_stats',
  interfaceName: 'MarketingProofStatsBlock',
  labels: { singular: 'Proof stats', plural: 'Proof stats' },
  fields: [
    {
      name: 'stats',
      label: 'Stats',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 3,
      admin: {
        description:
          'Only numbers from the claims register, with their source and date (docs/marketing-site/claims-register.md).',
      },
      fields: [
        { name: 'number', label: 'Number', type: 'text', required: true, maxLength: 12 },
        {
          name: 'claim',
          label: 'What it means (one line)',
          type: 'textarea',
          required: true,
          maxLength: 160,
          validate: maxWords(25, true),
        },
        {
          name: 'source',
          label: 'Source and date',
          type: 'text',
          required: true,
          maxLength: 160,
        },
        {
          name: 'methodHref',
          label: '“See the method” link (optional)',
          type: 'text',
          maxLength: 300,
          validate: marketingHref,
        },
      ],
    },
  ],
}

const side = (name: string, label: string): Field => ({
  name,
  label,
  type: 'group',
  fields: [
    { name: 'label', label: 'Label', type: 'text', required: true, maxLength: 40 },
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 60 },
    {
      name: 'points',
      label: 'Points',
      type: 'array',
      minRows: 2,
      maxRows: 5,
      fields: [{ name: 'text', label: 'Point', type: 'text', required: true, maxLength: 140 }],
    },
  ],
})

// Great vs poor (First impressions, 180:2674): a dawn panel and a plain panel, with footnotes.
const compare: Block = {
  slug: 'mkCompare',
  dbName: 'mk_compare',
  interfaceName: 'MarketingCompareBlock',
  labels: { singular: 'Good vs poor', plural: 'Good vs poor' },
  fields: [
    side('good', 'When it does the club justice'),
    side('poor', 'When it lets the club down'),
    {
      name: 'footnotes',
      label: 'Footnotes (sources for ¹ ²)',
      type: 'textarea',
      maxLength: 400,
    },
  ],
}

// Edit Live Split (180:2587): the editor beside the live hero. Visitors can type; nothing saves.
const editLive: Block = {
  slug: 'mkEditLive',
  dbName: 'mk_edit_live',
  interfaceName: 'MarketingEditLiveBlock',
  labels: { singular: 'Edit and live', plural: 'Edit and live' },
  fields: [
    {
      name: 'headline',
      label: 'Headline it starts with',
      type: 'text',
      required: true,
      maxLength: 60,
      defaultValue: 'Spring open week starts Saturday',
    },
    {
      name: 'toggleLabel',
      label: 'Switch label',
      type: 'text',
      required: true,
      maxLength: 60,
      defaultValue: 'Show visitor tee times button',
    },
  ],
}

// A week at the club (178:2451): four Timeline Moments, each with a live block preview.
const week: Block = {
  slug: 'mkWeek',
  dbName: 'mk_week',
  interfaceName: 'MarketingWeekBlock',
  labels: { singular: 'A week at the club', plural: 'A week at the club' },
  fields: [
    {
      name: 'moments',
      label: 'Moments',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'time', label: 'When', type: 'text', required: true, maxLength: 16 },
            {
              name: 'preview',
              label: 'Live block shown',
              type: 'select',
              required: true,
              options: [
                { label: 'Course status', value: 'courseStatus' },
                { label: 'News post', value: 'news' },
                { label: 'Green fees', value: 'greenFees' },
                { label: 'Hole guide', value: 'holeGuide' },
              ],
              admin: { description: 'Live blocks only (hand-off §6).' },
            },
          ],
        },
        { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 60 },
        { name: 'body', label: 'Body', type: 'textarea', required: true, maxLength: 160 },
      ],
    },
  ],
}

// Your content comes with you (289:9518): what's found, what it becomes, three steps.
const contentMoves: Block = {
  slug: 'mkContentMoves',
  dbName: 'mk_moves',
  interfaceName: 'MarketingContentMovesBlock',
  labels: { singular: 'Your content comes with you', plural: 'Your content comes with you' },
  fields: [
    {
      name: 'found',
      label: 'Found on the current site (an example, labelled as a demo club)',
      type: 'array',
      maxRows: 6,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'What', type: 'text', required: true, maxLength: 40 },
            { name: 'count', label: 'How many', type: 'text', required: true, maxLength: 16 },
          ],
        },
      ],
    },
    {
      name: 'built',
      label: 'Built into blocks',
      type: 'array',
      maxRows: 6,
      fields: [{ name: 'label', label: 'Block', type: 'text', required: true, maxLength: 40 }],
    },
    {
      name: 'chip',
      label: 'Label between them',
      type: 'text',
      maxLength: 40,
      defaultValue: 'Copied across with AI',
    },
    {
      name: 'steps',
      label: 'Steps',
      type: 'array',
      maxRows: 3,
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 40 },
        { name: 'body', label: 'Body', type: 'textarea', required: true, maxLength: 160 },
      ],
    },
  ],
}

// Who's behind it (289:9658): the full-width Founder Card, from the settings.
const founder: Block = {
  slug: 'mkFounder',
  dbName: 'mk_founder',
  interfaceName: 'MarketingFounderBlock',
  labels: { singular: 'Founder card', plural: 'Founder cards' },
  fields: [
    {
      name: 'note',
      type: 'ui',
      admin: {
        components: { Field: '/marketing/admin/FounderNote#FounderNote' },
      },
    },
  ],
}

export const homeBlocks: Block[] = [
  homeHero,
  proofStats,
  compare,
  editLive,
  week,
  contentMoves,
  founder,
]
