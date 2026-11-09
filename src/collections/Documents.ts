import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { clubContentCreate, loggedIn } from '../access/roles'
import { uploadFolder } from '../media/folders'
import { randomServerUploadName } from '../media/uploadGuards'
import { clubBannerField } from '../tenancy'
import { searchHooks } from '../search/hooks'
import { checkDocumentSameClub } from '../site/sameClub'

/** Files a club can offer for download: PDF and Word. Checked by their real contents. */
export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const folder = uploadFolder('documents')

/** The starter category whose documents must show when they were last reviewed (doc 05). */
const POLICIES_SLUG = 'policies'

/** Doc 05: policies must show when they were last reviewed. */
const policiesNeedReviewDate: CollectionBeforeValidateHook = async ({
  collection,
  data,
  originalDoc,
  req,
}) => {
  const merged = { ...originalDoc, ...data }
  const categoryID = typeof merged.category === 'object' ? merged.category?.id : merged.category
  if (!categoryID || merged.lastReviewed) return data
  const category = await req.payload
    .findByID({ collection: 'categories', id: categoryID, depth: 0, req, overrideAccess: true })
    .catch(() => null)
  if (category?.slug === POLICIES_SLUG) {
    throw new ValidationError({
      collection: collection.slug,
      errors: [
        { path: 'lastReviewed', message: 'Policies need the date they were last reviewed.' },
      ],
    })
  }
  return data
}

// Club-owned (src/tenancy.ts), like Photos and videos: the club is required and editors only
// see their own. Files are public at a random address; the collection itself is never public.
export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: { singular: 'Document', plural: 'Documents' },
  lockDocuments: false,
  admin: {
    group: 'Club information',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'lastReviewed', 'updatedAt'],
    description:
      'Word and PDF files carry hidden details, such as the author’s name. Before uploading, check them in the file’s properties (in Word: File, then Info, then Inspect Document).',
  },
  access: { create: clubContentCreate, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: {
    beforeOperation: [folder.assignFolder, randomServerUploadName],
    beforeValidate: [checkDocumentSameClub, policiesNeedReviewDate],
    ...searchHooks,
  },
  upload: {
    mimeTypes: DOCUMENT_TYPES,
    disableLocalStorage: true,
    filenameCompoundIndex: ['filename', 'prefix'],
  },
  fields: [
    clubBannerField,
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 80 },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          label: 'Category',
          type: 'relationship',
          relationTo: 'categories',
          required: true,
          admin: {
            description:
              'The club’s categories, shared with news. Add or change them under Website → Categories. Policies need a "last reviewed" date.',
          },
        },
        {
          name: 'lastReviewed',
          label: 'Last reviewed',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMMM yyyy' },
            description: 'Required for policies. Shown on the site; flagged after 12 months.',
          },
        },
      ],
    },
    folder.prefixField,
  ],
}
