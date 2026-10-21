import type { CollectionConfig, TextFieldSingleValidation } from 'payload'
import { text as textRules } from 'payload/shared'

import { SLUG, SLUG_MESSAGE } from '../../fields/slug'
import { MARKETING_GROUP, hiddenFromEditors, marketingAccess } from '../access'
import { marketingBlocks } from '../blocks'
import { maxWords } from '../fields'

/** The home page's address. Every other page is "/<address>". */
export const HOME_SLUG = 'home'

const validSlug: TextFieldSingleValidation = (value, args) => {
  const basics = textRules(value, args)
  if (basics !== true || !value) return basics
  return SLUG.test(value) ? true : `${SLUG_MESSAGE} e.g. "pricing".`
}

// Platform-level (src/tenancy.ts): the company website's pages, not any club's.
export const MarketingPages: CollectionConfig = {
  slug: 'marketing-pages',
  labels: { singular: 'Page', plural: 'Pages' },
  lockDocuments: false,
  admin: {
    group: MARKETING_GROUP,
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    hidden: hiddenFromEditors,
  },
  access: marketingAccess,
  // Drafts, saved as you type. Visitors only see the published version.
  versions: { drafts: { autosave: { interval: 800 } }, maxPerDoc: 50 },
  fields: [
    { name: 'title', label: 'Page name', type: 'text', required: true, maxLength: 80 },
    {
      name: 'slug',
      label: 'Address',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 80,
      validate: validSlug,
      admin: {
        position: 'sidebar',
        description: `The part after the domain, e.g. "pricing" for /pricing. The home page is "${HOME_SLUG}".`,
      },
    },
    { name: 'layout', label: 'Sections', type: 'blocks', blocks: marketingBlocks },
    {
      name: 'meta',
      label: 'Search engines and sharing',
      type: 'group',
      fields: [
        {
          name: 'title',
          label: 'Title (optional)',
          type: 'text',
          maxLength: 60,
          admin: { description: 'Leave empty to use the page name.' },
        },
        {
          name: 'description',
          label: 'Description',
          type: 'textarea',
          maxLength: 155,
          validate: maxWords(30),
          admin: { description: 'One benefit and one proof, under 155 characters (doc 19).' },
        },
      ],
    },
  ],
}
