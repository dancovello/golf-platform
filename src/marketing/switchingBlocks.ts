import type { Block } from 'payload'

import { maxWords } from './fields'

/**
 * Switching page blocks (Figma "Switching — Desktop" 186:6494, "Switching — Mobile" 300:9636).
 * "Your content comes with you" reuses the home page's block (mkContentMoves), and the
 * questions reuse mkFaq.
 */

// The intro (Hero row 290:38583): the page's Section Header, three tick points, and the
// Marketing/Homepage Request Form (265:8785): "Manual service, fully true: club name, current
// website, email. Success state shows a computed date two working days out."
const requestHero: Block = {
  slug: 'mkRequestHero',
  dbName: 'mk_request',
  interfaceName: 'MarketingRequestHeroBlock',
  labels: { singular: 'Demo request', plural: 'Demo requests' },
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
    {
      name: 'points',
      label: 'Tick points',
      type: 'array',
      maxRows: 4,
      fields: [{ name: 'text', label: 'Point', type: 'text', required: true, maxLength: 60 }],
    },
    {
      name: 'form',
      label: 'The form',
      type: 'group',
      admin: {
        description:
          'The fields are fixed: club name, current website and email. The date in the reply is two UK working days away, worked out when they send it.',
      },
      fields: [
        {
          name: 'title',
          label: 'Form title',
          type: 'text',
          required: true,
          maxLength: 40,
          defaultValue: 'Your club',
        },
        { name: 'intro', label: 'Line under the title (optional)', type: 'text', maxLength: 140 },
        {
          name: 'button',
          label: 'Button',
          type: 'text',
          required: true,
          maxLength: 30,
          defaultValue: 'Book my demo',
        },
        {
          name: 'footnote',
          label: 'Small print',
          type: 'text',
          maxLength: 140,
          defaultValue: 'We build it from your current site. Nothing on your live site changes.',
        },
        {
          name: 'sentTitle',
          label: 'Title once sent',
          type: 'text',
          required: true,
          maxLength: 40,
          defaultValue: 'Thanks.',
        },
      ],
    },
  ],
}

// The example under the intro (270:9005 + the demo club frame 300:9686). Replaces the
// deprecated URL Reskin (hand-off §6): the real Hero block in a demo club's style.
const demoExample: Block = {
  slug: 'mkDemoExample',
  dbName: 'mk_demo_ex',
  interfaceName: 'MarketingDemoExampleBlock',
  labels: { singular: 'Demo club example', plural: 'Demo club examples' },
  fields: [
    {
      name: 'eyebrow',
      label: 'Eyebrow',
      type: 'text',
      maxLength: 40,
      defaultValue: 'Example',
    },
    {
      name: 'caption',
      label: 'Caption',
      type: 'text',
      required: true,
      maxLength: 140,
      defaultValue: 'A demo club rebuilt on our blocks. Same domain, same club, new site.',
    },
  ],
}

// "The switch" weeks (186:6615): a card per week under a Section Header.
const migration: Block = {
  slug: 'mkMigration',
  dbName: 'mk_weeks',
  interfaceName: 'MarketingMigrationBlock',
  labels: { singular: 'Week-by-week plan', plural: 'Week-by-week plans' },
  fields: [
    {
      name: 'weeks',
      label: 'Weeks',
      type: 'array',
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', label: 'Label', type: 'text', required: true, maxLength: 20 },
            { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 24 },
          ],
        },
        {
          name: 'body',
          label: 'What happens',
          type: 'textarea',
          required: true,
          maxLength: 140,
          validate: maxWords(20, true),
        },
      ],
    },
  ],
}

export const switchingBlocks: Block[] = [requestHero, demoExample, migration]
