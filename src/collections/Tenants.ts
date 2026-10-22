import type { CollectionBeforeValidateHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { editorTenantID, isSuperAdmin, superAdminOnly } from '../access/roles'
import { SLUG, slugify } from '../fields/slug'
import { hostProblem, normaliseHost } from '../site/hosts'
import { DEFAULT_BRAND } from '../theme/colour'
import { DEFAULT_FONT_SET } from '../theme/fontSets'

/** New clubs get a web-safe short name from their name unless one is given. */
const defaultSlug: CollectionBeforeValidateHook = ({ data, operation }) => {
  if (operation === 'create' && data && !data.slug && typeof data.name === 'string') {
    data.slug = slugify(data.name)
  }
  return data
}

/** Web addresses are saved bare and in lower case, whatever was typed ("https://Club.co.uk/"). */
const tidyDomains: CollectionBeforeValidateHook = ({ data }) => {
  if (data && Array.isArray(data.domains)) {
    for (const row of data.domains as { hostname?: unknown }[]) {
      if (typeof row?.hostname === 'string') row.hostname = normaliseHost(row.hostname)
    }
  }
  return data
}

/** The hidden canary clubs (src/canary) must never be reachable on a web address. */
const canaryClubsHaveNoAddress: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const slug = String(data?.slug ?? originalDoc?.slug ?? '')
  const domains = (data?.domains ?? originalDoc?.domains ?? []) as unknown[]
  if (slug.startsWith('canary-') && domains.length > 0) {
    throw new ValidationError({
      errors: [{ path: 'domains', message: 'The hidden canary clubs can’t have a web address.' }],
    })
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
    group: 'Platform',
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
    beforeValidate: [defaultSlug, tidyDomains, canaryClubsHaveNoAddress],
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
            header: { style: 'classic', dropdown: 'panel' },
            footer: { style: 'brandColumns' },
            announcement: { style: 'classic', tone: 'brand' },
            contact: { replyDays: 1 },
          },
          overrideAccess: true,
          req,
        })
        await req.payload.create({
          collection: 'course-status',
          data: { tenant: doc.id, state: 'open' },
          overrideAccess: true,
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
    {
      // Build step 4: the club's own web addresses. A visitor's request is matched to a club
      // only by these (src/site/clubFromHost.ts). Each address belongs to one club at most: the
      // database refuses a second club with the same address (unique index).
      name: 'domains',
      label: 'Web addresses',
      type: 'array',
      labels: { singular: 'Web address', plural: 'Web addresses' },
      maxRows: 10,
      access: {
        create: ({ req: { user } }) => isSuperAdmin(user),
        update: ({ req: { user } }) => isSuperAdmin(user),
      },
      admin: {
        description:
          'The first address is the main one, e.g. "www.yourclub.co.uk". Add others, such as "yourclub.co.uk", and they forward to the main one. Each address must also be added in Vercel (docs/operations/connect-club-domain.md).',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'hostname',
          label: 'Address',
          type: 'text',
          required: true,
          unique: true,
          index: true,
          validate: (value: unknown) =>
            typeof value === 'string' ? (hostProblem(value) ?? true) : 'Enter a web address.',
        },
      ],
      validate: (rows: unknown) => {
        const names = Array.isArray(rows)
          ? rows.map((r) => (r as { hostname?: unknown })?.hostname).filter(Boolean)
          : []
        return new Set(names).size === names.length ? true : 'Each address can only be listed once.'
      },
    },
  ],
}
