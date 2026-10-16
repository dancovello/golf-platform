import type { Field } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import { pageBlocks } from '@/blocks'
import { buildDemoClub, DEMO_SLUG, removeDemoClub } from '@/demo/demoClub'
import { loadClubBySlug, loadClubPage } from '@/site/loadClub'

import { seedWorld, type World } from './helpers/seed'

let w: World
let built: Awaited<ReturnType<typeof buildDemoClub>>

beforeAll(async () => {
  w = await seedWorld()
  built = await buildDemoClub(w.payload)
}, 300_000)

const demoClub = async () =>
  (
    await w.payload.find({
      collection: 'tenants',
      where: { slug: { equals: DEMO_SLUG } },
      overrideAccess: true,
    })
  ).docs[0]

/** Every design style of every block, from the block configs themselves. */
const allStyles = () =>
  pageBlocks.flatMap((block) => {
    const style = (block.fields as Field[]).find((f) => 'name' in f && f.name === 'style') as
      { options?: ({ value: string } | string)[] } | undefined
    return (style?.options ?? []).map((o) => `${block.slug}:${typeof o === 'string' ? o : o.value}`)
  })

describe('the demo club', () => {
  it('uses every block, in every one of its styles', async () => {
    const club = await demoClub()
    const { docs } = await w.payload.find({
      collection: 'pages',
      where: { tenant: { equals: club.id } },
      limit: 100,
      overrideAccess: true,
    })
    const used = new Set(
      docs.flatMap((p) =>
        (p.layout ?? []).map((b) => `${b.blockType}:${(b as { style?: string }).style}`),
      ),
    )
    expect(allStyles().filter((s) => !used.has(s))).toEqual([])
    expect(docs).toHaveLength(built.pages)
  })

  it('has its menu, footer and pages linked up, with nothing pointing nowhere', async () => {
    const club = await loadClubBySlug(DEMO_SLUG)
    expect(club?.header.menu.map((m) => m.label)).toEqual([
      'Golf',
      'Visitors',
      'Membership',
      'Clubhouse',
      'About',
    ])
    const menuLinks = club!.header.menu.flatMap((m) => [
      ...(m.link ? [m.link] : []),
      ...m.groups.flatMap((g) => g.links.map((l) => l.link)),
    ])
    expect(menuLinks.length).toBeGreaterThan(15)
    expect(menuLinks).toContainEqual({ kind: 'page', slug: 'contact' })
    expect(club!.footer.linkColumns.map((c) => c.heading)).toEqual(['Golf', 'Visitors', 'The club'])
    // The Golf drop-down and footer column come from the Golf page's child pages, in order.
    const golf = club!.header.menu[0].groups[0].links.map((l) => l.label)
    expect(golf).toEqual([
      'The courses',
      'The Championship course',
      'The Heathland course',
      'Scorecards',
      'Course status',
      'The Academy',
      'Competitions',
    ])
    expect(club!.footer.linkColumns[0].links.map((l) => l.label)).toEqual(golf.slice(1))
    expect(club!.announcement?.items).toHaveLength(3)
    // Every page the menu points at exists and has content.
    for (const link of menuLinks) {
      if (link.kind !== 'page' || ['news', 'events', 'contact', 'privacy'].includes(link.slug))
        continue
      const page = await loadClubPage(club!.tenantID, link.slug)
      expect(page?.layout.length, link.slug).toBeGreaterThan(0)
    }
  })

  it('fills in news, events, team, courses, documents and enquiries', async () => {
    const club = await demoClub()
    const own = { tenant: { equals: club.id } }
    const count = async (
      collection: 'news' | 'events' | 'staff' | 'courses' | 'documents' | 'enquiries',
    ) => (await w.payload.count({ collection, where: own, overrideAccess: true })).totalDocs
    expect(await count('news')).toBe(12)
    expect(await count('events')).toBe(8)
    expect(await count('staff')).toBe(10)
    expect(await count('courses')).toBe(2)
    expect(await count('documents')).toBe(10)
    expect(await count('enquiries')).toBe(4)
  })

  it('can be rebuilt, replacing the old one', async () => {
    const before = await demoClub()
    await buildDemoClub(w.payload)
    const after = await demoClub()
    expect(after.id).not.toBe(before.id)
    expect(
      (
        await w.payload.count({
          collection: 'tenants',
          where: { slug: { equals: DEMO_SLUG } },
          overrideAccess: true,
        })
      ).totalDocs,
    ).toBe(1)
  }, 300_000)

  it('never touches another club', async () => {
    const pagesA = await w.payload.count({
      collection: 'pages',
      where: { tenant: { equals: w.clubA.id } },
      overrideAccess: true,
    })
    expect(pagesA.totalDocs).toBe(1)
    expect(await removeDemoClub(w.payload)).toBe(true)
    expect(await removeDemoClub(w.payload)).toBe(false)
    expect(
      (
        await w.payload.count({
          collection: 'pages',
          where: { tenant: { equals: w.clubA.id } },
          overrideAccess: true,
        })
      ).totalDocs,
    ).toBe(1)
  })
})
