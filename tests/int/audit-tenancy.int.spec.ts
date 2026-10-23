/**
 * Proof tests for the tenancy audit (docs/security/audit-tenancy.md, 22 Oct 2026).
 *
 * Each `it.fails` test describes how the code SHOULD behave and currently fails, proving the
 * finding. `it.fails` keeps CI green while the finding is open: once the fix lands the test
 * starts passing, Vitest reports that as a failure, and the fix PR must change `it.fails` to `it`.
 */
import { commitTransaction, createLocalReq, initTransaction } from 'payload'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useCacheStoreForTests } from '@/site/cache'
import { loadClubPage } from '@/site/loadClub'
import { findClubByHost, siteFromPreview } from '@/site/resolveSite'

import { memoryCache } from '../shared/memoryCache'
import { PASSWORD, seedWorld, type World } from './helpers/seed'

// An anonymous visitor: no session cookie. (The two-factor plugin also reads cookies, outside
// this mock; it logs "called outside a request scope" and Payload treats the visitor as signed
// out, which is what these tests want.)
const request = vi.hoisted(() => ({ headers: new Headers() }))
vi.mock('next/headers', () => ({ headers: async () => request.headers }))

let w: World
const cache = memoryCache()
const previewSetting = process.env.SITE_PREVIEW

beforeAll(async () => {
  w = await seedWorld()
  useCacheStoreForTests(cache.store)
  // As on production: the open staging preview is off; only the admin's live preview works.
  process.env.SITE_PREVIEW = 'off'
})
afterAll(() => {
  useCacheStoreForTests(null)
  if (previewSetting === undefined) delete process.env.SITE_PREVIEW
  else process.env.SITE_PREVIEW = previewSetting
})
beforeEach(() => {
  cache.reset()
  request.headers = new Headers()
})

/** A save as it happens in the admin: inside a database transaction, committed at the end. */
const inTransaction = async (
  save: (req: Awaited<ReturnType<typeof createLocalReq>>) => Promise<void>,
) => {
  const req = await createLocalReq({}, w.payload)
  await initTransaction(req)
  await save(req)
  return () => commitTransaction(req)
}

describe('audit T1: the cache is cleared before the save is committed', () => {
  it.fails(
    'T1: an address moved from club A to club B shows club B once the save is done',
    async () => {
      // A visitor has just looked at club A's second address, so it's cached.
      expect((await findClubByHost('old-club-a.localhost'))?.slug).toBe(w.clubA.slug)

      // The super-admin moves that address to club B (one save, one transaction).
      const commit = await inTransaction(async (req) => {
        await w.payload.update({
          collection: 'tenants',
          id: w.clubA.id,
          data: { domains: [{ hostname: 'club-a.localhost' }] },
          overrideAccess: true,
          req,
        })
        await w.payload.update({
          collection: 'tenants',
          id: w.clubB.id,
          data: {
            domains: [{ hostname: 'club-b.localhost' }, { hostname: 'old-club-a.localhost' }],
          },
          overrideAccess: true,
          req,
        })
      })
      // The save hooks have already cleared the cache, but the database hasn't committed yet.
      // A visitor arriving in this moment reads the old data, and it goes back into the cache.
      await findClubByHost('old-club-a.localhost')
      await commit()

      // The address now belongs to club B, so its visitors should see club B.
      // Today they keep getting club A's site for up to 5 minutes.
      expect((await findClubByHost('old-club-a.localhost'))?.slug).toBe(w.clubB.slug)
    },
  )

  it.fails('T1: a published change reaches visitors once the save is done', async () => {
    expect((await loadClubPage(w.clubA.id, 'membership'))?.title).toBe(w.pageA.title)

    const commit = await inTransaction(async (req) => {
      await w.payload.update({
        collection: 'pages',
        id: w.pageA.id,
        data: { title: 'Membership (corrected)', _status: 'published' },
        overrideAccess: true,
        req,
      })
    })
    await loadClubPage(w.clubA.id, 'membership') // a visitor in the gap
    await commit()

    // Today visitors keep seeing the old version for up to an hour. The same applies to
    // unpublishing something posted by mistake.
    expect((await loadClubPage(w.clubA.id, 'membership'))?.title).toBe('Membership (corrected)')
  })
})

describe("audit T2: the live preview loads a club before checking who's asking", () => {
  it('(today) an anonymous visitor is refused either way', async () => {
    expect(await siteFromPreview(String(w.clubB.slug), '1')).toBeNull()
    expect(await siteFromPreview('no-such-club', '1')).toBeNull()
  })

  it.fails(
    'T2: an anonymous visitor causes the same work whether or not the club exists',
    async () => {
      await siteFromPreview('no-such-club', '1')
      const missing = [...cache.calls]
      cache.reset()
      await siteFromPreview(String(w.clubB.slug), '1')
      const real = [...cache.calls]
      // Today a real club's short name loads its whole site (menus, settings, photos) before
      // the sign-in check, and a made-up one doesn't: the difference in work (and response time)
      // tells an outsider which short names exist.
      expect(real).toEqual(missing)
    },
  )

  it.fails("T2: club A's editor can't tell whether another club's short name exists", async () => {
    const { token } = await w.payload.login({
      collection: 'users',
      data: { email: 'editor-a@example.com', password: PASSWORD },
    })
    request.headers = new Headers({ authorization: `JWT ${token}` })
    // Their own club still works.
    expect((await siteFromPreview(String(w.clubA.slug), '1'))?.club.tenantID).toBe(w.clubA.id)

    cache.reset()
    expect(await siteFromPreview('no-such-club', '1')).toBeNull()
    const missing = [...cache.calls]
    cache.reset()
    expect(await siteFromPreview(String(w.clubB.slug), '1')).toBeNull()
    expect(cache.calls).toEqual(missing)
  })

  it.fails("T2: an anonymous visitor's live-preview request loads no club data", async () => {
    await siteFromPreview(String(w.clubB.slug), '1')
    expect(cache.calls).toEqual([])
  })
})
