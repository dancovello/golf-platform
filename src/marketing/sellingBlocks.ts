import type { Block } from 'payload'

import { SHOWCASE_FEATURES } from './builderBlocks'
import { maxWords } from './fields'

/**
 * The v2 "selling" blocks (Figma "marketing site v2", 2 Nov 2026: Assurance Item 351:1811,
 * Compare Row 351:1818, Step Card 351:1829, Objection Card 351:1833, Role Tabs 351:2029). Every
 * line an editor types here is a claim: each one needs a row in docs/marketing-site/claims-register.md.
 */

// A row of four short, true facts under the hero (Marketing/Assurance Item).
const assurance: Block = {
  slug: 'mkAssurance',
  dbName: 'mk_assurance',
  interfaceName: 'MarketingAssuranceBlock',
  labels: { singular: 'Assurance strip', plural: 'Assurance strips' },
  fields: [
    {
      name: 'items',
      label: 'Facts',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 4,
      admin: { description: 'Short, true facts about the offer. Four sit in one row.' },
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 30 },
        {
          name: 'body',
          label: 'Text',
          type: 'textarea',
          required: true,
          maxLength: 120,
          validate: maxWords(20, true),
          admin: { rows: 2 },
        },
      ],
    },
  ],
}

// The old way against ours, row by row (Marketing/Compare Row under a two-column label row).
const compareRows: Block = {
  slug: 'mkCompareRows',
  dbName: 'mk_compare_rows',
  interfaceName: 'MarketingCompareRowsBlock',
  labels: { singular: 'Old way vs our way', plural: 'Old way vs our way' },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'oldLabel',
          label: 'Left label',
          type: 'text',
          required: true,
          defaultValue: 'How it usually goes',
          maxLength: 40,
        },
        {
          name: 'ourLabel',
          label: 'Right label',
          type: 'text',
          required: true,
          defaultValue: 'With us',
          maxLength: 40,
        },
      ],
    },
    {
      name: 'rows',
      label: 'Rows',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 5,
      admin: {
        description:
          'Never mock a club or whoever built its site: the way websites are usually run is the problem.',
      },
      fields: [
        {
          name: 'oldWay',
          label: 'The old way',
          type: 'textarea',
          required: true,
          maxLength: 140,
          validate: maxWords(22, true),
          admin: { rows: 2 },
        },
        {
          name: 'ourWay',
          label: 'Our way',
          type: 'textarea',
          required: true,
          maxLength: 140,
          validate: maxWords(22, true),
          admin: { rows: 2 },
        },
      ],
    },
  ],
}

// Numbered steps in a row (Marketing/Step Card). No durations or dates in any step.
const steps: Block = {
  slug: 'mkSteps',
  dbName: 'mk_steps',
  interfaceName: 'MarketingStepsBlock',
  labels: { singular: 'Step cards', plural: 'Step cards' },
  fields: [
    {
      name: 'steps',
      label: 'Steps',
      type: 'array',
      required: true,
      minRows: 3,
      maxRows: 4,
      admin: { description: 'Numbered automatically. No durations or dates.' },
      fields: [
        { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 40 },
        {
          name: 'body',
          label: 'Text',
          type: 'textarea',
          required: true,
          maxLength: 140,
          validate: maxWords(22, true),
          admin: { rows: 2 },
        },
      ],
    },
  ],
}

// A committee's objection, answered in the first sentence (Marketing/Objection Card).
const objections: Block = {
  slug: 'mkObjections',
  dbName: 'mk_objections',
  interfaceName: 'MarketingObjectionsBlock',
  labels: { singular: 'Committee questions', plural: 'Committee questions' },
  fields: [
    {
      name: 'items',
      label: 'Questions',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 4,
      admin: {
        description: 'Two or four work best: they sit two to a row. Answers lead with yes or no.',
      },
      fields: [
        { name: 'topic', label: 'Topic (one word)', type: 'text', required: true, maxLength: 24 },
        { name: 'question', label: 'Question', type: 'text', required: true, maxLength: 80 },
        {
          name: 'answer',
          label: 'Answer',
          type: 'textarea',
          required: true,
          maxLength: 220,
          validate: maxWords(35, true),
          admin: { rows: 3 },
        },
      ],
    },
  ],
}

// Benefits by role (Marketing/Role Tabs): tabs switch the panel; each panel is an outcome
// headline, three points and one picture of the club site's feature.
const roleTabs: Block = {
  slug: 'mkRoleTabs',
  dbName: 'mk_roles',
  interfaceName: 'MarketingRoleTabsBlock',
  labels: { singular: 'Role tabs', plural: 'Role tabs' },
  fields: [
    {
      name: 'roles',
      label: 'Roles',
      type: 'array',
      required: true,
      minRows: 2,
      maxRows: 4,
      fields: [
        { name: 'tab', label: 'Tab label', type: 'text', required: true, maxLength: 24 },
        { name: 'eyebrow', label: 'Eyebrow', type: 'text', required: true, maxLength: 40 },
        {
          name: 'headline',
          label: 'Headline',
          type: 'text',
          required: true,
          maxLength: 70,
          validate: maxWords(10, true),
        },
        {
          name: 'points',
          label: 'Points',
          type: 'array',
          required: true,
          minRows: 3,
          maxRows: 3,
          fields: [{ name: 'text', label: 'Point', type: 'text', required: true, maxLength: 120 }],
        },
        {
          name: 'visual',
          label: 'Picture',
          type: 'select',
          required: true,
          defaultValue: 'courseStatus',
          options: SHOWCASE_FEATURES.map((f) => ({ ...f })),
          admin: { description: 'Shows only what the club site really does today.' },
        },
      ],
    },
  ],
}

export const sellingBlocks: Block[] = [assurance, compareRows, steps, objections, roleTabs]
