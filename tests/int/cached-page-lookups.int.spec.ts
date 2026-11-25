/**
 * News articles and event pages read from the cache can still draw their links and photos
 * (Sentry GOLF-PLATFORM-H, 25 Nov 2026).
 *
 * The cache stores plain JSON, so the link and photo lookups (`ctx`) used to vanish from a cached
 * article, and the page crashed on its first link to one of the club's pages. The stand-in cache
 * (tests/shared/memoryCache.ts) stores JSON the same way, so the second read here is a cache hit.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { rt } from '@/demo/richText'
import type { Event, News } from '@/payload-types'
import { useCacheStoreForTests } from '@/site/cache'
import { loadEventPage } from '@/site/events'
import { loadNewsPost } from '@/site/news'

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

const body = () =>
  rt.doc(
    rt.p('See ', rt.pageLink('membership', String(w.pageA.id)), ' for details.'),
    rt.image(String(w.mediaA.id)),
  )

describe('a cached page still has its link and photo lookups', () => {
  it('a news article, read twice (the second time from the cache)', async () => {
    const saved = await w.payload.create({
      collection: 'news',
      data: {
        title: 'Linked article',
        status: 'published',
        category: w.categoryA.id,
        publishedAt: new Date(Date.now() - 86_400_000).toISOString(),
        body: body() as News['body'],
        tenant: w.clubA.id,
      } as never,
    })
    const fresh = await loadNewsPost(w.clubA.id, String(saved.slug))
    const cached = await loadNewsPost(w.clubA.id, String(saved.slug))
    expect(cache.calls.filter((c) => c === 'newsPost')).toHaveLength(1)

    for (const post of [fresh, cached]) {
      expect(post).not.toBeNull()
      expect(post!.ctx.link({ type: 'page', page: w.pageA.id }, 'Membership')).toMatchObject({
        label: 'Membership',
      })
    }
    expect(cached!.ctx.media(w.mediaA.id)).toEqual(fresh!.ctx.media(w.mediaA.id))
  })

  it("an event's page, read twice (the second time from the cache)", async () => {
    const saved = await w.payload.create({
      collection: 'events',
      data: {
        title: 'Linked event',
        status: 'published',
        category: 'competition',
        booking: 'book',
        startsAt: new Date(Date.now() + 10 * 86_400_000).toISOString(),
        body: body() as Event['body'],
        tenant: w.clubA.id,
      } as never,
    })
    const fresh = await loadEventPage(w.clubA.id, String(saved.slug))
    const cached = await loadEventPage(w.clubA.id, String(saved.slug))
    expect(cache.calls.filter((c) => c === 'eventPage')).toHaveLength(1)

    for (const page of [fresh, cached]) {
      expect(page).not.toBeNull()
      expect(page!.ctx.link({ type: 'page', page: w.pageA.id }, 'Membership')).toMatchObject({
        label: 'Membership',
      })
    }
    expect(cached!.ctx.media(w.mediaA.id)).toEqual(fresh!.ctx.media(w.mediaA.id))
  })
})
