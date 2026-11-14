import type { Block } from 'payload'

import { linkField } from '../../fields/link'
import { collectArrayRefs, collectRefs, imageField, styleField } from '../shared'
import type { BlockDefinition } from '../types'
import { validateVideoURL } from './embed'

const VIDEO_FILE_TYPES = ['video/mp4', 'video/webm']

/**
 * Video: films kept on YouTube or Vimeo, played on the club's own page. Nothing is stored on
 * the club's account and nothing loads from the video site until a visitor presses play.
 * Two design styles: one large player, or a grid of videos.
 */
const config: Block = {
  slug: 'video',
  labels: { singular: 'Video', plural: 'Videos' },
  interfaceName: 'VideoBlock',
  fields: [
    styleField([
      {
        label: 'A · Featured: one large player, plays in place (uses the first video)',
        value: 'featured',
      },
      { label: 'B · Gallery: several videos, each opens in a pop-up window', value: 'grid' },
    ]),
    {
      name: 'featuredLayout',
      label: 'Layout (style A)',
      type: 'select',
      defaultValue: 'standard',
      options: [
        { label: 'Standard: heading above, video below', value: 'standard' },
        {
          label: 'Full width: heading, description and button centred above a full-width video',
          value: 'wide',
        },
        {
          label: 'Half and half: the video runs to the edge of the page, text beside it',
          value: 'split',
        },
      ],
      admin: { condition: (_d, sibling) => sibling?.style === 'featured' },
    },
    {
      name: 'videoSide',
      label: 'Video on the',
      type: 'radio',
      defaultValue: 'left',
      options: [
        { label: 'Left', value: 'left' },
        { label: 'Right', value: 'right' },
      ],
      admin: {
        condition: (_d, sibling) =>
          sibling?.style === 'featured' && sibling?.featuredLayout === 'split',
      },
    },
    {
      name: 'layout',
      label: 'Layout (style B)',
      type: 'select',
      defaultValue: 'auto',
      options: [
        { label: 'Automatic: a grid for up to 3 videos, a carousel for more', value: 'auto' },
        { label: 'Always a grid', value: 'grid' },
        { label: 'Always a carousel', value: 'carousel' },
      ],
      admin: {
        condition: (_d, sibling) => sibling?.style === 'grid',
        description:
          'On phones, two or more videos always swipe like a carousel (unless "Always a grid").',
      },
    },
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'intro',
      label: 'Description (style A, optional)',
      type: 'textarea',
      maxLength: 240,
      admin: { condition: (_d, sibling) => sibling?.style === 'featured' },
    },
    {
      ...linkField({
        name: 'button',
        label: 'Button (style A, optional)',
        required: false,
      }),
      admin: { condition: (_d, sibling) => sibling?.style === 'featured' },
    },
    {
      name: 'videos',
      label: 'Videos',
      type: 'array',
      minRows: 1,
      maxRows: 24,
      labels: { singular: 'Video', plural: 'Videos' },
      admin: {
        initCollapsed: true,
        description:
          'Either upload the film to YouTube or Vimeo and paste its address, or choose a video file from Photos and videos to play it in your club’s own player. You choose the picture shown before it plays.',
      },
      fields: [
        {
          name: 'file',
          label: 'Video file (plays in your club’s own player)',
          type: 'upload',
          relationTo: 'media',
          filterOptions: { mimeType: { in: VIDEO_FILE_TYPES } },
          admin: {
            description:
              'Optional. Upload an MP4 (or WebM) to Photos and videos first, then choose it here. It plays in a player in your club’s colours, with no YouTube or Vimeo branding and nothing loaded from another site. Keep it under 50MB: compress it first if it is bigger. If you choose a file, you can leave the address below empty.',
          },
        },
        {
          name: 'url',
          label: 'Or a YouTube or Vimeo address',
          type: 'text',
          maxLength: 300,
          validate: (value: unknown, { siblingData }: { siblingData?: { file?: unknown } }) =>
            siblingData?.file ? true : validateVideoURL(value),
        },
        imageField('poster', 'Picture shown before it plays', true, {
          admin: {
            description:
              'Landscape, at least 1600 pixels wide. Choose your own: YouTube’s automatic picture is often a blurry frame.',
          },
        }),
        {
          type: 'row',
          fields: [
            {
              name: 'title',
              label: 'Title',
              type: 'text',
              required: true,
              maxLength: 60,
              admin: { description: 'e.g. "Hole 1". Read out to screen-reader users.' },
            },
            { name: 'caption', label: 'Caption (optional)', type: 'text', maxLength: 100 },
          ],
        },
      ],
    },
  ],
}

export const video: BlockDefinition = {
  config,
  refs: (block, path) => [
    ...collectRefs(block, path, { links: ['button'] }),
    ...collectArrayRefs(block, path, 'videos', { images: ['poster', 'file'] }),
  ],
}
