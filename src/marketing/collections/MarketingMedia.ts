import type { CollectionConfig } from 'payload'

import { cleanOriginal } from '../../media/cleanOriginal'

import { uploadFolder } from '../../media/folders'
import { randomServerUploadName } from '../../media/uploadGuards'
import { MARKETING_GROUP, hiddenFromEditors, marketingAccess } from '../access'

/** Photos only: no video yet, and no SVG (it can carry code). */
export const MARKETING_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

/** Stored under "marketing-media/<random folder>/" (browser uploads name the folder after the
 * collection), apart from club files. The nightly clean-up only looks in the club folders
 * ("media/", "documents/"), so it never removes these. */
const folder = uploadFolder('marketing-media')

// Platform-level (src/tenancy.ts): the company website's photos, not any club's.
export const MarketingMedia: CollectionConfig = {
  slug: 'marketing-media',
  labels: { singular: 'Photo', plural: 'Photos' },
  lockDocuments: false,
  admin: {
    group: MARKETING_GROUP,
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    hidden: hiddenFromEditors,
  },
  access: marketingAccess,
  hooks: { beforeOperation: [folder.assignFolder, randomServerUploadName] },
  upload: {
    mimeTypes: MARKETING_MEDIA_TYPES,
    disableLocalStorage: true,
    filenameCompoundIndex: ['filename', 'prefix'],
    // The original is re-saved without the camera's hidden details (src/media/cleanOriginal.ts).
    resizeOptions: cleanOriginal,
    // The same widths and quality as club photos (src/collections/Media.ts).
    imageSizes: [640, 1024, 1600, 2400, 3200].map((width) => ({
      name: `w${width}`,
      width,
      withoutEnlargement: true,
      formatOptions: { format: 'webp' as const, options: { quality: 88, smartSubsample: true } },
    })),
    adminThumbnail: ({ doc }) => {
      const d = doc as { url?: string | null; sizes?: { w640?: { url?: string | null } } | null }
      return d.sizes?.w640?.url ?? d.url ?? null
    },
    focalPoint: true,
  },
  fields: [
    {
      // Required on the marketing site (hand-off §8), unlike club photos.
      name: 'alt',
      label: 'Description',
      type: 'text',
      required: true,
      maxLength: 200,
      admin: {
        description:
          'What the photo shows, read aloud to people using screen readers. Required. For demo pictures, say so, e.g. "Demo club: a heathland fairway at dawn".',
      },
    },
    folder.prefixField,
  ],
}
