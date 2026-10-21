import type { Block } from 'payload'

import { maxWords, noTypedPrices, TOKEN_HELP } from './fields'

/**
 * Pricing page blocks (Figma "Pricing — Desktop" 185:3821, "Pricing — Mobile" 274:9185).
 * The calculator's numbers all come from Settings; the copy may use {price}, {vat}, {term} and
 * {notice}.
 */

// Marketing/Pricing Calculator (185:3775): "Only live modules toggle and price. Coming-next
// modules render as a dimmed row with the badge and 'Price confirmed at launch'."
const pricing: Block = {
  slug: 'mkPricing',
  dbName: 'mk_pricing',
  interfaceName: 'MarketingPricingBlock',
  labels: { singular: 'Pricing calculator', plural: 'Pricing calculators' },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'text',
      required: true,
      maxLength: 40,
      defaultValue: 'Build your plan',
    },
    {
      name: 'terms',
      label: 'Terms line',
      type: 'text',
      maxLength: 80,
      validate: noTypedPrices,
      defaultValue: 'Billed monthly · {term}-month minimum, then rolling',
      admin: { description: TOKEN_HELP },
    },
    {
      name: 'coursesText',
      label: 'Courses: what you get',
      type: 'text',
      maxLength: 100,
      defaultValue: 'Each course gets its own guide, scorecard and hole-by-hole pages.',
    },
    {
      name: 'comingNext',
      label: 'Coming next (not priced)',
      type: 'array',
      maxRows: 5,
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 40 },
        { name: 'body', label: 'What it does', type: 'text', required: true, maxLength: 100 },
      ],
    },
    {
      name: 'included',
      label: 'Included',
      type: 'array',
      maxRows: 6,
      fields: [{ name: 'text', label: 'Item', type: 'text', required: true, maxLength: 60 }],
    },
    {
      name: 'footnote',
      label: 'Small print',
      type: 'textarea',
      maxLength: 200,
      validate: noTypedPrices,
      defaultValue:
        'Prices exclude VAT. No setup fee. {notice} days’ notice after the first {term} months.',
      admin: { description: TOKEN_HELP },
    },
  ],
}

// Committee questions (185:3944): a compact header beside the FAQ (two columns on desktop).
const faq: Block = {
  slug: 'mkFaq',
  dbName: 'mk_faq',
  interfaceName: 'MarketingFaqBlock',
  labels: { singular: 'Questions and answers', plural: 'Questions and answers' },
  fields: [
    {
      name: 'title',
      label: 'Title',
      type: 'textarea',
      required: true,
      maxLength: 60,
      validate: maxWords(8, true),
      admin: { rows: 2 },
    },
    { name: 'body', label: 'Body', type: 'textarea', maxLength: 200, validate: maxWords(30) },
    {
      name: 'items',
      label: 'Questions',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 12,
      admin: { description: `Answer yes or no first where you can. ${TOKEN_HELP}` },
      fields: [
        { name: 'question', label: 'Question', type: 'text', required: true, maxLength: 100 },
        {
          name: 'answer',
          label: 'Answer',
          type: 'textarea',
          required: true,
          maxLength: 400,
          validate: noTypedPrices,
        },
      ],
    },
  ],
}

export const pricingBlocks: Block[] = [pricing, faq]
