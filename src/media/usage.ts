import type { CollectionBeforeDeleteHook, Field, PayloadRequest } from 'payload'

import { publicError } from '../errors'

/**
 * Where a photo or video is used (QA-27, 17 Nov 2026). Deleting one that a published page uses
 * left a blank where the photo was while the page still said "Published". So a file that is
 * still in use is not deleted: the editor is told exactly where it is used and can remove it
 * from those places first.
 *
 * Works on any club's content without knowing which blocks hold photos: a photo's ID is
 * written wherever it is used, so a club's pages, news, courses and settings are searched for it.
 * Each search is made as the signed-in editor, so it can only ever see their own club.
 */
const PLACES = [
  { collection: 'pages', drafts: true, name: (d: Doc) => `the page “${d.title ?? d.slug}”` },
  { collection: 'news', drafts: false, name: (d: Doc) => `the news story “${d.title}”` },
  { collection: 'courses', drafts: false, name: (d: Doc) => `the course “${d.name}”` },
  { collection: 'club-settings', drafts: false, name: () => 'your Club Settings' },
] as const

type Doc = { title?: string; slug?: string; name?: string }

export const findUses = async (req: PayloadRequest, id: string | number): Promise<string[]> => {
  const needle = `"${id}"`
  const found = new Set<string>()
  for (const place of PLACES) {
    // Published copies and the latest draft can differ: the photo may be used by either.
    for (const draft of place.drafts ? [false, true] : [false]) {
      const { docs } = await req.payload.find({
        collection: place.collection,
        draft,
        depth: 0,
        limit: 1000,
        pagination: false,
        overrideAccess: false,
        user: req.user,
      })
      for (const doc of docs) {
        if (JSON.stringify(doc).includes(needle)) found.add(place.name(doc as Doc))
      }
    }
  }
  return [...found]
}

export const describeUses = (uses: string[]) =>
  `Used on ${uses.slice(0, 8).join(', ')}${uses.length > 8 ? ` and ${uses.length - 8} more` : ''}.`

/** Refuses to delete a file that is still used, and says where. */
export const refuseDeleteInUse: CollectionBeforeDeleteHook = async ({ id, req }) => {
  // Only an editor's own deleting is checked: trusted scripts (clean-ups, tests) have no sign-in.
  if (!req.user) return
  const uses = await findUses(req, id)
  if (uses.length === 0) return
  throw publicError(
    `This can’t be deleted because it is still used. ${describeUses(uses)} Choose another photo in ${uses.length === 1 ? 'that place' : 'those places'} (or remove it), then delete this one.`,
    409,
  )
}

/** Read-only "Where this is used" line on the photo's own screen. */
export const usedOnField: Field = {
  name: 'usedOn',
  label: 'Where this is used',
  type: 'text',
  virtual: true,
  admin: { readOnly: true, position: 'sidebar' },
  hooks: {
    afterRead: [
      async ({ originalDoc, req, findMany }) => {
        if (findMany || !originalDoc?.id || !req.user) return undefined
        try {
          const uses = await findUses(req, originalDoc.id)
          return uses.length ? describeUses(uses) : 'Not used anywhere yet.'
        } catch {
          return undefined
        }
      },
    ],
  },
}
