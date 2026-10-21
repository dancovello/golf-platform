import type {
  CollectionBeforeValidateHook,
  CollectionConfig,
  TextFieldSingleValidation,
  Where,
  Validate,
} from 'payload'
import { text as textRules } from 'payload/shared'

import { clubContentCreate, editorTenantID, isSuperAdmin, loggedIn } from '../access/roles'
import { pageBlocks } from '../blocks'
import { BUILT_IN_PAGES } from '../fields/link'
import { SLUG, SLUG_MESSAGE, slugify } from '../fields/slug'
import { pageLivePreview } from '../site/livePreview'
import { checkPageSameClub } from '../site/sameClub'
import { idOf } from '../blocks/types'
import { clubBannerField } from '../tenancy'
import { searchHooks } from '../search/hooks'

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

/** Addresses of the pages every club's site already has (News, Events, Contact, Privacy and
 * the search results). A page with one of these would never be shown: the built-in page
 * always wins. */
const RESERVED = new Set<string>([...BUILT_IN_PAGES.map((p) => p.value), 'search'])

const validSlug: TextFieldSingleValidation = (value, args) => {
  const basics = textRules(value, args) // required, length
  if (basics !== true || !value) return basics
  if (!SLUG.test(value)) return `${SLUG_MESSAGE} e.g. "green-fees".`
  if (RESERVED.has(value)) {
    return `"${value}" is already used by your site's own ${value} page. Choose another address.`
  }
  return true
}

/** When a page is first published without an address, it gets one from its title. Not while
 * drafting: autosave would fix the address from the first few letters typed. */
const defaultSlug: CollectionBeforeValidateHook = ({ data }) => {
  if (data && !data.slug && data._status === 'published' && typeof data.title === 'string') {
    data.slug = slugify(data.title).slice(0, 80).replace(/-+$/, '')
  }
  return data
}

// Club-owned (src/tenancy.ts). The multi-tenant plugin adds the required `tenant` field and
// limits editors to their own club. The page is built from blocks (src/blocks).
export const Pages: CollectionConfig = {
  slug: 'pages',
  lockDocuments: false,
  admin: {
    group: 'Website',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'parent', '_status', 'updatedAt'],
    livePreview: pageLivePreview,
    // The club's pages as a tree, above the list (src/admin/PageTree.tsx).
    components: { beforeListTable: ['/admin/PageTree#PageTree'] },
  },
  // Drafts, saved automatically as you type so the live preview keeps up. Visitors only see
  // the published version (src/site/published.ts). The history keeps the last 50 versions.
  versions: { drafts: { autosave: { interval: 800 } }, maxPerDoc: 50 },
  access: {
    create: clubContentCreate,
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
  hooks: { beforeValidate: [defaultSlug, checkPageSameClub], ...searchHooks },
  fields: [
    clubBannerField,
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      maxLength: 80,
      validate: validSlug,
      admin: {
        description:
          'The page address, e.g. "membership" for /membership. Use "home" for the home page. Left empty, it is made from the title when you publish.',
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
