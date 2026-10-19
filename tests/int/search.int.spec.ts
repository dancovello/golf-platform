import { beforeAll, describe, expect, it } from 'vitest'

import { buildDemoClub, DEMO_SLUG } from '@/demo/demoClub'
import { ensureFreshIndex } from '@/search/fresh'
import { searchClub, searchGrouped } from '@/search/query'

import { rt } from '../shared/richText'
import { seedWorld, type World } from './helpers/seed'

let w: World

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

const titles = async (tenant: string, q: string) =>
  (await searchClub(tenant, q, { limit: 100 })).results.map((r) => r.title)

beforeAll(async () => {
  w = await seedWorld()
  const { payload, clubA } = w
  const tenant = clubA.id

  // A published page showing some words, a team member and a document; a draft page.
  await payload.create({
    collection: 'pages',
    data: {
      _status: 'published',
      title: 'Twilight golf',
      slug: 'twilight-golf',
      tenant,
      layout: [
        {
          blockType: 'richText',
          style: 'article',
          content: rt.doc(rt.p('Play nine holes after 3pm from April to September.')),
        },
        { blockType: 'team', style: 'grid', heading: 'Who to ask', people: [w.staffA.id] },
        { blockType: 'documentList', style: 'grouped', heading: 'Rules', documents: [w.docA.id] },
      ],
    } as never,
  })
  await payload.create({
    collection: 'pages',
    data: { _status: 'draft', title: 'Secret draft plans', slug: 'secret', tenant },
  })
  // A team member on no page: not on the site, so not searchable.
  await payload.create({
    collection: 'staff',
    data: { name: 'Unlisted Ursula', role: 'Bookkeeper', department: 'club', tenant } as never,
  })
  await payload.create({
    collection: 'news',
    data: {
      title: 'Twilight series returns',
      status: 'published',
      category: 'club',
      publishedAt: daysFromNow(-2),
      tenant,
    } as never,
  })
  await payload.create({
    collection: 'news',
    data: {
      title: 'Twilight prices for next year',
      status: 'published',
      category: 'club',
      publishedAt: daysFromNow(10),
      tenant,
    } as never,
  })
  await payload.create({
    collection: 'events',
    data: {
      title: 'Twilight Stableford',
      status: 'published',
      category: 'competition',
      startsAt: daysFromNow(5),
      booking: 'book',
      tenant,
    } as never,
  })
  await payload.create({
    collection: 'events',
    data: {
      title: 'Twilight social (draft)',
      status: 'draft',
      category: 'social',
      startsAt: daysFromNow(6),
      booking: 'book',
      tenant,
    } as never,
  })
})

describe('site search finds what the site shows', () => {
  it('finds published pages, news and upcoming events, grouped by kind', async () => {
    const page = await searchClub(w.clubA.id, 'twilight')
    expect(page.counts).toMatchObject({ event: 1, page: 1, news: 1 })
    expect(page.results.map((r) => r.title)).toEqual(
      expect.arrayContaining(['Twilight golf', 'Twilight series returns', 'Twilight Stableford']),
    )
  })

  it('leaves out drafts, news before its publish date and draft events', async () => {
    const found = await titles(w.clubA.id, 'twilight')
    expect(found).not.toContain('Twilight prices for next year')
    expect(found).not.toContain('Twilight social (draft)')
    expect(await titles(w.clubA.id, 'secret draft')).toEqual([])
  })

  it('finds words inside a page’s blocks', async () => {
    expect(await titles(w.clubA.id, 'nine holes september')).toContain('Twilight golf')
  })

  it('finds a word from its first few letters', async () => {
    expect(await titles(w.clubA.id, 'twil')).toContain('Twilight golf')
  })

  it('tolerates a spelling mistake', async () => {
    expect(await titles(w.clubA.id, 'twilite')).toContain('Twilight Stableford')
  })

  it('finds the team members and documents a published page shows, and links to them', async () => {
    const person = (await searchClub(w.clubA.id, w.staffA.name)).results.find(
      (r) => r.kind === 'person',
    )
    expect(person?.link).toEqual({ kind: 'page', slug: 'twilight-golf' })
    const doc = (await searchClub(w.clubA.id, 'local rules')).results.find(
      (r) => r.kind === 'document',
    )
    expect(doc?.title).toBe('Club A local rules')
    expect(doc?.link).toMatchObject({ kind: 'url' })
  })

  it('does not find a team member who is on no page', async () => {
    expect(await titles(w.clubA.id, 'Unlisted Ursula')).toEqual([])
  })

  it('finds the built-in pages every club has', async () => {
    expect(await titles(w.clubA.id, 'contact')).toContain('Contact')
  })

  it('offers a spelling the club’s content has when nothing is found', async () => {
    const page = await searchClub(w.clubA.id, 'twilght stablefrod')
    // The typo rule may already find it; if not, "Did you mean" must.
    if (page.total === 0) expect(page.suggestion).toBe('twilight stableford')
    const none = await searchClub(w.clubA.id, 'xyzzy')
    expect(none.total).toBe(0)
    expect(none.suggestion).toBeNull()
  })

  it('needs at least two characters', async () => {
    expect((await searchClub(w.clubA.id, 't')).total).toBe(0)
  })

  it('filters by kind and by date', async () => {
    const events = await searchClub(w.clubA.id, 'twilight', { kind: 'event' })
    expect(events.results.map((r) => r.kind)).toEqual(['event'])
    const upcoming = await searchClub(w.clubA.id, 'twilight', { when: 'upcoming' })
    expect(upcoming.results.map((r) => r.title)).toEqual(['Twilight Stableford'])
  })

  it('gives the header panel a best match and up to two of each kind', async () => {
    const grouped = await searchGrouped(w.clubA.id, 'twilight')
    expect(grouped.best).not.toBeNull()
    expect(grouped.groups.every((g) => g.results.length <= 2)).toBe(true)
    const shown = [grouped.best, ...grouped.groups.flatMap((g) => g.results)].map((r) => r?.id)
    expect(new Set(shown).size).toBe(shown.length)
  })
})

describe('the index keeps up with the club’s changes', () => {
  it('finds a new title straight after it is saved, and forgets the old one', async () => {
    const event = await w.payload.create({
      collection: 'events',
      data: {
        title: 'Midsummer mixed foursomes',
        status: 'published',
        category: 'competition',
        startsAt: daysFromNow(20),
        booking: 'book',
        tenant: w.clubA.id,
      } as never,
    })
    expect(await titles(w.clubA.id, 'midsummer')).toContain('Midsummer mixed foursomes')
    await w.payload.update({
      collection: 'events',
      id: event.id,
      data: { title: 'Harvest mixed foursomes' },
    })
    expect(await titles(w.clubA.id, 'midsummer')).toEqual([])
    expect(await titles(w.clubA.id, 'harvest')).toContain('Harvest mixed foursomes')
    await w.payload.delete({ collection: 'events', id: event.id })
    expect(await titles(w.clubA.id, 'harvest')).toEqual([])
  })

  it('only rebuilds when something has changed', async () => {
    await searchClub(w.clubA.id, 'twilight')
    expect(await ensureFreshIndex(w.payload, w.clubA.id)).toBe(false)
  })
})

describe('the website’s database account can use the index', () => {
  it('reads, adds, changes and removes index rows as golf_app', async () => {
    type Client = {
      query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>
      release: () => void
    }
    const pool = (w.payload.db as unknown as { pool: { connect: () => Promise<Client> } }).pool
    const client = await pool.connect()
    await client.query('SET ROLE golf_app')
    try {
      await client.query(`UPDATE search_state SET changes = changes + 1 WHERE tenant_id = $1`, [
        w.clubA.id,
      ])
      await client.query(
        `INSERT INTO search_entries (tenant_id, kind, source_id, title, link)
         VALUES ($1, 'page', $2, 'Role check', '{}'::jsonb)`,
        [w.clubA.id, '00000000-0000-4000-8000-0000000000aa'],
      )
      const { rows } = await client.query(
        `SELECT count(*)::int AS n FROM search_entries
         WHERE tenant_id = $1 AND search @@ to_tsquery('english', 'role')`,
        [w.clubA.id],
      )
      expect(rows[0].n).toBe(1)
      await client.query(`DELETE FROM search_entries WHERE title = 'Role check'`)
    } finally {
      await client.query('RESET ROLE')
      client.release()
    }
  })
})

describe('on a full club site (the demo club)', () => {
  it('finds its pages, people and documents, with a passage from the page', async () => {
    await buildDemoClub(w.payload)
    const { docs } = await w.payload.find({
      collection: 'tenants',
      where: { slug: { equals: DEMO_SLUG } },
      depth: 0,
    })
    const demo = String(docs[0]!.id)
    const membership = await searchClub(demo, 'membership')
    expect(membership.counts.page).toBeGreaterThan(0)
    expect(membership.counts.document).toBeGreaterThan(0)
    const page = membership.results.find((r) => r.kind === 'page')
    expect(page?.excerpt?.toLowerCase()).toContain('membership')
    expect((await searchClub(demo, 'secretary')).counts.person).toBeGreaterThan(0)
    expect((await searchClub(demo, 'memebrship')).suggestion).toBe('membership')
  }, 120_000)
})
