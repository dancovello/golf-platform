import type { Block } from 'payload'

import { maxWords } from './fields'

/**
 * Blocks for the information pages (plan phase 6.3): the Accessibility statement's "Last
 * reviewed" line (Figma 212:8199) and the Changelog's empty state with Roadmap Cards (187:6499,
 * Marketing/Roadmap Card 264:8753).
 */

// Accessibility statement "Meta" (212:8199): "Last reviewed 14 October 2026 · 4 minute read".
// The read time is worked out from the page's text, so it never goes stale.
const reviewed: Block = {
  slug: 'mkReviewed',
  dbName: 'mk_reviewed',
  interfaceName: 'MarketingReviewedBlock',
  labels: { singular: 'Last reviewed date', plural: 'Last reviewed dates' },
  fields: [
    {
      name: 'label',
      label: 'Wording',
      type: 'radio',
      required: true,
      defaultValue: 'reviewed',
      options: [
        { label: 'Last reviewed (statements)', value: 'reviewed' },
        { label: 'Last updated (policies and terms)', value: 'updated' },
      ],
      admin: { layout: 'horizontal' },
    },
    {
      name: 'date',
      label: 'Date',
      type: 'date',
      required: true,
      admin: {
        date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
        description:
          'Change this whenever you check or change the page. The read time is added for you.',
      },
    },
  ],
}

// Changelog (187:6499): the empty state, then Roadmap Cards. Marketing/Roadmap Card: "Title,
// one line, Availability Badge… Replaces Changelog entries before launch."
const roadmap: Block = {
  slug: 'mkRoadmap',
  dbName: 'mk_roadmap',
  interfaceName: 'MarketingRoadmapBlock',
  labels: { singular: 'Roadmap', plural: 'Roadmaps' },
  fields: [
    {
      name: 'emptyTitle',
      label: 'Empty state title',
      type: 'text',
      required: true,
      maxLength: 80,
      validate: maxWords(10, true),
    },
    {
      name: 'emptyBody',
      label: 'Empty state text',
      type: 'textarea',
      maxLength: 240,
      validate: maxWords(30),
    },
    {
      name: 'cards',
      label: 'Being built',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 6,
      admin: { description: 'In rows of three. Only things being built now.' },
      fields: [
        {
          name: 'title',
          label: 'Title',
          type: 'text',
          required: true,
          maxLength: 60,
          validate: maxWords(8, true),
        },
        {
          name: 'body',
          label: 'One line',
          type: 'textarea',
          required: true,
          maxLength: 160,
          validate: maxWords(20, true),
        },
      ],
    },
  ],
}

export const infoBlocks: Block[] = [reviewed, roadmap]
