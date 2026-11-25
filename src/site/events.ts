import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import { EVENT_CATEGORIES, EVENT_ENTRANTS, eventCategoryLabel } from '@/collections/eventCategories'
import {
  columnHeading,
  resultColumns,
  type ResultRow,
  richTextHasText,
} from '@/collections/eventResultOptions'
import { builtInLink, isSafeURL, linksToPage } from '@/fields/link'

import { loadClubMedia, type SiteMedia } from './blocks/media'
import {
  type BlockContext,
  type BlockData,
  blockContextFrom,
  loadBlockData,
  loadClubDocuments,
} from './blocks/resolve'
import { PUBLISHED } from './published'
import type { SiteLink } from './loadClub'
import { siteToday } from './today'
import { ukEndOfDay, ukStartOfDay } from './ukTime'
import { clubCached } from './cache'
import { idOf } from '@/blocks/types'

/** An event as cards, rows and the featured panel show it. */
export type SiteEvent = {
  id: string
  /** The event's own page is /events/<slug> (24 Nov 2026). Null only before its first save. */
  slug: string | null
  title: string
  category: string
  categoryLabel: string
  startsAt: string
  /** A date only: no start time is shown, and the event stays up until its day ends. */
  noStartTime: boolean
  venue: string | null
  timeNote: string | null
  summary: string | null
  image: SiteMedia | null
  price: string | null
  memberPrice: string | null
  booking: 'book' | 'enter' | 'enquire' | 'soldOut'
  /** Where Book / Enter / Enquire goes; null when sold out or not set. */
  link: SiteLink | null
  capacity: number | null
  placesLeft: number | null
  featured: boolean
  /** Competition details (G3); all optional. */
  entrants: string[]
  eligibility: string | null
  format: string | null
  entriesOpen: string | null
  entriesClose: string | null
  ballot: boolean
  /** The results: a document, page or web address, once the club adds them. */
  results: SiteLink | null
  /** Results built into the event's own page (24 Nov 2026). */
  hasResults: boolean
}

/** The archive shows this many at first, and this many more each time. */
export const EVENTS_STEP = 6

type EventDoc = {
  id: string | number
  slug?: string | null
  title: string
  category: string
  startsAt: string
  noStartTime?: boolean | null
  venue?: string | null
  timeNote?: string | null
  summary?: string | null
  image?: unknown
  price?: string | null
  memberPrice?: string | null
  booking: 'book' | 'enter' | 'enquire' | 'soldOut'
  link?: LinkDoc | null
  capacity?: number | null
  placesLeft?: number | null
  featured?: boolean | null
  entrants?: string[] | null
  eligibility?: string | null
  format?: string | null
  entriesOpen?: string | null
  entriesClose?: string | null
  ballot?: boolean | null
  results?: LinkDoc | null
  hasResults?: boolean | null
}

type LinkDoc = {
  type?: string | null
  page?: unknown
  url?: string | null
  builtIn?: unknown
  document?: unknown
}

const ENTRANT_VALUES: string[] = EVENT_ENTRANTS.map((e) => e.value)

/** A known "who can enter" value, or null (the archive's ?for= and the Events block). */
export const knownEntrant = (value: unknown) =>
  typeof value === 'string' && ENTRANT_VALUES.includes(value) ? value : null

/** Published and not yet started (events with no set time: until their day ends). */
const upcoming = (tenantID: string, category?: string | null, entrant?: string | null): Where => ({
  and: [
    { tenant: { equals: tenantID } },
    { status: { equals: 'published' } },
    {
      or: [
        { startsAt: { greater_than: siteToday().toISOString() } },
        {
          and: [
            { noStartTime: { equals: true } },
            { startsAt: { greater_than_equal: ukStartOfDay(siteToday()).toISOString() } },
          ],
        },
      ],
    },
    ...(category ? [{ category: { equals: category } }] : []),
    ...(entrant ? [{ entrants: { in: [entrant] } }] : []),
  ],
})

const toEvents = async (tenantID: string, docs: EventDoc[]): Promise<SiteEvent[]> => {
  const payload = await getPayload({ config })
  const photoIDs = docs.map((d) => idOf(d.image)).filter((id): id is string => Boolean(id))
  const links = docs.flatMap((d) => [d.link, d.results])
  const pageIDs = [
    ...new Set(
      links
        .map((l) => (linksToPage(l?.type) ? idOf(l?.page) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const documentIDs = [
    ...new Set(
      docs
        .map((d) => (d.results?.type === 'document' ? idOf(d.results.document) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const [photos, documents, pages] = await Promise.all([
    loadClubMedia(payload, tenantID, photoIDs),
    loadClubDocuments(payload, tenantID, documentIDs),
    pageIDs.length === 0
      ? Promise.resolve(new Map<string, string>())
      : payload
          .find({
            collection: 'pages',
            where: { and: [{ id: { in: pageIDs } }, { tenant: { equals: tenantID } }, PUBLISHED] },
            select: { slug: true },
            limit: pageIDs.length,
            depth: 0,
            overrideAccess: true,
          })
          .then(({ docs: found }) => new Map(found.map((p) => [String(p.id), String(p.slug)]))),
  ])
  /** A link to the club's own page, built-in page, document or a safe web address. */
  const toLink = (l: LinkDoc | null | undefined): SiteLink | null => {
    if (!l) return null
    if (l.type === 'url') return isSafeURL(l.url) ? { kind: 'url', href: l.url.trim() } : null
    if (l.type === 'builtIn') return builtInLink(l.builtIn)
    if (l.type === 'document') {
      const doc = documents.get(idOf(l.document) ?? '')
      return doc ? { kind: 'url', href: doc.url, file: true } : null
    }
    const slug = pages.get(idOf(l.page) ?? '')
    return slug ? { kind: 'page', slug } : null
  }
  return docs.map((d) => {
    const image = photos.get(idOf(d.image) ?? '') ?? null
    const slug = d.slug?.trim() || null
    const link = d.booking !== 'soldOut' ? bookingLink(d.booking, toLink(d.link), slug) : null
    return {
      id: String(d.id),
      slug,
      title: d.title,
      category: d.category,
      categoryLabel: eventCategoryLabel(d.category),
      startsAt: d.startsAt,
      noStartTime: Boolean(d.noStartTime),
      venue: d.venue?.trim() || null,
      timeNote: d.timeNote?.trim() || null,
      summary: d.summary?.trim() || null,
      image: image?.mimeType.startsWith('image/') ? image : null,
      price: d.price?.trim() || null,
      memberPrice: d.memberPrice?.trim() || null,
      booking: d.booking,
      link,
      capacity: d.capacity ?? null,
      placesLeft: d.placesLeft ?? null,
      featured: Boolean(d.featured),
      entrants: (d.entrants ?? []).filter((e) => ENTRANT_VALUES.includes(e)),
      eligibility: d.eligibility?.trim() || null,
      format: d.format?.trim() || null,
      entriesOpen: d.entriesOpen ?? null,
      entriesClose: d.entriesClose ?? null,
      ballot: Boolean(d.ballot),
      results: toLink(d.results),
      hasResults: Boolean(d.hasResults),
    }
  })
}

/**
 * Enquire goes to the club's contact form with the topic set to Events and the message started
 * with the event's name and date (24 Nov 2026), unless the club pointed it somewhere else. Only
 * the event's address goes in the link, never anything about the visitor.
 */
export const bookingLink = (
  booking: SiteEvent['booking'],
  link: SiteLink | null,
  slug: string | null,
): SiteLink | null => {
  const toContact = !link || (link.kind === 'page' && link.slug === 'contact')
  if (booking !== 'enquire' || !toContact || !slug) return link
  return { kind: 'page', slug: `contact?about=events&event=${encodeURIComponent(slug)}` }
}

/** One club's events. The club is always added to the query here, so no caller can forget it. */
const find = async (tenantID: string, where: Where, limit: number) => {
  const payload = await getPayload({ config })
  return payload.find({
    collection: 'events',
    where: { and: [{ tenant: { equals: tenantID } }, where] },
    sort: 'startsAt',
    limit,
    depth: 0,
    overrideAccess: true,
  })
}

/** Every upcoming event, soonest first, with its write-up (site search: src/search/build.ts). */
export const clubEvents = async (tenantID: string): Promise<(SiteEvent & { body: unknown })[]> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'events',
    where: upcoming(tenantID),
    sort: 'startsAt',
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  const events = await toEvents(tenantID, docs as unknown as EventDoc[])
  return events.map((e, i) => ({ ...e, body: (docs[i] as { body?: unknown }).body ?? null }))
}

/** The next events, soonest first, optionally in one category (Events blocks). */
const upcomingEventsFresh = async (
  tenantID: string,
  limit: number,
  category?: string | null,
  entrant?: string | null,
): Promise<SiteEvent[]> => {
  const { docs } = await find(tenantID, upcoming(tenantID, category, knownEntrant(entrant)), limit)
  return toEvents(tenantID, docs as EventDoc[])
}

/** The featured event (the soonest one marked featured, or simply the next one). */
const featuredEventFresh = async (tenantID: string): Promise<SiteEvent | null> => {
  const marked = await find(
    tenantID,
    { and: [upcoming(tenantID), { featured: { equals: true } }] },
    1,
  )
  const docs =
    marked.docs.length > 0 ? marked.docs : (await find(tenantID, upcoming(tenantID), 1)).docs
  return (await toEvents(tenantID, docs as EventDoc[]))[0] ?? null
}

/**
 * The archive: upcoming events in one category (or all), the first `show` of them.
 * `include`: one more of the club's events shown whatever its status or date, for the admin's
 * live preview (the caller checks who may see it: src/site/livePreviewAccess.ts).
 */
const eventsArchiveFresh = async (
  tenantID: string,
  {
    category,
    entrant = null,
    show,
    include = null,
  }: {
    category: string | null
    entrant?: string | null
    show: number
    include?: string | null
  },
) => {
  const known = EVENT_CATEGORIES.some((c) => c.value === category) ? category : null
  // "Who can enter" only narrows competitions.
  const forWho = known === 'competition' ? knownEntrant(entrant) : null
  const count = Math.min(Math.max(EVENTS_STEP, show), 200)
  const result = await find(tenantID, upcoming(tenantID, known, forWho), count)
  // The event being previewed comes first, so the editor always sees it.
  const extra = include ? (await find(tenantID, { id: { equals: include } }, 1)).docs : []
  const docs = [...extra, ...result.docs.filter((d) => !extra.some((e) => e.id === d.id))]
  return {
    category: known,
    entrant: forWho,
    events: await toEvents(tenantID, docs as EventDoc[]),
    total: result.totalDocs,
    show: count,
  }
}

// Cached per club (src/site/cache.ts). "Upcoming" depends on today's date: at most 5 minutes.
export const upcomingEvents = clubCached('upcomingEvents', upcomingEventsFresh, { today: true })
export const featuredEvent = clubCached('featuredEvent', featuredEventFresh, { today: true })
const cachedArchive = clubCached(
  'eventsArchive',
  (tenantID: string, category: string | null, entrant: string | null, show: number) =>
    eventsArchiveFresh(tenantID, { category, entrant, show }),
  { today: true },
)
/** The archive. With `include` (the live preview's draft event) it never goes through the cache. */
export const eventsArchive = (
  tenantID: string,
  options: {
    category: string | null
    entrant?: string | null
    show: number
    include?: string | null
  },
) =>
  options.include
    ? eventsArchiveFresh(tenantID, options)
    : cachedArchive(tenantID, options.category, options.entrant ?? null, options.show)

/** How many past results the events page lists. */
export const RESULTS_LIMIT = 24

/**
 * Past events with results, newest first (G3): published events that have started and have
 * results built in (24 Nov 2026) or a results document, page or web address.
 */
const clubResultsFresh = async (tenantID: string): Promise<SiteEvent[]> => {
  const { docs } = await getPayload({ config }).then((payload) =>
    payload.find({
      collection: 'events',
      where: {
        and: [
          { tenant: { equals: tenantID } },
          { status: { equals: 'published' } },
          { startsAt: { less_than_equal: siteToday().toISOString() } },
          {
            or: [
              { hasResults: { equals: true } },
              { 'results.page': { exists: true } },
              { 'results.document': { exists: true } },
              { 'results.url': { exists: true } },
              { 'results.builtIn': { exists: true } },
            ],
          },
        ],
      },
      sort: '-startsAt',
      limit: RESULTS_LIMIT,
      depth: 0,
      overrideAccess: true,
    }),
  )
  const events = await toEvents(tenantID, docs as unknown as EventDoc[])
  // A results link to a page or file that has since gone is left out.
  return events.filter((e) => e.hasResults || e.results !== null)
}
export const clubResults = clubCached('clubResults', clubResultsFresh, { today: true })

/** One results table as the page draws it: headings and rows in the club's own order. */
export type SiteResultTable = {
  title: string
  note: string | null
  who: string
  score: string
  keys: (keyof ResultRow)[]
  headings: string[]
  rows: Record<keyof ResultRow, string>[]
}

export type SiteMatch = {
  round: string | null
  sideA: string
  sideB: string
  result: string | null
  winner: 'a' | 'b' | 'halved' | null
}

export type SitePrize = { prize: string; winner: string; detail: string | null }

/** Results built into an event (24 Nov 2026). Null when the club has added none. */
export type SiteResults = {
  report: unknown
  tables: SiteResultTable[]
  matches: SiteMatch[]
  prizes: SitePrize[]
}

type ResultsDoc = {
  resultsReport?: unknown
  resultTables?:
    | {
        title?: string | null
        note?: string | null
        who?: string | null
        score?: string | null
        columns?: string[] | null
        rounds?: string | null
        rows?: ResultRow[] | null
      }[]
    | null
  matches?:
    | {
        round?: string | null
        sideA?: string | null
        sideB?: string | null
        result?: string | null
        winner?: string | null
      }[]
    | null
  prizes?: { prize?: string | null; winner?: string | null; detail?: string | null }[] | null
}

const text = (v: string | null | undefined) => v?.trim() || ''

/** The results as the page shows them: empty tables, matches and prizes are left out. */
export const toResults = (doc: ResultsDoc): SiteResults | null => {
  const tables = (doc.resultTables ?? [])
    .filter((t) => (t.rows?.length ?? 0) > 0)
    .map((t) => {
      const keys = resultColumns(t)
      return {
        title: text(t.title) || 'Results',
        note: text(t.note) || null,
        who: t.who ?? 'individuals',
        score: t.score ?? 'score',
        keys,
        headings: keys.map((k) => columnHeading(k, t)),
        rows: (t.rows ?? []).map((r, i) => {
          const row = Object.fromEntries(keys.map((k) => [k, text(r[k])])) as Record<
            keyof ResultRow,
            string
          >
          // Positions fill themselves in (1, 2, 3 …) unless the club typed its own ("=2").
          row.position = row.position || String(i + 1)
          return row
        }),
      }
    })
  const matches = (doc.matches ?? [])
    .filter((m) => text(m.sideA) && text(m.sideB))
    .map((m): SiteMatch => ({
      round: text(m.round) || null,
      sideA: text(m.sideA),
      sideB: text(m.sideB),
      result: text(m.result) || null,
      winner: m.winner === 'a' || m.winner === 'b' || m.winner === 'halved' ? m.winner : null,
    }))
  const prizes = (doc.prizes ?? [])
    .filter((p) => text(p.prize) && text(p.winner))
    .map((p) => ({ prize: text(p.prize), winner: text(p.winner), detail: text(p.detail) || null }))
  const report = richTextHasText(doc.resultsReport) ? doc.resultsReport : null
  return tables.length || matches.length || prizes.length || report
    ? { report, tables, matches, prizes }
    : null
}

/** An event's own page (24 Nov 2026): the event, its write-up, and what's on next. */
export type SiteEventPage = SiteEvent & {
  body: unknown
  /** Results built in; shown once the event has taken place. */
  builtInResults: SiteResults | null
  ctx: BlockContext
  /** The event has started (or, with no set time, its day has ended). */
  past: boolean
  /** Up to three other upcoming events. */
  more: SiteEvent[]
}

/**
 * What's cached for an event's page: plain data only. The cache stores JSON, so the photo and
 * link lookups (`ctx`) are made from `data` after it's read, never cached themselves (Sentry
 * GOLF-PLATFORM-H, 25 Nov 2026).
 */
type EventPageData = Omit<SiteEventPage, 'ctx'> & { data: BlockData }

/** When an event drops off the upcoming lists: its start, or with no set time, its day's end. */
export const eventEnds = (e: Pick<SiteEvent, 'startsAt' | 'noStartTime'>) =>
  e.noStartTime ? ukEndOfDay(new Date(e.startsAt)) : new Date(e.startsAt)

/**
 * One event by its address. Published events keep their page after the day, so links shared
 * before it still work. `unpublished`: the admin's live preview for the club's own editors (the
 * caller checks who may see it: src/site/livePreviewAccess.ts).
 */
const loadEventPageFresh = async (
  tenantID: string,
  slug: string,
  { unpublished = false }: { unpublished?: boolean } = {},
): Promise<EventPageData | null> => {
  const { docs } = await find(
    tenantID,
    {
      and: [
        { slug: { equals: slug } },
        ...(unpublished ? [] : [{ status: { equals: 'published' } } as Where]),
      ],
    },
    1,
  )
  const doc = docs[0] as (EventDoc & ResultsDoc & { body?: unknown }) | undefined
  if (!doc) return null
  const payload = await getPayload({ config })
  const [[event], data, upcoming] = await Promise.all([
    toEvents(tenantID, [doc]),
    // The write-up and the results report are drawn like Text blocks, so their photos and links
    // are checked the same way.
    loadBlockData(payload, tenantID, [
      { blockType: 'richText', content: doc.body },
      { blockType: 'richText', content: doc.resultsReport },
    ]),
    upcomingEvents(tenantID, 4),
  ])
  return {
    ...event,
    body: doc.body ?? null,
    builtInResults: toResults(doc),
    data,
    past: eventEnds(event) <= siteToday(),
    more: upcoming.filter((e) => e.id !== event.id).slice(0, 3),
  }
}

const publishedEventPage = clubCached(
  'eventPage',
  (tenantID: string, slug: string) => loadEventPageFresh(tenantID, slug),
  { today: true },
)
/** One event's page. Unpublished ones (the live preview) never go through the cache. */
export const loadEventPage = async (
  tenantID: string,
  slug: string,
  { unpublished = false }: { unpublished?: boolean } = {},
): Promise<SiteEventPage | null> => {
  const page = unpublished
    ? await loadEventPageFresh(tenantID, slug, { unpublished })
    : await publishedEventPage(tenantID, slug)
  if (!page) return null
  const { data, ...rest } = page
  return { ...rest, ctx: blockContextFrom(data) }
}

/** Every published event's address and when it last changed (the club's sitemap). */
export const eventsForSitemap = async (tenantID: string) => {
  const { docs } = await find(
    tenantID,
    { and: [{ status: { equals: 'published' } }, { slug: { exists: true } }] },
    1000,
  )
  return docs.map((d) => ({ slug: String(d.slug), updatedAt: d.updatedAt ?? null }))
}
