import type { CollectionBeforeChangeHook, Field, PayloadRequest } from 'payload'
import { publicError } from '../errors'

/**
 * "Someone else changed this" protection (QA-36). Payload's own "who is editing" locking is
 * switched off on purpose (its records can be read across clubs), so two editors on one page
 * used to overwrite each other silently. Instead, the editor's screen carries the time the
 * page was last saved when they opened it (a hidden, never-stored field); a save is refused if
 * the page has been saved by anyone since.
 */
/**
 * When the page was last saved by anyone. A draft save does not change the published row's own
 * time, so with drafts on, the newest version's time is the one that counts.
 */
const lastSavedAt = async (
  req: PayloadRequest,
  collection: string,
  doc: { id?: unknown; updatedAt?: unknown } | undefined,
): Promise<number | null> => {
  if (!doc?.id) return null
  const times = [doc.updatedAt]
  try {
    const latest = await req.payload.findVersions({
      collection: collection as never,
      where: { parent: { equals: doc.id } },
      sort: '-updatedAt',
      limit: 1,
      depth: 0,
      pagination: false,
      overrideAccess: false, // the editor's own access: their club's versions only
      // Their own connection, not the request's: this also runs while a page is being deleted,
      // and a failed lookup inside that same database transaction would undo the delete.
      user: req.user,
    })
    times.push((latest.docs[0] as { updatedAt?: unknown } | undefined)?.updatedAt)
  } catch {
    // Collections without versions: the document's own time is all there is.
  }
  const best = Math.max(...times.map((t) => (t ? new Date(String(t)).getTime() : 0)))
  return best || null
}

export const openedAtField = (collection: string): Field => ({
  name: 'openedAt',
  type: 'text',
  virtual: true,
  admin: { hidden: true },
  hooks: {
    afterRead: [
      async ({ originalDoc, req, findMany }) => {
        if (findMany) return undefined
        const at = await lastSavedAt(req, collection, originalDoc)
        return at ? String(at) : undefined
      },
    ],
  },
})

export const STALE_MESSAGE =
  'Someone else has changed this since you opened it. Copy anything you want to keep, then reload the page to see their version.'

/** Refuses a save made from a screen opened before the last save. Saves with no `openedAt` (scripts, the API) are unchecked. */
export const refuseStaleSave =
  (collection: string): CollectionBeforeChangeHook =>
  async ({ data, originalDoc, operation, req }) => {
    if (operation !== 'update') return data
    const { openedAt, ...rest } = data as { openedAt?: unknown }
    if (openedAt === undefined || openedAt === null || openedAt === '') return rest
    const saved = await lastSavedAt(req, collection, originalDoc)
    if (saved && Number(openedAt) !== saved) throw publicError(STALE_MESSAGE, 409)
    return rest
  }
