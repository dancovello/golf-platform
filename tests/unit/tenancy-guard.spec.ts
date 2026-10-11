// Every collection must be either club-owned (plugin-scoped and covered by the isolation
// suite) or explicitly platform-level. A new collection in neither list fails the build.
import { describe, expect, it } from 'vitest'

import { collections } from '@/collections'
import { clubOwnedCollections, platformCollections } from '@/tenancy'

describe('every collection is classified', () => {
  const clubOwned = Object.keys(clubOwnedCollections)
  const platform: readonly string[] = platformCollections

  it.each(collections.map((c) => c.slug))('%s is club-owned or platform-level', (slug) => {
    expect(clubOwned.includes(slug) || platform.includes(slug)).toBe(true)
  })

  it('no collection is in both lists', () => {
    expect(clubOwned.filter((slug) => platform.includes(slug))).toEqual([])
  })
})
