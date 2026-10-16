import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'

import { editorTenantID, isSuperAdmin, superAdminOnly } from '../access/roles'
import { SLUG, slugify } from '../fields/slug'
import { DEFAULT_BRAND } from '../theme/colour'
import { DEFAULT_FONT_SET } from '../theme/fontSets'

/** New clubs get a web-safe short name from their name unless one is given. */
const defaultSlug: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation === 'create' && data && !data.slug && typeof data.name === 'string') {
    data.slug = slugify(data.name)
  }
  return data
}

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  labels: { singular: 'Club', plural: 'Clubs' },
  // Document locking is off everywhere: Payload's lock records are readable by every
  // logged-in user, across clubs (docs/plans/step-2-spike-findings.md, finding 2).
  lockDocuments: false,
  admin: {
    useAsTitle: 'name',
    hidden: ({ user }) => !isSuperAdmin(user),
    components: { beforeListTable: ['/admin/DemoClubPanel#DemoClubPanel'] },
  },
  access: {
    create: superAdminOnly,
    // An editor can read only their own club's record.
    read: ({ req: { user } }) => {
      if (isSuperAdmin(user)) return true
      const tenantID = editorTenantID(user)
      return tenantID === null ? false : { id: { equals: tenantID } }
    },
    update: superAdminOnly,
    delete: superAdminOnly,
  },
  hooks: {
    beforeValidate: [defaultSlug],
    // Every club gets its Club Settings and Course status records straight away (one each).
    afterChange: [
      async ({ doc, operation, req }) => {
        if (operation !== 'create') return doc
        await req.payload.create({
          collection: 'club-settings',
          data: {
            clubName: doc.name,
            tenant: doc.id,
            branding: { ...DEFAULT_BRAND, fontSet: DEFAULT_FONT_SET },
            header: { style: 'classic' },
            footer: { style: 'brandColumns' },
            announcement: { style: 'classic', tone: 'brand' },
            contact: { replyDays: 1 },
          },
          req,
        })
        await req.payload.create({
          collection: 'course-status',
          data: { tenant: doc.id, state: 'open' },
          req,
        })
        return doc
      },
    ],
  },
  fields: [
    { name: 'name', label: 'Club name', type: 'text', required: true },
    {
      name: 'slug',
      label: 'Short name',
      type: 'text',
      // Not marked required, so it can be left empty on the form: defaultSlug fills it in on
      // save, and the database refuses a club without one (NOT NULL, unique).
      unique: true,
      index: true,
      admin: {
        description:
          'Lower-case letters, numbers and dashes, e.g. "royal-example". Filled in from the club name if left empty. Used in staging preview addresses.',
      },
      validate: (value: unknown) =>
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && SLUG.test(value))
          ? true
          : 'Use lower-case letters, numbers and single dashes, e.g. "royal-example".',
    },
  ],
}
