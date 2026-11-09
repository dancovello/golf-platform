import type {
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  CollectionBeforeValidateHook,
  CollectionConfig,
} from 'payload'
import { ValidationError } from 'payload'

import { editorTenantID, isSuperAdmin, superAdminOnly } from '../access/roles'
import { publicError } from '../errors'
import { SLUG, slugify } from '../fields/slug'
import { clubOwnedCollections, type ClubOwnedSlug } from '../tenancy'
import { demoExpiry, newDemoToken } from '../site/demo'
import { hostProblem, normaliseHost } from '../site/hosts'
import { DEFAULT_BRAND } from '../theme/colour'
import { DEFAULT_CATEGORIES } from './defaultCategories'
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

/** The hidden canary clubs (src/canary) must never be reachable on a web address or a demo link. */
const canaryClubsHaveNoAddress: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  const slug = String(data?.slug ?? originalDoc?.slug ?? '')
  const domains = (data?.domains ?? originalDoc?.domains ?? []) as unknown[]
  if (slug.startsWith('canary-') && domains.length > 0) {
    throw new ValidationError({
      errors: [{ path: 'domains', message: 'The hidden canary clubs can’t have a web address.' }],
    })
  }
  if (slug.startsWith('canary-') && (data?.demoEnabled ?? originalDoc?.demoEnabled)) {
    throw new ValidationError({
      errors: [{ path: 'demoEnabled', message: 'The hidden canary clubs can’t be a public demo.' }],
    })
  }
  return data
}

/**
 * A prospect demo (src/site/demo.ts) is a club shown publicly before it has signed up, so it
 * can have neither a web address nor an editor account: turn the demo off first (going live).
 */
const demoClubsAreNotLive: CollectionBeforeValidateHook = async ({ data, originalDoc, req }) => {
  const enabled = data?.demoEnabled ?? originalDoc?.demoEnabled
  if (!enabled) return data
  const domains = (data?.domains ?? originalDoc?.domains ?? []) as unknown[]
  if (domains.length > 0) {
    throw new ValidationError({
      errors: [
        {
          path: 'domains',
          message: 'A demo club can’t have a web address. Turn the demo off to take it live.',
        },
      ],
    })
  }
  if (originalDoc?.id) {
    const { totalDocs } = await req.payload.count({
      collection: 'users',
      where: { tenant: { equals: originalDoc.id } },
      overrideAccess: true,
      req,
    })
    if (totalDocs > 0) {
      throw new ValidationError({
        errors: [{ path: 'demoEnabled', message: 'A club with editor accounts can’t be a demo.' }],
      })
    }
  }
  return data
}

/**
 * Turning a demo on makes its random address ending and a 30-day expiry; turning it off (the
 * club going live) clears both, so the old link stops working for good and a later demo gets a
 * new one.
 */
const manageDemo: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data) return data
  const was = Boolean(originalDoc?.demoEnabled)
  const now = data.demoEnabled === undefined ? was : Boolean(data.demoEnabled)
  if (now && !was) {
    data.demoToken = newDemoToken()
    if (!data.demoExpiresAt) data.demoExpiresAt = demoExpiry().toISOString()
  } else if (!now) {
    data.demoToken = null
    data.demoExpiresAt = null
  }
  return data
}

/** Deleting a club deletes everything it owns, but only if it is an empty shell as far as real
 * people go: editor accounts and accepted agreements are real records, so a club that has
 * either is refused (remove them first, deliberately). The database itself refuses to delete
 * a club that still owns anything, so without this the Delete button just fails. The club's
 * collections come from src/tenancy.ts, the list the isolation suite also uses, so a new one
 * can't be forgotten. Runs in the same transaction: if any step fails, nothing is removed. */
const deleteClubWithContent: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const { payload } = req
  const own = { tenant: { equals: id } }
  for (const collection of ['users', 'agreement-acceptances'] as const) {
    const { totalDocs } = await payload.count({ collection, where: own, overrideAccess: true, req })
    if (totalDocs > 0) {
      throw publicError(
        'This club has editor accounts or an accepted agreement, so it can’t be deleted here. Remove those first.',
        400,
        undefined,
        true,
      )
    }
  }
  const owned = Object.keys(clubOwnedCollections).filter((c) => c !== 'agreement-acceptances')
  for (const collection of owned as ClubOwnedSlug[]) {
    await payload.delete({ collection, where: own, overrideAccess: true, req })
  }
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
    beforeValidate: [defaultSlug, tidyDomains, canaryClubsHaveNoAddress, demoClubsAreNotLive],
    beforeDelete: [deleteClubWithContent],
    beforeChange: [manageDemo],
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
        // The starter categories, in order (one at a time, so they keep that order).
        for (const category of DEFAULT_CATEGORIES) {
          await req.payload.create({
            collection: 'categories',
            data: { ...category, tenant: doc.id },
            overrideAccess: true,
            req,
          })
        }
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
    {
      // Prospect demos (docs/operations/prospect-demos.md). Only a super-admin can change these.
      name: 'demoEnabled',
      label: 'Public demo',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      access: {
        create: ({ req: { user } }) => isSuperAdmin(user),
        update: ({ req: { user } }) => isSuperAdmin(user),
      },
      admin: {
        description:
          'Shows this club at a public link anyone can open, for 30 days, hidden from search engines. Turn it OFF when the club goes live (then add its web address).',
      },
    },
    {
      name: 'demoToken',
      label: 'Demo link ending',
      type: 'text',
      unique: true,
      index: true,
      // No field-level access: Payload would drop the value the hook above sets. Only a
      // super-admin can change a club at all, and the admin shows it read-only.
      admin: {
        readOnly: true,
        condition: (data) => Boolean(data?.demoEnabled),
        description:
          'Made for you when the demo is switched on. The link is /demo/<short name>-<this>.',
      },
    },
    {
      // The full link, ready to copy (a display only: nothing is saved).
      name: 'demoLink',
      type: 'ui',
      admin: {
        condition: (data) => Boolean(data?.demoEnabled),
        components: { Field: '/admin/DemoLinkField#DemoLinkField' },
      },
    },
    {
      name: 'demoExpiresAt',
      label: 'Demo expires',
      type: 'date',
      access: {
        create: ({ req: { user } }) => isSuperAdmin(user),
        update: ({ req: { user } }) => isSuperAdmin(user),
      },
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        condition: (data) => Boolean(data?.demoEnabled),
        description: '30 days after the demo was switched on. Change it to extend or end it early.',
      },
    },
  ],
}
