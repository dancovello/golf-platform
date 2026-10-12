import { randomUUID } from 'node:crypto'

import type { CollectionBeforeOperationHook, CollectionConfig } from 'payload'

import { loggedIn } from '../access/roles'
import { randomServerUploadName } from '../media/uploadGuards'
import { MEDIA_PREFIX } from '../media/storage'

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

const newPrefix = () => `media/${randomUUID()}`

/** Gives a new file its random folder before Payload picks the file name, so the name is only
 * compared with files in that folder (see filenameCompoundIndex below). */
const assignFolder: CollectionBeforeOperationHook = ({ args, operation }) => {
  if (operation === 'create') {
    const data = (args.data ?? {}) as { prefix?: string }
    args.data = { ...data, prefix: data.prefix ?? newPrefix() } as typeof args.data
  }
  return args
}

// Club-owned (src/tenancy.ts): the multi-tenant plugin adds the required club and limits
// editors to their own club's files. Visitors never read this collection; the public site
// shows files from their public address (src/media/storage.ts).
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Photo or video', plural: 'Photos and videos' },
  lockDocuments: false,
  admin: { useAsTitle: 'alt', defaultColumns: ['filename', 'alt', 'updatedAt'] },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: { beforeOperation: [assignFolder, randomServerUploadName] },
  upload: {
    mimeTypes: MEDIA_TYPES,
    // Files live in R2, never on the app's disk.
    disableLocalStorage: true,
    // A file name only has to be unique inside its own random folder. A site-wide unique name
    // would rename club A's "hero.jpg" to "hero-1.jpg" if club B had one, hinting club B exists.
    filenameCompoundIndex: ['filename', 'prefix'],
    // Smaller copies of every photo, so phones don't download the full-size file. WebP, never
    // larger than the original. Videos are stored as uploaded.
    imageSizes: [640, 1024, 1600, 2400].map((width) => ({
      name: `w${width}`,
      width,
      withoutEnlargement: true,
      formatOptions: { format: 'webp' as const, options: { quality: 80 } },
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
    {
      // The file's random folder. Set when the file is added and never changed, so no one can
      // point their record at another club's file. The database also requires it to be unique.
      name: 'prefix',
      type: 'text',
      unique: true,
      defaultValue: newPrefix,
      access: { update: () => false },
      admin: { hidden: true },
      validate: (value: unknown) =>
        typeof value === 'string' && MEDIA_PREFIX.test(value) ? true : 'Invalid file folder.',
    },
  ],
}
