import type { CollectionConfig } from 'payload'

import { loggedIn } from '../access/roles'
import { randomServerUploadName } from '../media/uploadGuards'
import { uploadFolder } from '../media/folders'

/** Photos and videos a club can use in its blocks. Images are checked by their actual
 * contents, not their name; anything not on this list is refused. No SVG: it can carry code. */
export const MEDIA_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'video/mp4',
  'video/webm',
]

const folder = uploadFolder('media')

// Club-owned (src/tenancy.ts): the multi-tenant plugin adds the required club and limits
// editors to their own club's files. Visitors never read this collection; the public site
// shows files from their public address (src/media/storage.ts).
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo or video', plural: 'Photos and videos' },
  lockDocuments: false,
  admin: { useAsTitle: 'alt', defaultColumns: ['filename', 'alt', 'updatedAt'] },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: { beforeOperation: [folder.assignFolder, randomServerUploadName] },
  upload: {
    mimeTypes: MEDIA_TYPES,
    // Files live in R2, never on the app's disk.
    disableLocalStorage: true,
    // A file name only has to be unique inside its own random folder. A site-wide unique name
    // would rename club A's "hero.jpg" to "hero-1.jpg" if club B had one, hinting club B exists.
    filenameCompoundIndex: ['filename', 'prefix'],
    // Copies of every photo at set widths, so phones don't download the full-size file and big
    // high-resolution screens get a sharp one (3200 covers a full-width photo on a 1600px-wide
    // retina screen). WebP, never larger than the original. Quality 88 with sharp colour edges:
    // 80 showed blocks and bands in smooth skies. Videos are stored as uploaded.
    imageSizes: [640, 1024, 1600, 2400, 3200].map((width) => ({
      name: `w${width}`,
      width,
      withoutEnlargement: true,
      formatOptions: {
        format: 'webp' as const,
        options: { quality: 88, smartSubsample: true },
      },
    })),
    adminThumbnail: 'w640',
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      label: 'Description',
      type: 'text',
      required: true,
      admin: {
        description:
          'What the photo shows, for people using screen readers, e.g. "The 7th green at sunset". Required.',
      },
    },
    folder.prefixField,
  ],
}
