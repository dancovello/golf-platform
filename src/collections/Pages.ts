import type { CollectionConfig, Validate, Where } from 'payload'

import { editorTenantID, isSuperAdmin, loggedIn } from '../access/roles'
import { pageBlocks } from '../blocks'
import { pageLivePreview } from '../site/livePreview'
import { checkPageSameClub } from '../site/sameClub'

const idOf = (v: unknown) =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String(v.id) : null

/** A page can't sit inside itself or inside one of its own child pages (which would make a
 * loop). Walks up from the chosen parent; the club's own pages only (checkPageSameClub). */
const validParent: Validate = async (value, { id, req }) => {
  let next = idOf(value)
  if (!next) return true
  for (let depth = 0; next && depth < 20; depth++) {
    if (id && String(next) === String(id)) {
      return 'A page can’t be inside itself or one of its own child pages.'
    }
    const parent = await req.payload
      .findByID({ collection: 'pages', id: next, depth: 0, overrideAccess: true, req })
      .catch(() => null)
    next = idOf(parent?.parent)
  }
  return true
}

// Club-owned (src/tenancy.ts). The multi-tenant plugin adds the required `tenant` field and
// limits editors to their own club. The page is built from blocks (src/blocks).
export const Pages: CollectionConfig = {
  slug: 'pages',
  lockDocuments: false,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', '_status', 'updatedAt'],
    livePreview: pageLivePreview,
  },
  // Drafts, saved automatically as you type so the live preview keeps up. Visitors only see
  // the published version (src/site/published.ts). The history keeps the last 50 versions.
  versions: { drafts: { autosave: { interval: 800 } }, maxPerDoc: 50 },
  access: {
    create: loggedIn,
    read: loggedIn,
    update: loggedIn,
    delete: loggedIn,
    // The multi-tenant plugin scopes `read` but not the version history, so this does:
    // editors see only their own club's drafts and old versions.
    readVersions: ({ req: { user } }) => {
      if (isSuperAdmin(user)) return true
      const tenant = editorTenantID(user)
      return tenant ? { 'version.tenant': { equals: tenant } } : false
    },
  },
  // A slug only has to be unique within one club, so two clubs can both have /membership.
  indexes: [{ fields: ['tenant', 'slug'], unique: true }],
  hooks: { beforeValidate: [checkPageSameClub] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description:
          'The page address, e.g. "membership" for /membership. Use "home" for the home page.',
      },
    },
    {
      name: 'parent',
      label: 'Parent page (optional)',
      type: 'relationship',
      relationTo: 'pages',
      validate: validParent,
      // Only this club's other pages (checkPageSameClub refuses anything else on save).
      filterOptions: ({ id, data }) => {
        const and: Where[] = []
        if (data?.tenant) and.push({ tenant: { equals: idOf(data.tenant) } })
        if (id) and.push({ id: { not_equals: id } })
        return { and }
      },
      admin: {
        position: 'sidebar',
        description:
          'Put this page under another one, e.g. "Green fees" under "Visitors". A menu item set to show its page’s child pages lists this page in its drop-down. The page address stays the same.',
      },
    },
    {
      name: 'menuPosition',
      label: 'Position in the drop-down (optional)',
      type: 'number',
      min: 1,
      max: 99,
      admin: {
        position: 'sidebar',
        description: '1 comes first. Pages without a number follow, in A–Z order.',
        condition: (data) => Boolean(data?.parent),
      },
    },
    {
      name: 'hideFromMenu',
      label: 'Leave out of drop-downs and footer lists',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar', condition: (data) => Boolean(data?.parent) },
    },
    {
      name: 'layout',
      label: 'Page content',
      type: 'blocks',
      blocks: pageBlocks,
      admin: { initCollapsed: false },
    },
  ],
}
