/**
 * Security audit of site search and its SQL (docs/security/audit-search-sql.md, 22 Oct 2026).
 *
 * Tests marked `it.fails` prove a finding: they assert what SHOULD happen and currently fail,
 * so CI stays green. When a finding is fixed, its test starts passing, `it.fails` then reports
 * it as a failure, and the fix PR changes it to a plain `it`.
 *
 * The plain `it` tests are guards for things the audit checked and found sound.
 */
import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { ensureFreshIndex, rebuildIndex } from '@/search/fresh'
import { searchClub, searchGrouped } from '@/search/query'
import { allowRequest, type Limit } from '@/security/rateLimit'

import { rt } from '../shared/richText'
import { seedWorld, type World } from './helpers/seed'

// Wraps the real index builder so a test can count builds and pause one after it has read the
// club's content (to recreate two searches rebuilding at once).
const builder = vi.hoisted(() => ({
  calls: 0,
  pauseNext: null as null | { built: () => void; release: Promise<void> },
}))
vi.mock('@/search/build', async (importOriginal) => {
  const real = await importOriginal<typeof import('@/search/build')>()
  return {
    ...real,
    buildClubEntries: async (...args: Parameters<typeof real.buildClubEntries>) => {
      builder.calls += 1
      const entries = await real.buildClubEntries(...args)
      const pause = builder.pauseNext
      if (pause) {
        builder.pauseNext = null
        pause.built()
        await pause.release
      }
      return entries
    },
  }
})

type Executor = { execute: (q: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }

let w: World
let payload: Payload
let db: Executor

const daysFromNow = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

const publishPage = (tenant: string, title: string, slug: string, words: string) =>
  payload.create({
    collection: 'pages',
    data: {
      _status: 'published',
      title,
      slug,
      tenant,
      layout: [{ blockType: 'richText', style: 'article', content: rt.doc(rt.p(words)) }],
    } as never,
  })

const indexed = async (tenant: string, title: string) => {
  const { rows } = await db.execute(
    sql`SELECT 1 FROM search_entries WHERE tenant_id = ${tenant} AND title = ${title}`,
  )
  return rows.length > 0
}

beforeAll(async () => {
  w = await seedWorld()
  payload = w.payload
  db = (payload.db as unknown as { drizzle: Executor }).drizzle
})

beforeEach(() => {
  builder.calls = 0
  builder.pauseNext = null
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------- Finding 1 (medium): "Did you mean" suggests words from scheduled news ----------

describe('finding 1: "Did you mean" only uses words a visitor can already see', () => {
  it('never suggests a word that only appears in news scheduled for later', async () => {
    // The club has written, but not yet published, news about a merger.
    await payload.create({
      collection: 'news',
      data: {
        title: 'Merger with Fairhaven agreed',
        status: 'published',
        category: 'club',
        publishedAt: daysFromNow(14),
        tenant: w.clubA.id,
      } as never,
    })
    // The article itself can't be found yet (this part already works)…
    const exact = await searchClub(w.clubA.id, 'fairhaven')
    expect(exact.total).toBe(0)
    // …but a near miss gets the hidden word back as "Did you mean fairhaven".
    const nearMiss = await searchClub(w.clubA.id, 'fairhavn')
    expect(nearMiss.suggestion).toBeNull()
  })
})

// ---------- Finding 2 (medium): one search can make the database read the club's text 8 times ----------

describe('finding 2: a search that finds nothing costs about the same as one that does', () => {
  it('reads the club’s whole text at most once for "Did you mean"', async () => {
    await publishPage(
      w.clubA.id,
      'Practice ground',
      'practice-ground',
      'Range balls by the bucket.',
    )
    await ensureFreshIndex(payload, w.clubA.id)
    const statements: string[] = []
    const dialect = (db as unknown as { dialect: { sqlToQuery: (q: unknown) => { sql: string } } })
      .dialect
    const real = db.execute.bind(db)
    vi.spyOn(db, 'execute').mockImplementation(async (q) => {
      statements.push(dialect.sqlToQuery(q).sql)
      return real(q)
    })
    // Eight made-up words: nothing matches, so every word gets its own "Did you mean" scan.
    await searchGrouped(w.clubA.id, 'qa qb qc qd qe qf qg qh', { perKind: 2, best: true })
    const scans = statements.filter((s) => s.includes('regexp_split_to_table'))
    expect(scans.length).toBeLessThanOrEqual(1)
  })
})

// ---------- Finding 3 (medium): one visitor on IPv6 has billions of rate limits ----------

describe('finding 3: the search rate limit holds for a visitor on IPv6', () => {
  const LIMIT: Limit = { name: 'audit-ipv6', max: 1, windowSeconds: 60 }
  const now = new Date('2026-10-22T10:00:10Z')

  it('counts addresses in the same IPv6 /64 network as one visitor', async () => {
    await db.execute(sql`DELETE FROM rate_limits WHERE key LIKE 'audit-ipv6:%'`)
    // A home or cloud connection is given a whole /64: these are the same visitor.
    expect(await allowRequest(db, LIMIT, '2001:db8:1234:5678::1', now)).toBe(true)
    expect(await allowRequest(db, LIMIT, '2001:db8:1234:5678::2', now)).toBe(false)
  })
})

// ---------- Finding 4 (low): searches arriving together each rebuild the whole index ----------

describe('finding 4: one rebuild after a change, however many searches arrive at once', () => {
  it('five searches at once after an edit rebuild the index once', async () => {
    await publishPage(w.clubA.id, 'Junior section', 'juniors', 'Coaching on Saturday mornings.')
    builder.calls = 0
    await Promise.all(Array.from({ length: 5 }, () => ensureFreshIndex(payload, w.clubA.id)))
    expect(builder.calls).toBe(1)
  })
})

// ---------- Finding 5 (low): a slow rebuild can put back a page that was just unpublished ----------

describe('finding 5: the index never goes back to an older version of the club', () => {
  it('a slower, older rebuild does not put back a page unpublished meanwhile', async () => {
    const page = await publishPage(
      w.clubA.id,
      'Kingfisher notice',
      'kingfisher',
      'Temporary notice to members.',
    )
    await ensureFreshIndex(payload, w.clubA.id)
    expect(await indexed(w.clubA.id, 'Kingfisher notice')).toBe(true)

    // Search 1 starts a rebuild, reads the club's content (page still published), then is slow.
    const { rows } = await db.execute(
      sql`SELECT changes FROM search_state WHERE tenant_id = ${w.clubA.id}`,
    )
    const changesBefore = Number((rows[0] as { changes: number }).changes)
    let built!: () => void
    let release!: () => void
    const hasBuilt = new Promise<void>((r) => (built = r))
    builder.pauseNext = { built, release: new Promise<void>((r) => (release = r)) }
    const slow = rebuildIndex(payload, w.clubA.id, changesBefore)
    await hasBuilt

    // Meanwhile the editor unpublishes the page, and search 2 rebuilds without it.
    await payload.update({ collection: 'pages', id: page.id, data: { _status: 'draft' } })
    await ensureFreshIndex(payload, w.clubA.id)
    expect(await indexed(w.clubA.id, 'Kingfisher notice')).toBe(false)

    // Search 1 finishes last and writes its older copy over the newer one.
    release()
    await slow
    expect(await indexed(w.clubA.id, 'Kingfisher notice')).toBe(false)
  })
})

// ---------- Guards: checked and sound ----------

describe('guards (checked and sound)', () => {
  it('a draft edit to a published page is not searchable until it is published', async () => {
    const page = await publishPage(w.clubA.id, 'Locker rooms', 'lockers', 'Lockers by the bar.')
    await payload.update({
      collection: 'pages',
      id: page.id,
      draft: true,
      data: {
        layout: [
          {
            blockType: 'richText',
            style: 'article',
            content: rt.doc(rt.p('Draft only: quokkaflux refurbishment budget.')),
          },
        ],
      } as never,
    })
    expect((await searchClub(w.clubA.id, 'quokkaflux')).total).toBe(0)
    expect((await searchClub(w.clubA.id, 'quokkaflx')).suggestion).toBeNull()
  })

  it('never suggests a word from another club’s content', async () => {
    await publishPage(w.clubB.id, 'Zephyrine cup', 'zephyrine', 'Club B only: zephyrine.')
    await ensureFreshIndex(payload, w.clubB.id)
    expect((await searchClub(w.clubB.id, 'zephyrin')).total).toBeGreaterThan(0)
    const fromA = await searchClub(w.clubA.id, 'zephyrne')
    expect(fromA.total).toBe(0)
    expect(fromA.suggestion).toBeNull()
  })

  it('SQL-like and unusual input is treated as words, never as SQL', async () => {
    const inputs = [
      "'; DROP TABLE search_entries; --",
      "golf') OR 1=1 --",
      'a:* | !b & (c',
      '½ ² ⅻ ١٢٣ 𝟘 ﬁ',
      '%_\\',
      'x'.repeat(5000),
    ]
    for (const q of inputs) {
      await expect(searchGrouped(w.clubA.id, q, { best: true })).resolves.toBeDefined()
      await expect(searchClub(w.clubA.id, q, { kind: 'page' })).resolves.toBeDefined()
    }
    const { rows } = await db.execute(sql`SELECT count(*)::int AS n FROM search_entries`)
    expect((rows[0] as { n: number }).n).toBeGreaterThan(0)
  })
})
