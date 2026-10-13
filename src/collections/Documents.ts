import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { loggedIn } from '../access/roles'
import { uploadFolder } from '../media/folders'
import { randomServerUploadName } from '../media/uploadGuards'
import { DOCUMENT_CATEGORIES } from './documentCategories'

/** Files a club can offer for download: PDF and Word. Checked by their real contents. */
export const DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const folder = uploadFolder('documents')

/** Doc 05: policies must show when they were last reviewed. */
const policiesNeedReviewDate: CollectionBeforeValidateHook = ({
  collection,
  data,
  originalDoc,
}) => {
  const merged = { ...originalDoc, ...data }
  if (merged.category === 'policies' && !merged.lastReviewed) {
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
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'lastReviewed', 'updatedAt'],
  },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  hooks: {
    beforeOperation: [folder.assignFolder, randomServerUploadName],
    beforeValidate: [policiesNeedReviewDate],
  },
  upload: {
    mimeTypes: DOCUMENT_TYPES,
    disableLocalStorage: true,
    filenameCompoundIndex: ['filename', 'prefix'],
  },
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 80 },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          defaultValue: 'other',
          options: DOCUMENT_CATEGORIES,
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
