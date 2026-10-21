import type { Block } from 'payload'

import { maxWords } from './fields'

// Book a demo intro (Figma "Book a demo — Desktop" 187:7371): the page's heading, what to
// expect, the email line, and Marketing/Demo Booking beside them. Hand-off §6: "Never state how
// long the call lasts." The page has no CTA band (it is the call to action).
const demoIntro: Block = {
  slug: 'mkDemoIntro',
  dbName: 'mk_demo_intro',
  interfaceName: 'MarketingDemoIntroBlock',
  labels: { singular: 'Book a demo', plural: 'Book a demo' },
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
    { name: 'subhead', label: 'Body', type: 'textarea', maxLength: 240, validate: maxWords(30) },
    {
      name: 'expect',
      label: 'What to expect',
      type: 'array',
      maxRows: 5,
      admin: { description: 'Never say how long the call lasts (hand-off §6).' },
      fields: [{ name: 'text', label: 'Point', type: 'text', required: true, maxLength: 60 }],
    },
    {
      name: 'emailLead',
      label: 'Before the email address',
      type: 'text',
      maxLength: 30,
      defaultValue: 'Rather email?',
      admin: { description: 'The address itself comes from the company details.' },
    },
  ],
}

export const bookingBlocks: Block[] = [demoIntro]
