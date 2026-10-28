import type { CollectionConfig } from 'payload'

import { clubContentCreate, loggedIn } from '../access/roles'
import { cleanOriginal } from '../media/cleanOriginal'
import { measureUpload } from '../media/measure'
import { randomServerUploadName } from '../media/uploadGuards'
import { uploadFolder } from '../media/folders'
import { clubBannerField } from '../tenancy'
import { searchHooks } from '../search/hooks'

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
  // Listed by file name: the description is optional, so it may be blank.
  admin: {
    group: 'Club information',
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    description:
      'Photos are cleaned of hidden details (like where they were taken) when you upload them. Videos are not: before uploading a video, turn off location in your phone’s camera settings.',
  },
  access: { create: clubContentCreate, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: {
    beforeOperation: [folder.assignFolder, randomServerUploadName],
    beforeChange: [measureUpload],
    ...searchHooks,
  },
  upload: {
    mimeTypes: MEDIA_TYPES,
    // Files live in R2, never on the app's disk.
    disableLocalStorage: true,
    // A file name only has to be unique inside its own random folder. A site-wide unique name
    // would rename club A's "hero.jpg" to "hero-1.jpg" if club B had one, hinting club B exists.
    filenameCompoundIndex: ['filename', 'prefix'],
    // The original is re-saved without the phone's hidden details (src/media/cleanOriginal.ts).
    resizeOptions: cleanOriginal,
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
    // The library's thumbnails: the 640px copy's public address. Payload's own thumbnail
    // address goes through its file route, which can't find files kept in their own folders
    // in storage, so the library showed a plain file icon instead (Dan, 2026-10-17).
    adminThumbnail: ({ doc }) => {
      const d = doc as {
        url?: string | null
        mimeType?: string | null
        sizes?: Record<string, { url?: string | null } | undefined> | null
      }
      if (!String(d.mimeType ?? '').startsWith('image/')) return null
      // The copies' own addresses (photos added in the browser sit one folder deeper than
      // the record's folder, so the address can't be pieced together from it).
      return d.sizes?.w640?.url ?? d.url ?? null
    },
    focalPoint: true,
  },
  fields: [
    clubBannerField,
    {
      // Optional (Dan, 2026-10-17: it held people up). Without one, the website treats the
      // photo as decoration, so screen readers skip it; the library marks it "Needs
      // description" so it can be added later.
      name: 'alt',
      label: 'Description',
      type: 'text',
      admin: {
        description:
          'What the photo shows, read aloud to people using screen readers, e.g. "The 7th green at sunset". Optional, but please add one for any photo that matters to the page.',
        components: { Cell: '/admin/DescriptionCell#DescriptionCell' },
      },
    },
    folder.prefixField,
    {
      // Set from the file on upload (src/media/measure.ts): how bright the photo is, and
      // whether a logo is light or dark. The website uses it to keep text and logos legible.
      name: 'tone',
      type: 'group',
      admin: { hidden: true },
      fields: [
        { name: 'bright', type: 'text' },
        { name: 'average', type: 'text' },
      ],
    },
  ],
}
