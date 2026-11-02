/** Prospect demos (src/site/demo.ts, docs/operations/prospect-demos.md). */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCacheStoreForTests } from '@/site/cache'
import { submitEnquiry } from '@/site/contact/submit'
import { DEMO_DAYS, parseDemoAddress } from '@/site/demo'
import { siteFromDemo, siteFromDomain, siteFromPreview } from '@/site/resolveSite'

import { memoryCache } from '../shared/memoryCache'
import { createEditor, seedWorld, type World } from './helpers/seed'

const request = vi.hoisted(() => ({ headers: new Headers() }))
vi.mock('next/headers', () => ({ headers: async () => request.headers }))

let w: World
const cache = memoryCache()

beforeAll(async () => {
  w = await seedWorld()
  useCacheStoreForTests(cache.store)
})
afterAll(() => useCacheStoreForTests(null))
beforeEach(() => {
  cache.reset()
  request.headers = new Headers()
})

const makeDemo = async (slug: string) => {
  const club = await w.payload.create({
    collection: 'tenants',
    data: { name: `Demo ${slug}`, slug, demoEnabled: true },
    overrideAccess: true,
  })
  return { club, address: `${slug}-${club.demoToken}` }
}

describe('switching a demo on and off', () => {
  it('makes a random ending and a 30-day expiry', async () => {
    const { club } = await makeDemo('demo-one')
    expect(club.demoToken).toMatch(/^[a-z2-9]{8}$/)
    const days = (new Date(club.demoExpiresAt!).getTime() - Date.now()) / 86_400_000
    expect(days).toBeGreaterThan(DEMO_DAYS - 0.01)
    expect(days).toBeLessThanOrEqual(DEMO_DAYS)
  })

  it('gives each demo its own ending', async () => {
    const a = await makeDemo('demo-two')
    const b = await makeDemo('demo-three')
    expect(a.club.demoToken).not.toBe(b.club.demoToken)
  })

  it('clears the ending and expiry when the club goes live, so the old link is dead', async () => {
    const { club, address } = await makeDemo('demo-live')
    expect(await siteFromDemo(address)).toMatchObject({ demo: expect.anything() })
    const live = await w.payload.update({
      collection: 'tenants',
      id: club.id,
      data: { demoEnabled: false, domains: [{ hostname: 'www.demo-live.example.com' }] },
      overrideAccess: true,
    })
    expect(live.demoToken).toBeNull()
    expect(live.demoExpiresAt).toBeNull()
    expect(await siteFromDemo(address)).toBeNull()
  })

  it('is indexable on its own web address once it has gone live (production)', async () => {
    const { club, address } = await makeDemo('demo-index')
    const site = await siteFromDemo(address)
    if (!site || site === 'expired') throw new Error('expected a demo site')
    // While a demo: never indexable, and it carries no address of its own.
    expect(site.indexable).toBe(false)
    await w.payload.update({
      collection: 'tenants',
      id: club.id,
      data: { demoEnabled: false, domains: [{ hostname: 'www.demo-index.example.com' }] },
      overrideAccess: true,
    })
    cache.reset()
    request.headers = new Headers({ 'x-club-host': 'www.demo-index.example.com' })
    const setting = process.env.VERCEL_ENV
    process.env.VERCEL_ENV = 'production'
    try {
      const live = await siteFromDomain('www.demo-index.example.com')
      expect(live?.club.slug).toBe('demo-index')
      expect(live?.indexable).toBe(true)
      expect(live?.demo).toBeNull()
    } finally {
      if (setting === undefined) delete process.env.VERCEL_ENV
      else process.env.VERCEL_ENV = setting
    }
  })

  it('gives a new ending if the demo is switched on again', async () => {
    const { club, address } = await makeDemo('demo-again')
    await w.payload.update({
      collection: 'tenants',
      id: club.id,
      data: { demoEnabled: false },
      overrideAccess: true,
    })
    const again = await w.payload.update({
      collection: 'tenants',
      id: club.id,
      data: { demoEnabled: true },
      overrideAccess: true,
    })
    expect(`demo-again-${again.demoToken}`).not.toBe(address)
    expect(await siteFromDemo(address)).toBeNull()
    expect(await siteFromDemo(`demo-again-${again.demoToken}`)).not.toBeNull()
  })
})

describe('opening a demo link', () => {
  it('finds the club only with its short name AND its ending', async () => {
    const one = await makeDemo('demo-find')
    const two = await makeDemo('demo-other')
    const site = await siteFromDemo(one.address)
    expect(site).not.toBe('expired')
    expect(site).not.toBeNull()
    if (!site || site === 'expired') throw new Error('expected a site')
    expect(site.club.slug).toBe('demo-find')
    expect(site.base).toBe(`/demo/${one.address}`)
    expect(site.indexable).toBe(false)
    expect(site.origin).toBeNull()
    expect(site.demo).not.toBeNull()
    // One club's name with another's ending, or the name alone, opens nothing.
    expect(await siteFromDemo(`demo-find-${two.club.demoToken}`)).toBeNull()
    expect(await siteFromDemo(`demo-other-${one.club.demoToken}`)).toBeNull()
    expect(await siteFromDemo('demo-find')).toBeNull()
    expect(parseDemoAddress('demo-find')).toBeNull()
  })

  it('never opens a club that is not a demo, however the link is built', async () => {
    expect(await siteFromDemo('test-club-a-aaaaaaaa')).toBeNull()
    expect(await siteFromDemo('test-club-b-22222222')).toBeNull()
    expect(await siteFromDemo(`${w.clubA.slug}-${'x'.repeat(8)}`)).toBeNull()
    expect(await siteFromDemo('../admin')).toBeNull()
  })

  it('says "expired" once the 30 days have run out, and works again if extended', async () => {
    const { club, address } = await makeDemo('demo-expiry')
    await w.payload.update({
      collection: 'tenants',
      id: club.id,
      data: { demoExpiresAt: new Date(Date.now() - 1000).toISOString() },
      overrideAccess: true,
    })
    expect(await siteFromDemo(address)).toBe('expired')
    await w.payload.update({
      collection: 'tenants',
      id: club.id,
      data: { demoExpiresAt: new Date(Date.now() + 86_400_000).toISOString() },
      overrideAccess: true,
    })
    const site = await siteFromDemo(address)
    expect(site).not.toBe('expired')
    expect(site).not.toBeNull()
  })

  it('does not make a demo club reachable by anything else on production', async () => {
    const { address } = await makeDemo('demo-prod')
    const setting = process.env.SITE_PREVIEW
    process.env.SITE_PREVIEW = 'off'
    try {
      // The demo works with the staging preview off (as on production); the preview does not.
      expect(await siteFromDemo(address)).not.toBeNull()
      expect(await siteFromPreview('demo-prod', null)).toBeNull()
    } finally {
      if (setting === undefined) delete process.env.SITE_PREVIEW
      else process.env.SITE_PREVIEW = setting
    }
  })
})

describe('a demo club is not a live club', () => {
  it('can never be one of the hidden canary clubs', async () => {
    await expect(
      w.payload.create({
        collection: 'tenants',
        data: { name: 'Canary Z', slug: 'canary-z', demoEnabled: true },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('cannot have a web address', async () => {
    const { club } = await makeDemo('demo-domain')
    await expect(
      w.payload.update({
        collection: 'tenants',
        id: club.id,
        data: { domains: [{ hostname: 'www.demo-domain.example.com' }] },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    await expect(
      w.payload.create({
        collection: 'tenants',
        data: {
          name: 'Both',
          slug: 'demo-both',
          demoEnabled: true,
          domains: [{ hostname: 'www.both.example.com' }],
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('cannot be switched on for a club that already has editors', async () => {
    await expect(
      w.payload.update({
        collection: 'tenants',
        id: w.clubA.id,
        data: { demoEnabled: true },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
    const after = await w.payload.findByID({
      collection: 'tenants',
      id: w.clubA.id,
      overrideAccess: true,
    })
    expect(after.demoEnabled).toBeFalsy()
  })

  it('cannot be given an editor account', async () => {
    const { club } = await makeDemo('demo-editor')
    await expect(
      createEditor(w.payload, 'editor@demo-editor.example.com', club.id),
    ).rejects.toThrow()
    const { totalDocs } = await w.payload.count({
      collection: 'users',
      where: { tenant: { equals: club.id } },
      overrideAccess: true,
    })
    expect(totalDocs).toBe(0)
  })
})

describe('the contact form on a demo', () => {
  it('sends and stores nothing', async () => {
    const { club } = await makeDemo('demo-contact')
    const form = new FormData()
    form.set('name', 'Pat Visitor')
    form.set('email', 'pat@example.com')
    form.set('message', 'Hello')
    const state = await submitEnquiry('demo-contact', { attempt: 0 }, form)
    expect(state?.sent).toBeNull()
    expect(state?.formError).toMatch(/demo/i)
    const { totalDocs } = await w.payload.count({
      collection: 'enquiries',
      where: { tenant: { equals: club.id } },
      overrideAccess: true,
    })
    expect(totalDocs).toBe(0)
  })
})
