import type { CollectionAfterDeleteHook, CollectionConfig } from 'payload'

import { clubOwnedCollections } from '../tenancy'
import { auditIdOf, recordAudit } from './record'

/**
 * Deleted club content in the audit log (audit fix plan step 12b): who deleted which page,
 * article, photo, document, team member, course, category, event or enquiry, from which club,
 * and when. Only the name is kept, never the content.
 *
 * - **Only what a signed-in person does.** Scripts and scheduled jobs (the nightly clean-up of
 *   old enquiries, imports, test resets) have no signed-in account, and are left out.
 * - **Deleting a whole club** is one "club deleted" entry (src/collections/Tenants.ts), not one
 *   entry per item: deleteClubWithContent sets `deletingClub` for the deletes it makes.
 * - **An enquiry is named by its reference**, never by the visitor's name or message.
 */
const KINDS: Record<string, string> = {
  pages: 'Page',
  news: 'News article',
  categories: 'Category',
  events: 'Event',
  staff: 'Team member',
  courses: 'Course',
  documents: 'Document',
  media: 'Photo or video',
  enquiries: 'Enquiry',
}

const TITLE_FIELD: Record<string, string> = {
  pages: 'title',
  news: 'title',
  categories: 'name',
  events: 'title',
  staff: 'name',
  courses: 'name',
  documents: 'title',
  media: 'filename',
  // Not the visitor's name.
  enquiries: 'reference',
}

export const auditContentDeleted: CollectionAfterDeleteHook = async ({
  collection,
  doc,
  id,
  req,
}) => {
  if (!req.user || req.context.deletingClub === true) return doc
  const slug = collection.slug
  const kind = KINDS[slug]
  if (!kind) return doc
  const record = doc as Record<string, unknown>
  const title = record[TITLE_FIELD[slug] ?? 'id']
  const clubId = auditIdOf(record.tenant)
  const club = clubId
    ? await req.payload
        .findByID({
          collection: 'tenants',
          id: clubId,
          depth: 0,
          select: { name: true },
          overrideAccess: true,
        })
        .catch(() => null)
    : null
  await recordAudit(req.payload, {
    action: 'content-deleted',
    actor: req.user,
    clubId,
    clubName: club?.name,
    target: `${kind}: ${typeof title === 'string' && title ? title : String(id)}`,
  })
  return doc
}

/** Adds the hook to every club-owned collection that has records people can delete. */
export const withContentAuditing = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) => {
    if (!(c.slug in clubOwnedCollections) || !KINDS[c.slug]) return c
    const hooks = c.hooks ?? {}
    return {
      ...c,
      hooks: { ...hooks, afterDelete: [...(hooks.afterDelete ?? []), auditContentDeleted] },
    }
  })
