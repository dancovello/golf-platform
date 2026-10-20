import type { Block } from 'payload'

import { collectArrayRefs, imageField, styleField } from '../shared'
import type { BlockDefinition } from '../types'

/** Gallery (docs/design/11). One block, three design styles; every photo opens the viewer. */
const config: Block = {
  slug: 'gallery',
  labels: { singular: 'Gallery', plural: 'Galleries' },
  interfaceName: 'GalleryBlock',
  fields: [
    styleField([
      { label: 'A · Masonry: photos at their own shape, with album filters', value: 'masonry' },
      { label: 'B · Grid: square photos, 12 at a time with "Load more"', value: 'grid' },
      { label: 'C · Viewer: one large photo at a time, with thumbnails', value: 'viewer' },
    ]),
    {
      name: 'eyebrow',
      label: 'Small line above the heading (optional)',
      type: 'text',
      maxLength: 40,
    },
    { name: 'heading', label: 'Heading', type: 'text', required: true, maxLength: 60 },
    {
      name: 'images',
      label: 'Photos',
      type: 'array',
      minRows: 1,
      maxRows: 60,
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: { initCollapsed: true },
      fields: [
        imageField('image', 'Photo'),
        {
          type: 'row',
          fields: [
            { name: 'caption', label: 'Caption (optional)', type: 'text', maxLength: 100 },
            {
              name: 'album',
              label: 'Album (style A, optional)',
              type: 'text',
              maxLength: 24,
              admin: {
                description: 'e.g. "The course". Photos with the same album are filtered together.',
              },
            },
          ],
        },
      ],
    },
  ],
}

export const gallery: BlockDefinition = {
  config,
  refs: (block, path) => collectArrayRefs(block, path, 'images', { images: ['image'] }),
}
