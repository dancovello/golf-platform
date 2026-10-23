import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
} from 'payload'

import { idOf } from '../blocks/types'
import { clubOwnedCollections } from '../tenancy'

import { ADDRESSES_TAG, clearCache, clubTag } from './cache'

/**
 * Clearing a club's cached site data when its content changes (src/site/cache.ts). Only that
 * club's tag is cleared: publishing at club A never clears club B. A record moved from one club
 * to another clears both.
 */

/** Saving a draft over a draft changes nothing visitors see; everything else might. */
const visitorsCouldSeeIt = (doc: unknown, previousDoc: unknown) =>
  !(
    (doc as { _status?: string } | null)?._status === 'draft' &&
    (previousDoc as { _status?: string } | null)?._status === 'draft'
  )

const clearClub = (tenant: unknown) => {
  const tenantID = idOf(tenant)
  if (tenantID) clearCache(clubTag(tenantID))
}

export const clearClubCacheAfterChange: CollectionAfterChangeHook = ({ doc, previousDoc }) => {
  if (visitorsCouldSeeIt(doc, previousDoc)) {
    clearClub(doc?.tenant)
    if (previousDoc?.tenant && idOf(previousDoc.tenant) !== idOf(doc?.tenant)) {
      clearClub(previousDoc.tenant)
    }
  }
  return doc
}

export const clearClubCacheAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  clearClub(doc?.tenant)
  return doc
}

/** A club's own record: its name and web addresses. */
const clearClubRecordAfterChange: CollectionAfterChangeHook = ({ doc }) => {
  clearCache(ADDRESSES_TAG)
  clearClub(doc?.id)
  return doc
}
const clearClubRecordAfterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  clearCache(ADDRESSES_TAG)
  clearClub(doc?.id)
  return doc
}

/** Adds the hooks to every club-owned collection (src/tenancy.ts) and to clubs themselves. */
export const withCacheClearing = (collections: CollectionConfig[]): CollectionConfig[] =>
  collections.map((c) => {
    const hooks = c.hooks ?? {}
    if (c.slug === 'tenants') {
      return {
        ...c,
        hooks: {
          ...hooks,
          afterChange: [...(hooks.afterChange ?? []), clearClubRecordAfterChange],
          afterDelete: [...(hooks.afterDelete ?? []), clearClubRecordAfterDelete],
        },
      }
    }
    if (!(c.slug in clubOwnedCollections)) return c
    return {
      ...c,
      hooks: {
        ...hooks,
        afterChange: [...(hooks.afterChange ?? []), clearClubCacheAfterChange],
        afterDelete: [...(hooks.afterDelete ?? []), clearClubCacheAfterDelete],
      },
    }
  })
