import type { Payload } from 'payload'

import type { CanaryTargets } from './probe'

/** The hidden canary clubs (docs/operations/canary.md). Never given a web address. */
export const CANARY_A_SLUG = 'canary-a'
export const CANARY_B_SLUG = 'canary-b'
/** In the titles of canary club B's records: if club A ever sees it, that's a leak. */
export const CANARY_MARKER = 'CANARY-B-ONLY'

/** What the canary tries to reach: canary club B's records, read directly from the database. */
export const canaryTargets = async (payload: Payload): Promise<CanaryTargets | null> => {
  const { docs } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: CANARY_B_SLUG } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const clubB = docs[0]
  if (!clubB) return null
  const records: CanaryTargets['records'] = []
  for (const collection of ['pages', 'news', 'club-settings', 'staff'] as const) {
    const found = await payload.find({
      collection,
      where: { tenant: { equals: clubB.id } },
      limit: 5,
      depth: 0,
      overrideAccess: true,
    })
    records.push(...found.docs.map((d) => ({ collection, id: String(d.id) })))
  }
  // Club B's marked account (CRON-3). Looked up by club, so canary A's own editor never counts.
  const accounts = await payload.find({
    collection: 'users',
    where: { tenant: { equals: clubB.id } },
    limit: 5,
    depth: 0,
    overrideAccess: true,
  })
  records.push(...accounts.docs.map((d) => ({ collection: 'users', id: String(d.id) })))
  return { clubB: { id: String(clubB.id), slug: CANARY_B_SLUG }, records, marker: CANARY_MARKER }
}
