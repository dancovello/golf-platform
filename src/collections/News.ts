import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { loggedIn } from '../access/roles'
import { imageField } from '../blocks/shared'
import { clubRichText } from '../blocks/richText/lexical'
import { checkNewsSameClub } from '../site/sameClub'
import { NEWS_CATEGORIES } from './newsCategories'
import { slugify } from './Tenants'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** A new article gets its web address from its title unless one is typed. */
const defaultSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.slug && typeof data.title === 'string') data.slug = slugify(data.title)
  return data
}

// Club-owned (src/tenancy.ts): the club is required and editors only see their own news.
// The website shows published articles from their publish date, at /news and /news/<address>.
export const News: CollectionConfig = {
  slug: 'news',
  labels: { singular: 'News article', plural: 'News' },
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
  },
  access: { create: loggedIn, read: loggedIn, update: loggedIn, delete: loggedIn },
  // An address only has to be unique within one club.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  hooks: { beforeValidate: [defaultSlug, checkNewsSameClub] },
  defaultSort: '-publishedAt',
  fields: [
    { name: 'title', label: 'Title', type: 'text', required: true, maxLength: 90 },
    {
      type: 'row',
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          defaultValue: 'draft',
          options: [
            { label: 'Draft (not on the website)', value: 'draft' },
            { label: 'Published', value: 'published' },
          ],
        },
        {
          name: 'publishedAt',
          label: 'Publish date',
          type: 'date',
          required: true,
          defaultValue: () => new Date().toISOString(),
          admin: {
            date: { pickerAppearance: 'dayOnly', displayFormat: 'd MMM yyyy' },
            description: 'Shown on the article. A future date keeps it hidden until then.',
          },
        },
        {
          name: 'category',
          label: 'Category',
          type: 'select',
          required: true,
          defaultValue: 'club',
          options: [...NEWS_CATEGORIES],
        },
      ],
    },
    {
      name: 'excerpt',
      label: 'Summary',
      type: 'textarea',
      maxLength: 160,
      admin: { description: 'One or two sentences, shown on cards and under the title.' },
    },
    imageField('image', 'Main photo (optional)', false),
    {
      type: 'row',
      fields: [
        { name: 'imageCaption', label: 'Photo caption (optional)', type: 'text', maxLength: 120 },
        {
          name: 'author',
          label: 'Written by (optional)',
          type: 'text',
          maxLength: 60,
          admin: { description: 'e.g. "Owen Pryce, Course Manager"' },
        },
      ],
    },
    {
      name: 'body',
      label: 'Article',
      type: 'richText',
      editor: clubRichText,
    },
    {
      name: 'slug',
      label: 'Web address',
      type: 'text',
      index: true,
      maxLength: 80,
      admin: {
        position: 'sidebar',
        description:
          'Filled in from the title. e.g. "hollow-tining-week" for /news/hollow-tining-week.',
      },
      validate: (value: unknown) =>
        !value || (typeof value === 'string' && SLUG.test(value))
          ? true
          : 'Lower-case letters, numbers and dashes only.',
    },
  ],
}
