import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload } from 'payload'

import type { SiteLink } from '@/site/loadClub'
import { siteToday } from '@/site/today'

import { SEARCH_KINDS, type SearchDetails, type SearchKind } from './build'
import { ensureFreshIndex } from './fresh'
import { MAX_QUERY, MIN_QUERY, passage, searchWords, tidyQuery } from './words'

export { MAX_QUERY, MIN_QUERY }

export const WHEN_OPTIONS = ['upcoming', 'past', 'older'] as const
export type SearchWhen = (typeof WHEN_OPTIONS)[number]
export type SearchSort = 'best' | 'newest'

export type SearchResult = {
  kind: SearchKind
  id: string
  title: string
  eyebrow: string | null
  excerpt: string | null
  link: SiteLink
  details: SearchDetails
  date: string | null
}

export type SearchCounts = Record<SearchKind, number>

// Results whose title is this close to the search count as matches even when spelt
// differently ("twilite" finds "Twilight"). 0 = nothing alike, 1 = the same. Only for searches
// of four letters or more: shorter ones look like too many words.
const TYPO_MATCH = 0.5
const TYPO_MIN_LENGTH = 4
// Words in the club's own content this close to a searched word are offered as "Did you mean".
const SUGGEST_MATCH = 0.4

type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }

const connection = async (tenantID: string): Promise<Executor> => {
  const payload = await getPayload({ config })
  await ensureFreshIndex(payload, tenantID)
  return (payload.db as unknown as { drizzle: Executor }).drizzle
}

/** What a search matches, always within one club and only what the site shows today. */
const matching = (tenantID: string, q: string, words: string[], when: SearchWhen | null) => {
  const now = siteToday().toISOString()
  // Each word may be the start of a longer one ("memb" finds "membership"). Words are letters
  // and numbers only (searchWords), so they are safe inside a text-search query.
  const prefix = words.map((w) => `${w}:*`).join(' & ')
  const yearAgo = new Date(new Date(now).getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
  const whenClause =
    when === 'upcoming'
      ? sql`AND date > ${now}::timestamptz`
      : when === 'past'
        ? sql`AND date <= ${now}::timestamptz AND date > ${yearAgo}::timestamptz`
        : when === 'older'
          ? sql`AND date <= ${yearAgo}::timestamptz`
          : sql``
  const typo =
    q.length >= TYPO_MIN_LENGTH ? sql`OR word_similarity(${q}, title) >= ${TYPO_MATCH}` : sql``
  return sql`
    SELECT kind, source_id, title, eyebrow, excerpt, body, link, details, date,
      ts_rank(search, to_tsquery('english', ${prefix})) + word_similarity(${q}, title) * 0.5 AS rank
    FROM search_entries
    WHERE tenant_id = ${tenantID}
      AND (visible_from IS NULL OR visible_from <= ${now}::timestamptz)
      AND (visible_until IS NULL OR visible_until > ${now}::timestamptz)
      AND (search @@ to_tsquery('english', ${prefix}) ${typo})
      ${whenClause}`
}

/** The columns a result row needs (a page's text only to pick its passage, see toResult). */
const SHOWN = sql`kind, source_id, title, eyebrow, link, details, date, rank,
  CASE WHEN kind = 'page' THEN body END AS body, excerpt`

type Row = {
  kind: SearchKind
  body?: string | null
  source_id: string
  title: string
  eyebrow: string | null
  excerpt: string | null
  link: SiteLink
  details: SearchDetails | null
  date: string | Date | null
}

const toResult = (r: Row, words: string[]): SearchResult => ({
  kind: r.kind,
  id: String(r.source_id),
  title: r.title,
  eyebrow: r.eyebrow,
  excerpt: (r.kind === 'page' && passage(r.body ?? null, words)) || r.excerpt,
  link: r.link,
  details: r.details ?? {},
  date: r.date ? new Date(r.date).toISOString() : null,
})

const emptyCounts = (): SearchCounts =>
  Object.fromEntries(SEARCH_KINDS.map((k) => [k, 0])) as SearchCounts

/** How many results of each kind a search has. */
const countKinds = async (db: Executor, matched: ReturnType<typeof sql>) => {
  const { rows } = await db.execute(
    sql`SELECT kind, count(*)::int AS n FROM (${matched}) m GROUP BY kind`,
  )
  const counts = emptyCounts()
  for (const row of rows as { kind: SearchKind; n: number }[]) {
    if (row.kind in counts) counts[row.kind] = row.n
  }
  return counts
}

/** "Did you mean …": each searched word swapped for the closest word in the club's content. */
const suggestion = async (db: Executor, tenantID: string, words: string[]) => {
  let changed = false
  const better: string[] = []
  for (const word of words) {
    const { rows } = await db.execute(sql`
      SELECT word, similarity(word, ${word}) AS score FROM (
        SELECT DISTINCT lower(w) AS word
        FROM search_entries,
          regexp_split_to_table(
            title || ' ' || coalesce(excerpt, '') || ' ' || coalesce(body, ''), '[^[:alnum:]]+'
          ) AS w
        WHERE tenant_id = ${tenantID} AND length(w) > 2
      ) words
      WHERE similarity(word, ${word}) >= ${SUGGEST_MATCH}
      ORDER BY score DESC, word
      LIMIT 1`)
    const found = (rows[0] as { word?: string } | undefined)?.word
    if (found && found !== word) changed = true
    better.push(found ?? word)
  }
  return changed ? better.join(' ') : null
}

export type SearchPage = {
  query: string
  results: SearchResult[]
  /** Results of each kind, for the tabs (whatever kind is picked). */
  counts: SearchCounts
  total: number
  /** Only when nothing was found: a spelling the club's content does have. */
  suggestion: string | null
}

/**
 * The results page: one kind, or every kind (best first unless sorted by date). Every query
 * names the club first; another club's content can't be returned.
 */
export const searchClub = async (
  tenantID: string,
  rawQuery: string,
  options: {
    kind?: SearchKind | null
    when?: SearchWhen | null
    sort?: SearchSort
    limit?: number
    offset?: number
  } = {},
): Promise<SearchPage> => {
  const query = tidyQuery(rawQuery)
  const words = searchWords(query)
  const none: SearchPage = { query, results: [], counts: emptyCounts(), total: 0, suggestion: null }
  if (query.length < MIN_QUERY || words.length === 0) return none

  const db = await connection(tenantID)
  const matched = matching(tenantID, query, words, options.when ?? null)
  const counts = await countKinds(db, matched)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return { ...none, suggestion: await suggestion(db, tenantID, words) }

  const kind = options.kind && SEARCH_KINDS.includes(options.kind) ? options.kind : null
  const order =
    options.sort === 'newest'
      ? sql`ORDER BY date DESC NULLS LAST, rank DESC, title`
      : sql`ORDER BY rank DESC, title`
  const { rows } = await db.execute(sql`
    SELECT ${SHOWN} FROM (${matched}) m
    ${kind ? sql`WHERE kind = ${kind}` : sql``}
    ${order}
    LIMIT ${Math.min(Math.max(options.limit ?? 20, 1), 100)}
    OFFSET ${Math.max(options.offset ?? 0, 0)}`)
  return {
    query,
    results: (rows as Row[]).map((r) => toResult(r, words)),
    counts,
    total,
    suggestion: null,
  }
}

/**
 * The header panel while typing (spec §3): the best match, then up to `perKind` of each kind
 * (best first), with how many there are of each.
 */
export const searchGrouped = async (
  tenantID: string,
  rawQuery: string,
  perKind = 2,
): Promise<{
  query: string
  best: SearchResult | null
  groups: { kind: SearchKind; results: SearchResult[] }[]
  counts: SearchCounts
  total: number
  suggestion: string | null
}> => {
  const query = tidyQuery(rawQuery)
  const words = searchWords(query)
  const empty = { query, best: null, groups: [], counts: emptyCounts(), total: 0, suggestion: null }
  if (query.length < MIN_QUERY || words.length === 0) return empty

  const db = await connection(tenantID)
  const matched = matching(tenantID, query, words, null)
  const counts = await countKinds(db, matched)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return { ...empty, suggestion: await suggestion(db, tenantID, words) }

  const { rows } = await db.execute(sql`
    SELECT ${SHOWN}, place, overall FROM (
      SELECT m.*, row_number() OVER (PARTITION BY kind ORDER BY rank DESC, title) AS place,
        row_number() OVER (ORDER BY rank DESC, title) AS overall
      FROM (${matched}) m
    ) ranked
    WHERE place <= ${perKind + 1} OR overall = 1
    ORDER BY rank DESC, title`)
  const all = rows as (Row & { overall: number | string })[]
  const bestRow = all.find((r) => Number(r.overall) === 1) ?? null
  const best = bestRow ? toResult(bestRow, words) : null
  const groups = SEARCH_KINDS.map((kind) => ({
    kind,
    results: all
      .filter(
        (r) =>
          r.kind === kind && !(best && r.kind === best.kind && String(r.source_id) === best.id),
      )
      .slice(0, perKind)
      .map((r) => toResult(r, words)),
  })).filter((g) => g.results.length > 0)
  return { query, best, groups, counts, total, suggestion: null }
}
