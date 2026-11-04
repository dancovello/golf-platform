import type {
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'

import { clubContentCreate, loggedIn } from '../access/roles'
import { SLUG, SLUG_MESSAGE, slugify } from '../fields/slug'
import { publicError } from '../errors'
import { clubBannerField } from '../tenancy'

/** A new category gets its web address from its name unless one is typed. */
const defaultSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.slug && typeof data.name === 'string') {
    data.slug = slugify(data.name).slice(0, 40)
  }
  return data
}

/** A category that articles still use can't be removed: they would be left with none. */
const keepCategoriesInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { totalDocs } = await req.payload.count({
    collection: 'news',
    where: { category: { equals: id } },
    overrideAccess: true,
    req,
  })
  if (totalDocs > 0) {
    throw publicError(
      `${totalDocs === 1 ? 'An article uses' : `${totalDocs} articles use`} this category. Move ${totalDocs === 1 ? 'it' : 'them'} to another category first.`,
      400,
      undefined,
      true,
    )
  }
}

// Club-owned (src/tenancy.ts): the club is required and editors only see their own list.
// One shared list per club; news uses it first, and events or anything else can later.
export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Category', plural: 'Categories' },
  lockDocuments: false,
  admin: {
    group: 'Website',
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'createdAt'],
    description:
      'The club’s categories, used to sort news (and anything else that gets categories later). They show on the website in the order they were added.',
  },
  access: { create: clubContentCreate, read: loggedIn, update: loggedIn, delete: loggedIn },
  // A web address only has to be unique within one club.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  hooks: { beforeValidate: [defaultSlug], beforeDelete: [keepCategoriesInUse] },
  defaultSort: 'createdAt',
  fields: [
    clubBannerField,
    { name: 'name', label: 'Name', type: 'text', required: true, maxLength: 40 },
    {
      name: 'slug',
      label: 'Web address',
      type: 'text',
      required: true,
      maxLength: 40,
      admin: {
        position: 'sidebar',
        description:
          'Filled in from the name. Used in links such as /news?category=competitions. Renaming a category does not change it.',
      },
      validate: (value: unknown) =>
        typeof value === 'string' && SLUG.test(value) ? true : SLUG_MESSAGE,
    },
  ],
}
