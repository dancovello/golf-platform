import type { Block } from 'payload'

import { collectRefs, imageField, styleField } from '../shared'
import type { BlockDefinition } from '../types'

/** Course record (Figma page "Course Record"). One block, three design styles. */
const config: Block = {
  slug: 'courseRecord',
  labels: { singular: 'Course record', plural: 'Course record' },
  interfaceName: 'CourseRecordBlock',
  fields: [
    styleField([
      {
        label: 'A · Honours board: a dark band, like a line on the clubhouse board',
        value: 'board',
      },
      { label: 'B · Signed card: the score card that was handed in', value: 'card' },
      { label: 'C · Feature split: a big photo beside the score', value: 'split' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above (optional)',
      type: 'text',
      maxLength: 40,
      admin: { description: 'Shows "Course record" if left empty.' },
    },
    {
      name: 'holderName',
      label: "Record holder's name",
      type: 'text',
      required: true,
      maxLength: 60,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'score',
          label: 'Score (gross)',
          type: 'number',
          required: true,
          min: 1,
          max: 200,
          admin: { step: 1, description: 'e.g. 63' },
        },
        {
          name: 'underPar',
          label: 'Strokes under par (optional)',
          type: 'number',
          min: 1,
          max: 100,
          admin: { step: 1, description: 'e.g. 8 shows "8 under par". Leave empty to hide.' },
        },
        {
          name: 'year',
          label: 'Year set',
          type: 'number',
          required: true,
          min: 1800,
          max: 2200,
          admin: { step: 1, description: 'e.g. 2019' },
        },
      ],
    },
    {
      name: 'courseDetail',
      label: 'Tees and par (optional)',
      type: 'text',
      maxLength: 40,
      admin: { description: 'e.g. White tees · Par 71' },
    },
    {
      name: 'description',
      label: 'A line about the round (optional)',
      type: 'textarea',
      maxLength: 160,
      admin: { description: 'Up to 160 characters.' },
    },
    imageField('photo', 'Photo of the record holder (optional)', false, {
      admin: {
        description:
          'Shown in all three styles. Without one, A drops the portrait, B narrows the card and C shows a brand-coloured panel.',
      },
    }),
  ],
}

export const courseRecord: BlockDefinition = {
  config,
  refs: (block, path) => collectRefs(block, path, { images: ['photo'] }),
}
