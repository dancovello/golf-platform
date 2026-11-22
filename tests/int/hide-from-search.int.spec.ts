/** "Keep out of search engines" (Tenants.hideFromSearch): a live club that must never be indexed. */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCacheStoreForTests } from '@/site/cache'
import { siteFromDomain } from '@/site/resolveSite'
import { robotsResponse, sitemapResponse } from '@/site/routes/seo'

import { memoryCache } from '../shared/memoryCache'
import { seedWorld, type World } from './helpers/seed'

const request = vi.hoisted(() => ({ headers: new Headers() }))
vi.mock('next/headers', () => ({ headers: async () => request.headers }))

let w: World
const cache = memoryCache()

beforeAll(async () => {
  w = await seedWorld()
  useCacheStoreForTests(cache.store)
})
afterAll(() => useCacheStoreForTests(null))
beforeEach(() => cache.reset())

const onProduction = async <T>(run: () => Promise<T>) => {
  const setting = process.env.VERCEL_ENV
  process.env.VERCEL_ENV = 'production'
  try {
    return await run()
  } finally {
    if (setting === undefined) delete process.env.VERCEL_ENV
    else process.env.VERCEL_ENV = setting
  }
}

describe('keep out of search engines', () => {
  it('is indexable by default, and not once switched on', async () => {
    const host = 'www.hidden-test.example.com'
    const club = await w.payload.create({
      collection: 'tenants',
      data: { name: 'Hidden Test', slug: 'hidden-test', domains: [{ hostname: host }] },
      overrideAccess: true,
    })
    request.headers = new Headers({ 'x-club-host': host })
    await onProduction(async () => {
      const open = await siteFromDomain(host)
      expect(open?.indexable).toBe(true)
      expect(await (await robotsResponse(open)).text()).toContain('Allow: /')

      await w.payload.update({
        collection: 'tenants',
        id: club.id,
        data: { hideFromSearch: true },
        overrideAccess: true,
      })
      cache.reset()
      const hidden = await siteFromDomain(host)
      expect(hidden?.indexable).toBe(false)
      expect(await (await robotsResponse(hidden)).text()).toContain('Disallow: /\n')
      expect((await sitemapResponse(hidden)).status).toBe(404)
    })
  })
})
