import type { Where } from 'payload'

/**
 * Pages have drafts (src/collections/Pages.ts). Visitors only ever see published pages: a
 * page that has never been published is left out of the site, its menus and its links.
 * (Edits saved as a draft to a published page live in its version history, so the published
 * version is what these queries return.) Only the live preview shows drafts.
 */
export const PUBLISHED: Where = { _status: { not_equals: 'draft' } }
