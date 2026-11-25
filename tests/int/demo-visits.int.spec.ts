/** Counting visits to prospect demos (src/site/demoVisits.ts). */
import { sql } from '@payloadcms/db-postgres'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { deleteOldDemoVisits, DEMO_VISIT_DAYS } from '@/privacy/cleanUp'
import { DEMO_VISITS_PER_DAY } from '@/security/rateLimit'
import { demoVisitPage, recordDemoVisit } from '@/site/demoVisits'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

beforeEach(async () => {
  await w.payload.db.drizzle.execute(sql`DELETE FROM demo_visits`)
  await w.payload.db.drizzle.execute(sql`DELETE FROM rate_limits`)
})

const makeDemo = async (slug: string) => {
  const club = await w.payload.create({
    collection: 'tenants',
    data: { name: `Demo ${slug}`, slug, demoEnabled: true },
    overrideAccess: true,
  })
  return { club, address: `${slug}-${club.demoToken}` }
}

const visits = async () =>
  (
    await w.payload.find({
      collection: 'demo-visits',
      sort: 'visitedAt',
      limit: 0,
      overrideAccess: true,
    })
  ).docs

describe('which page is recorded', () => {
  const address = 'radyr-abcdefghjkmnpqrs'
  it('keeps only the part after the demo address, without ? or #', () => {
    expect(demoVisitPage(address, `/demo/${address}`)).toBe('/')
    expect(demoVisitPage(address, `/demo/${address}/`)).toBe('/')
    expect(demoVisitPage(address, `/demo/${address}/green-fees`)).toBe('/green-fees')
    expect(demoVisitPage(address, `/demo/${address}/search?q=secret`)).toBe('/search')
    expect(demoVisitPage(address, `/demo/${address}/news/a-day#top`)).toBe('/news/a-day')
  })

  it('refuses pages that are not part of that demo', () => {
    expect(demoVisitPage(address, '/demo/other-abcdefghjkmnpqrs')).toBeNull()
    expect(demoVisitPage(address, `/demo/${address}extra`)).toBeNull()
    expect(demoVisitPage(address, '/admin')).toBeNull()
    expect(demoVisitPage(address, 42)).toBeNull()
    expect(demoVisitPage(address, `/demo/${address}/${'a'.repeat(300)}`)).toBeNull()
    expect(demoVisitPage(address, `/demo/${address}/<script>`)).toBeNull()
  })
})

describe('saving visits', () => {
  it('saves a visit only for the demo whose link matches, while it is on and not expired', async () => {
    const { club, address } = await makeDemo('visit-one')
    const other = await makeDemo('visit-two')

    expect(await recordDemoVisit(w.payload, address, `/demo/${address}/green-fees`)).toBe(true)
    const [saved] = await visits()
    expect(saved).toMatchObject({ clubId: String(club.id), page: '/green-fees' })
    // Nothing else about the visitor is kept.
    expect(Object.keys(saved!).sort()).toEqual(
      ['clubId', 'createdAt', 'id', 'page', 'updatedAt', 'visitedAt'].sort(),
    )

    // A wrong ending, another club's ending, or a page from another demo: nothing saved.
    expect(await recordDemoVisit(w.payload, 'visit-one-abcdefghjkmnpqrs', '/demo/x')).toBe(false)
    const mixed = `visit-one-${other.club.demoToken}`
    expect(await recordDemoVisit(w.payload, mixed, `/demo/${mixed}`)).toBe(false)
    expect(await recordDemoVisit(w.payload, address, `/demo/${other.address}`)).toBe(false)
    expect(await recordDemoVisit(w.payload, { a: 1 }, '/')).toBe(false)

    // Expired: not counted.
    await w.payload.update({
      collection: 'tenants',
      id: club.id,
      data: { demoExpiresAt: new Date(Date.now() - 1000).toISOString() },
      overrideAccess: true,
    })
    expect(await recordDemoVisit(w.payload, address, `/demo/${address}`)).toBe(false)

    // Gone live (demo off): the old link counts nothing.
    await w.payload.update({
      collection: 'tenants',
      id: other.club.id,
      data: { demoEnabled: false },
      overrideAccess: true,
    })
    expect(await recordDemoVisit(w.payload, other.address, `/demo/${other.address}`)).toBe(false)

    expect(await visits()).toHaveLength(1)
  })

  it('saves at most the daily limit for each demo', async () => {
    const { address } = await makeDemo('visit-limit')
    const other = await makeDemo('visit-limit-other')
    const now = new Date()
    for (let i = 0; i < DEMO_VISITS_PER_DAY.max; i++) {
      await recordDemoVisit(w.payload, address, `/demo/${address}`, now)
    }
    expect(await recordDemoVisit(w.payload, address, `/demo/${address}`, now)).toBe(false)
    expect(await visits()).toHaveLength(DEMO_VISITS_PER_DAY.max)
    // Another demo has its own allowance.
    expect(await recordDemoVisit(w.payload, other.address, `/demo/${other.address}`, now)).toBe(
      true,
    )
  })
})

describe('only the super-admin sees visits', () => {
  it('club editors can’t read, change or delete them, and nobody creates them by hand', async () => {
    const { address } = await makeDemo('visit-access')
    await recordDemoVisit(w.payload, address, `/demo/${address}`)
    const [visit] = await visits()
    const asEditor = { overrideAccess: false as const, user: w.editorA }
    await expect(w.payload.find({ collection: 'demo-visits', ...asEditor })).rejects.toThrow()
    await expect(
      w.payload.update({
        collection: 'demo-visits',
        id: visit!.id,
        data: { page: '/changed' },
        ...asEditor,
      }),
    ).rejects.toThrow()
    await expect(
      w.payload.delete({ collection: 'demo-visits', id: visit!.id, ...asEditor }),
    ).rejects.toThrow()
    const asAdmin = { overrideAccess: false as const, user: w.superAdmin }
    await expect(
      w.payload.create({
        collection: 'demo-visits',
        data: { clubId: 'x', page: '/', visitedAt: new Date().toISOString() },
        ...asAdmin,
      }),
    ).rejects.toThrow()
    await expect(
      w.payload.update({
        collection: 'demo-visits',
        id: visit!.id,
        data: { page: '/changed' },
        ...asAdmin,
      }),
    ).rejects.toThrow()
    const seen = await w.payload.find({ collection: 'demo-visits', ...asAdmin })
    expect(seen.docs.map((d) => d.page)).toEqual(['/'])
  })
})

describe('clean-up', () => {
  it(`deletes visits ${DEMO_VISIT_DAYS} days after the visit, and no sooner`, async () => {
    const now = new Date('2027-06-01T12:00:00Z')
    const day = 24 * 60 * 60 * 1000
    const at = (days: number) =>
      w.payload.create({
        collection: 'demo-visits',
        data: {
          clubId: 'x',
          page: `/${days}`,
          visitedAt: new Date(now.getTime() - days * day).toISOString(),
        },
        overrideAccess: true,
      })
    await at(DEMO_VISIT_DAYS + 1)
    await at(DEMO_VISIT_DAYS - 1)
    expect(await deleteOldDemoVisits(w.payload, now)).toBe(1)
    expect((await visits()).map((v) => v.page)).toEqual([`/${DEMO_VISIT_DAYS - 1}`])
  })
})
