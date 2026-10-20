import type { Block } from 'payload'

import { linkField, linksToPage } from '../../fields/link'
import { type BlockDefinition, type BlockRef, idOf } from '../types'

export const HERO_STYLES = ['heritage', 'resort', 'bookingLed'] as const
export type HeroStyle = (typeof HERO_STYLES)[number]

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const VIDEO_TYPES = ['video/mp4', 'video/webm']

/** Hero (docs/design/07-figma-hero-build-spec.md). One block, three design styles. */
const config: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  interfaceName: 'HeroBlock',
  fields: [
    {
      name: 'style',
      label: 'Design style',
      type: 'select',
      required: true,
      defaultValue: 'heritage',
      options: [
        { label: 'A · Heritage: full-width photo, headline bottom-left', value: 'heritage' },
        { label: 'B · Resort: centred headline on the brand colour, photo below', value: 'resort' },
        { label: 'C · Booking-led: full-width photo with the booking button', value: 'bookingLed' },
      ],
    },
    {
      name: 'mediaType',
      label: 'Background',
      type: 'radio',
      defaultValue: 'image',
      options: [
        { label: 'Photo', value: 'image' },
        { label: 'Video (silent, loops)', value: 'video' },
      ],
    },
    {
      name: 'image',
      label: 'Photo',
      type: 'upload',
      relationTo: 'media',
      required: true,
      filterOptions: { mimeType: { in: IMAGE_TYPES } },
      admin: {
        description:
          'Landscape, at least 2400 pixels wide. With a video, this is shown while it loads and to visitors who prefer less motion.',
      },
    },
    {
      name: 'video',
      label: 'Video',
      type: 'upload',
      relationTo: 'media',
      filterOptions: { mimeType: { in: VIDEO_TYPES } },
      admin: {
        condition: (_data, sibling) => sibling?.mediaType === 'video',
        description: 'MP4, 6–12 seconds, no sound needed (it plays muted).',
      },
      validate: (value: unknown, { siblingData }: { siblingData: { mediaType?: string } }) =>
        siblingData?.mediaType !== 'video' || value ? true : 'Choose a video.',
    },
    {
      name: 'eyebrow',
      label: 'Small line above the headline (optional)',
      type: 'text',
      maxLength: 40,
    },
    {
      name: 'headline',
      label: 'Headline',
      type: 'text',
      required: true,
      maxLength: 60,
      admin: { description: '5–8 words reads best. Two lines at most.' },
    },
    {
      name: 'caption',
      label: 'Photo caption (style B, optional)',
      type: 'text',
      maxLength: 80,
      admin: { condition: (_data, sibling) => sibling?.style === 'resort' },
    },
    {
      ...linkField({ name: 'primaryButton', label: 'Main button (optional)', required: false }),
      admin: {
        condition: (_data, sibling) => sibling?.style !== 'bookingLed',
        description: 'Leave the text empty for no button.',
      },
    },
    {
      ...linkField({ name: 'secondaryLink', label: 'Second link (optional)', required: false }),
      admin: { condition: (_data, sibling) => sibling?.style !== 'bookingLed' },
    },
  ],
}

const linkRef = (link: unknown, path: string): BlockRef[] => {
  const l = (link ?? {}) as { type?: string; page?: unknown }
  const id = linksToPage(l.type) ? idOf(l.page) : null
  return id ? [{ collection: 'pages', id, path: `${path}.page` }] : []
}

export const hero: BlockDefinition = {
  config,
  refs: (block, path) => {
    const refs: BlockRef[] = []
    for (const key of ['image', 'video'] as const) {
      const id = idOf(block[key])
      if (id) refs.push({ collection: 'media', id, path: `${path}.${key}` })
    }
    refs.push(...linkRef(block.primaryButton, `${path}.primaryButton`))
    refs.push(...linkRef(block.secondaryLink, `${path}.secondaryLink`))
    return refs
  },
}
