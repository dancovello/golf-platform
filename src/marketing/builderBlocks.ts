import type { Block } from 'payload'

import { button, maxWords } from './fields'

/**
 * Website builder page blocks (Figma "Website builder — Desktop" 183:3008). The live demos draw
 * the real club blocks for the demo clubs; editors choose which demo and write the details
 * under it. The product film (296:9603) is left out until there is a film (open question Q8).
 */

// The intro (183:3044): the page's centred heading, two buttons and Marketing/Block Flipper
// (183:2796), which flips the Hero block's three styles at desktop, tablet and phone widths.
const builderHero: Block = {
  slug: 'mkBuilderHero',
  dbName: 'mk_builder_hero',
  interfaceName: 'MarketingBuilderHeroBlock',
  labels: { singular: 'Website builder intro', plural: 'Website builder intros' },
  fields: [
    { name: 'eyebrow', label: 'Eyebrow', type: 'text', maxLength: 40 },
    {
      name: 'title',
      label: 'Title',
      type: 'textarea',
      required: true,
      maxLength: 80,
      validate: maxWords(8, true),
      admin: {
        description: 'The page’s main heading. Under eight words. Line breaks are kept.',
        rows: 2,
      },
    },
    {
      name: 'subhead',
      label: 'Body',
      type: 'textarea',
      maxLength: 240,
      validate: maxWords(30),
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

// A live demo under a Section Header, with three short details below it: Token Dial (183:3109),
// course guide (183:3186) or course status (290:9549).
const liveDemo: Block = {
  slug: 'mkLiveDemo',
  dbName: 'mk_live_demo',
  interfaceName: 'MarketingLiveDemoBlock',
  labels: { singular: 'Live demo', plural: 'Live demos' },
  fields: [
    {
      name: 'demo',
      label: 'Demo',
      type: 'select',
      required: true,
      defaultValue: 'tokenDial',
      options: [
        { label: 'Club colours (Token Dial)', value: 'tokenDial' },
        { label: 'Course guide', value: 'courseGuide' },
        { label: 'Course status and news', value: 'courseStatus' },
      ],
    },
    {
      name: 'details',
      label: 'Details under it',
      type: 'array',
      maxRows: 3,
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 40 },
        {
          name: 'body',
          label: 'Text',
          type: 'textarea',
          required: true,
          maxLength: 160,
          validate: maxWords(25, true),
        },
      ],
    },
  ],
}

export const builderBlocks: Block[] = [builderHero, liveDemo]
