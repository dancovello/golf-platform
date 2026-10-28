/**
 * Cached club data never crosses clubs (job 5, 21 Oct grilling; src/site/cache.ts). Part of the
 * tenant-isolation suite: caching is a new way for one club's data to reach another.
 *
 * Runs against an in-memory stand-in with the same rules as Next.js's data cache
 * (tests/shared/memoryCache.ts), so each test can see exactly what was cached and cleared. The
 * real cache is covered by tests/e2e/site-cache.spec.ts.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { CACHED_LOADERS, clubCached, clubTag, useCacheStoreForTests } from '@/site/cache'
import { upcomingEvents } from '@/site/events'
import { loadClubBySlug, loadClubPage } from '@/site/loadClub'
import { latestNews } from '@/site/news'
import { findClubByHost } from '@/site/resolveSite'

import { memoryCache } from '../shared/memoryCache'
import { seedWorld, type World } from './helpers/seed'

let w: World
const cache = memoryCache()

beforeAll(async () => {
  w = await seedWorld()
  useCacheStoreForTests(cache.store)
})
afterAll(() => useCacheStoreForTests(null))
beforeEach(() => cache.reset())
afterEach(() => vi.useRealTimers())

const p = () => w.payload
const title = async (tenantID: string, slug = 'membership') =>
  (await loadClubPage(tenantID, slug))?.title

describe('cached club data never crosses clubs', () => {
  it('two clubs with the same page address each get their own page, from the cache too', async () => {
    for (let round = 0; round < 2; round++) {
      expect(await title(w.clubA.id)).toBe(w.pageA.title)
      expect(await title(w.clubB.id)).toBe(w.pageB.title)
    }
    // Loaded once each, then served from the cache.
    expect(cache.calls.filter((c) => c === 'publishedPage')).toHaveLength(2)
  })

  it("every cached entry's key and tag name exactly one club", async () => {
    await title(w.clubA.id)
    await title(w.clubB.id)
    await latestNews(w.clubA.id, 3)
    await upcomingEvents(w.clubB.id, 3)
    for (const { id, tags } of cache.keys()) {
      const clubs = [w.clubA.id, w.clubB.id].filter((c) => id.includes(c))
      expect({ id, clubs: clubs.length }).toEqual({ id, clubs: 1 })
      expect(tags).toEqual([clubTag(clubs[0]!)])
    }
  })

  it("publishing at club A clears club A's cache, never club B's", async () => {
    await title(w.clubA.id)
    await title(w.clubB.id)
    await p().update({
      collection: 'pages',
      id: w.pageA.id,
      data: { title: 'Membership (A, changed)', _status: 'published' },
      overrideAccess: true,
    })
    const held = cache.keys().map((k) => k.id)
    expect(held.some((id) => id.includes(w.clubA.id))).toBe(false)
    expect(held.some((id) => id.includes(w.clubB.id))).toBe(true)
    // And the next visitor sees the change straight away.
    expect(await title(w.clubA.id)).toBe('Membership (A, changed)')
    expect(await title(w.clubB.id)).toBe(w.pageB.title)
  })

  it('a visitor never gets a cached draft', async () => {
    await title(w.clubA.id)
    const published = await title(w.clubA.id)
    await p().update({
      collection: 'pages',
      id: w.pageA.id,
      data: { title: 'Secret draft title' },
      draft: true,
      overrideAccess: true,
    })
    // The live preview (drafts) reads around the cache and leaves nothing in it.
    const before = cache.keys().length
    expect((await loadClubPage(w.clubA.id, 'membership', { draft: true }))?.title).toBe(
      'Secret draft title',
    )
    expect(cache.keys().length).toBe(before)
    expect(JSON.stringify(cache.keys())).not.toContain('Secret draft')
    // Visitors still get the published page.
    expect(await title(w.clubA.id)).toBe(published)
  })

  it('a past event drops off within 5 minutes, without anyone publishing', async () => {
    vi.useFakeTimers({ now: Date.now(), toFake: ['Date'] })
    const soon = await p().create({
      collection: 'events',
      data: {
        title: 'Starts in an hour',
        status: 'published',
        category: 'social',
        booking: 'book',
        startsAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        tenant: w.clubA.id,
      } as never,
      overrideAccess: true,
    })
    expect((await upcomingEvents(w.clubA.id, 20)).map((e) => e.id)).toContain(String(soon.id))
    vi.setSystemTime(Date.now() + 2 * 60 * 60 * 1000) // two hours later
    expect((await upcomingEvents(w.clubA.id, 20)).map((e) => e.id)).not.toContain(String(soon.id))
  })

  it("changing a club's web addresses clears the address lookups", async () => {
    expect((await findClubByHost('club-a.localhost'))?.slug).toBe(w.clubA.slug)
    await p().update({
      collection: 'tenants',
      id: w.clubA.id,
      data: { domains: [{ hostname: 'club-a-new.localhost' }] },
      overrideAccess: true,
    })
    expect(await findClubByHost('club-a.localhost')).toBeNull()
    expect((await findClubByHost('club-a-new.localhost'))?.slug).toBe(w.clubA.slug)
  })

  it("the club's shared data (menus, settings) is cached per club and correct for each", async () => {
    const a = await loadClubBySlug(String(w.clubA.slug))
    const b = await loadClubBySlug(String(w.clubB.slug))
    expect(a?.tenantID).toBe(w.clubA.id)
    expect(b?.tenantID).toBe(w.clubB.id)
    expect(a?.name).not.toBe(b?.name)
  })
})

describe('the cache rules themselves', () => {
  it('every cached loader is keyed by club ID, except the two that find a club by its address', () => {
    const byAddress = CACHED_LOADERS.filter((l) => l.keyedBy === 'address').map((l) => l.name)
    expect(byAddress.sort()).toEqual(['clubByHost', 'clubIDBySlug'])
    expect(CACHED_LOADERS.filter((l) => l.keyedBy === 'club').length).toBeGreaterThanOrEqual(7)
  })

  it('a cached loader refuses anything but a club ID first', async () => {
    const loader = clubCached('test', async (tenantID: string) => tenantID)
    await expect(loader('membership')).rejects.toThrow(/club's ID/)
    await expect(loader('')).rejects.toThrow(/club's ID/)
    await expect(loader(w.clubA.id)).resolves.toBe(w.clubA.id)
  })
})
