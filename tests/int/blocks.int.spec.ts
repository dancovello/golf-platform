import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { pngFile } from '../shared/media'
import { rt } from '../shared/richText'
import { loadClubPage } from '@/site/loadClub'
import { seedWorld, type World } from './helpers/seed'

// Every block: club A's page can't use club B's photos or pages (src/blocks/*/config.ts refs).
let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const save = (layout: unknown[]) =>
  w.payload.update({
    collection: 'pages',
    id: w.pageA.id,
    data: { layout } as never,
    overrideAccess: false,
    user: w.editorA,
  })
const errorPaths = (e: unknown) =>
  ((e as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map((x) => x.path)

describe('card grid', () => {
  const card = (image: string, page: string) => ({
    title: 'Card',
    image,
    link: { type: 'page', page },
  })

  it("accepts club A's own photos and pages", async () => {
    const photo = await w.payload.create({
      collection: 'media',
      data: { alt: 'A photo', tenant: w.clubA.id },
      file: pngFile('a.png'),
    })
    await expect(
      save([
        {
          blockType: 'ctaCardGrid',
          style: 'editorial',
          heading: 'Explore',
          cards: [1, 2, 3].map(() => card(photo.id, w.pageA.id)),
        },
      ]),
    ).resolves.toBeTruthy()
  })

  it("refuses club B's photo or page in a card", async () => {
    const error = await save([
      {
        blockType: 'ctaCardGrid',
        style: 'editorial',
        heading: 'Explore',
        cards: [
          card(w.mediaA.id, w.pageA.id),
          card(w.mediaB.id, w.pageA.id),
          card(w.mediaA.id, w.pageB.id),
        ],
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.cards.1.image', 'layout.0.cards.2.link.page']),
    )
  })

  it('needs 3 to 6 cards', async () => {
    await expect(
      save([
        {
          blockType: 'ctaCardGrid',
          style: 'index',
          heading: 'Too few',
          cards: [card(w.mediaA.id, w.pageA.id)],
        },
      ]),
    ).rejects.toThrow()
  })
})

describe('image and text', () => {
  it("refuses club B's photos or page", async () => {
    const error = await save([
      {
        blockType: 'twoColumn',
        style: 'collage',
        image: w.mediaB.id,
        insetImage: w.mediaB.id,
        heading: 'Heading',
        body: 'Body',
        link: { label: 'More', type: 'page', page: w.pageB.id },
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.image', 'layout.0.insetImage', 'layout.0.link.page']),
    )
  })
})

describe('rich text', () => {
  it("refuses club B's photo or page inside the text", async () => {
    const error = await save([
      {
        blockType: 'richText',
        style: 'article',
        content: rt.doc(rt.p('See ', rt.pageLink('their page', w.pageB.id)), rt.image(w.mediaB.id)),
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('layout.0.content')
  })

  it('refuses an unsafe link address', async () => {
    await expect(
      save([
        {
          blockType: 'richText',
          style: 'article',
          content: rt.doc(rt.p(rt.urlLink('x', 'javascript:alert(1)'))),
        },
      ]),
    ).rejects.toThrow()
  })

  it("club A's own page link and photo reach the site", async () => {
    await save([
      {
        blockType: 'richText',
        style: 'article',
        content: rt.doc(
          rt.p('See ', rt.pageLink('membership', w.pageA.id)),
          rt.image(w.mediaA.id, 'Caption'),
        ),
      },
    ])
    const page = await loadClubPage(w.clubA.id, 'membership')
    expect(page!.ctx.link({ label: 'x', type: 'page', page: w.pageA.id })?.link).toEqual({
      kind: 'page',
      slug: 'membership',
    })
    expect(page!.ctx.media(w.mediaA.id)?.url).toBe(w.mediaA.url)
  })
})

describe('document list', () => {
  it("refuses club B's document", async () => {
    const error = await save([
      {
        blockType: 'documentList',
        style: 'grouped',
        heading: 'Docs',
        documents: [w.docA.id, w.docB.id],
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('layout.0.documents')
  })

  it('a policy needs its last-reviewed date', async () => {
    await expect(
      w.payload.update({
        collection: 'documents',
        id: w.docA.id,
        data: { category: 'policies', lastReviewed: null } as never,
        overrideAccess: false,
        user: w.editorA,
      }),
    ).rejects.toThrow()
  })
})

describe('quote', () => {
  it("refuses club B's photo", async () => {
    const error = await save([
      { blockType: 'pullQuote', style: 'overImage', quote: 'Q', name: 'N', image: w.mediaB.id },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('layout.0.image')
  })
})

describe('logo strip', () => {
  it("refuses club B's logo and unsafe websites", async () => {
    const error = await save([
      { blockType: 'logoStrip', style: 'row', partners: [{ name: 'B', logo: w.mediaB.id }] },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('layout.0.partners.0.logo')
    await expect(
      save([
        {
          blockType: 'logoStrip',
          style: 'row',
          partners: [{ name: 'X', url: 'javascript:alert(1)' }],
        },
      ]),
    ).rejects.toThrow()
  })
})

describe('team', () => {
  it("refuses club B's team members", async () => {
    const error = await save([
      {
        blockType: 'team',
        style: 'featured',
        heading: 'Team',
        featured: w.staffB.id,
        people: [w.staffA.id, w.staffB.id],
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.featured', 'layout.0.people']),
    )
  })

  it("a team member can't use club B's photo, or a phone number that isn't one", async () => {
    const update = (data: Record<string, unknown>) =>
      w.payload.update({
        collection: 'staff',
        id: w.staffA.id,
        data: data as never,
        overrideAccess: false,
        user: w.editorA,
      })
    const error = await update({ photo: w.mediaB.id }).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('photo')
    await expect(update({ phone: '<script>' })).rejects.toThrow()
  })

  it('the website gets only the chosen, same-club people', async () => {
    await save([{ blockType: 'team', style: 'grid', heading: 'Team', people: [w.staffA.id] }])
    const page = await loadClubPage(w.clubA.id, 'membership')
    expect(page!.ctx.person(w.staffA.id)).toMatchObject({ name: 'Alex Pro', photo: null })
    expect(page!.ctx.person(w.staffB.id)).toBeNull()
  })
})

describe('membership', () => {
  it('refuses club B\'s pages, and more than one "Most popular"', async () => {
    const tier = (recommended: boolean, page: string) => ({
      name: 'Full',
      recommended,
      link: { type: 'page', page },
    })
    const error = await save([
      {
        blockType: 'membership',
        style: 'cards',
        heading: 'Membership',
        tiers: [tier(false, w.pageA.id), tier(false, w.pageB.id)],
        card: { link: { type: 'page', page: w.pageB.id, label: 'Ask' } },
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.tiers.1.link.page', 'layout.0.card.link.page']),
    )
    await expect(
      save([
        {
          blockType: 'membership',
          style: 'cards',
          heading: 'Membership',
          tiers: [tier(true, w.pageA.id), tier(true, w.pageA.id)],
        },
      ]),
    ).rejects.toThrow()
  })
})

describe('hole by hole', () => {
  it("refuses club B's course", async () => {
    const error = await save([
      { blockType: 'holeGrid', style: 'cards', heading: 'Holes', course: w.courseB.id },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('layout.0.course')
  })

  it("a course can't use club B's photos, and has 9 or 18 holes", async () => {
    const update = (data: Record<string, unknown>) =>
      w.payload.update({
        collection: 'courses',
        id: w.courseA.id,
        data: data as never,
        overrideAccess: false,
        user: w.editorA,
      })
    const holes = (n: number, image?: string) =>
      Array.from({ length: n }, () => ({ par: 4, ...(image ? { image } : {}) }))
    const error = await update({ holes: holes(9, w.mediaB.id) }).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('holes.0.image')
    await expect(update({ holes: holes(10) })).rejects.toThrow()
  })

  it('the website gets the course with yards for each tee', async () => {
    await save([{ blockType: 'holeGrid', style: 'guide', heading: 'Holes', course: w.courseA.id }])
    const page = await loadClubPage(w.clubA.id, 'membership')
    const course = page!.ctx.course(w.courseA.id)
    expect(course?.tees.map((t) => t.name)).toEqual(['White'])
    expect(course?.holes).toHaveLength(9)
    expect(course?.holes[0]).toMatchObject({ number: 1, par: 4, yards: [400] })
    expect(page!.ctx.course(w.courseB.id)).toBeNull()
  })
})

describe('scorecard', () => {
  it("refuses club B's course and printable scorecard", async () => {
    const error = await save([
      {
        blockType: 'scorecard',
        style: 'classic',
        heading: 'Card',
        course: w.courseB.id,
        download: w.docB.id,
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.course', 'layout.0.download']),
    )
  })
})

describe('course status', () => {
  it('every club has one, and the site says when it is out of date', async () => {
    expect(w.statusA.state).toBe('open')
    await save([{ blockType: 'courseStatus', style: 'board', heading: 'Status' }])
    const fresh = await loadClubPage(w.clubA.id, 'membership')
    expect(fresh!.ctx.courseStatus).toMatchObject({ state: 'open', stale: false })

    await w.payload.db.drizzle.execute(
      sql`UPDATE course_status SET updated_at = now() - interval '2 days' WHERE id = ${w.statusA.id}`,
    )
    const old = await loadClubPage(w.clubA.id, 'membership')
    expect(old!.ctx.courseStatus?.stale).toBe(true)
  })

  it("refuses a link to club B's page", async () => {
    const error = await save([
      {
        blockType: 'courseStatus',
        style: 'band',
        statusPage: { type: 'page', page: w.pageB.id },
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('layout.0.statusPage.page')
  })
})
