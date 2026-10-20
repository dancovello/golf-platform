import config from '@payload-config'
import { sql } from '@payloadcms/db-postgres'
import { getPayload, type Payload } from 'payload'

import { STATUS_STATES, STATUS_STALE_HOURS } from '@/collections/courseStatusStates'
import { idOf } from '@/blocks/types'
import { initials } from '@/site/blocks/teamShared'
import { siteHref } from '@/site/components/links'
import { clubEvents } from '@/site/events'
import type { ClubSite, SiteLink } from '@/site/loadClub'
import { PUBLISHED } from '@/site/published'
import { isCurrentSeason } from '@/site/blocks/seasons'
import { siteToday } from '@/site/today'

import type { SearchDetails } from './build'
import { ensureFreshIndex } from './fresh'
import { askedFor, GENERIC } from './intents'
import { searchWords } from './words'

/**
 * Smart answers (spec §4) and the panel's quick access. Every fact comes from a structured field
 * every club has (course status, opening hours, rate tables, team, events), never from
 * generated text, and every card says where it came from. A search that fits more than one
 * kind of answer gets none, just the normal results. Nothing here depends on a club's wording.
 */

import type { AnswerKind } from './intents'

export type { AnswerKind }

export type Answer = {
  kind: AnswerKind
  /** The small line above the title, e.g. a person's role. */
  eyebrow: string
  title: string
  /** Where it came from and when it was updated. */
  source: string | null
  /** A sentence from the club, e.g. the greenkeeper's note on the course status. */
  note?: string | null
  facts: { value: string; label: string }[]
  actions: { label: string; href: string; primary: boolean; newTab?: boolean }[]
  /** People: their photo, or initials when there's none. */
  person?: {
    initials: string
    image: { url: string; srcSet: string | null; position: string } | null
  }
  /** Course status: open, restricted or closed (shown with words, never colour alone). */
  tone?: 'open' | 'restricted' | 'closed'
  /** People on the results page only: their email in two halves (ProtectedEmail). */
  email?: { user: string; domain: string } | null
}

// ---------- Facts from the club's published pages (cached until the club changes something) ----------

type RateTable = {
  heading: string
  columns: string[]
  rows: {
    tab: string | null
    /** The price list's season name, when a tab has several. */
    section: string | null
    season: { startMonth?: string | null; endMonth?: string | null }
    label: string
    subLabel: string | null
    prices: string[]
  }[]
  page: { title: string; parent: string | null; link: SiteLink; updatedAt: string }
}

type PageFacts = {
  rateTables: RateTable[]
  /** A page showing the Course Status block, if there is one. */
  statusPage: SiteLink | null
}

const factsCache = new Map<string, { changes: number; facts: PageFacts }>()

type Executor = { execute: (query: ReturnType<typeof sql>) => Promise<{ rows: unknown[] }> }

const pageFacts = async (payload: Payload, tenantID: string): Promise<PageFacts> => {
  await ensureFreshIndex(payload, tenantID)
  const db = (payload.db as unknown as { drizzle: Executor }).drizzle
  const { rows } = await db.execute(
    sql`SELECT changes FROM search_state WHERE tenant_id = ${tenantID}`,
  )
  const changes = Number((rows[0] as { changes?: number } | undefined)?.changes ?? 0)
  const cached = factsCache.get(tenantID)
  if (cached && cached.changes === changes) return cached.facts

  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ tenant: { equals: tenantID } }, PUBLISHED] },
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  type Block = Record<string, unknown> & { blockType?: string }
  type PageDoc = {
    id: string
    title: string
    slug?: string
    parent?: unknown
    updatedAt: string
    layout?: Block[]
  }
  const pages = (docs as unknown as PageDoc[]).filter((p) => p.slug)
  const titles = new Map(pages.map((p) => [String(p.id), p.title]))
  const facts: PageFacts = { rateTables: [], statusPage: null }
  for (const page of pages) {
    const link: SiteLink = { kind: 'page', slug: String(page.slug) }
    for (const block of page.layout ?? []) {
      if (block.blockType === 'courseStatus' && !facts.statusPage) facts.statusPage = link
      if (block.blockType !== 'rateTable') continue
      const tabs = (block.tabs as { label?: string; sections?: unknown[] }[] | undefined) ?? []
      const table: RateTable = {
        heading: String(block.heading ?? ''),
        columns: ((block.columns as { label?: string }[] | undefined) ?? []).map((c) =>
          String(c.label ?? ''),
        ),
        rows: [],
        page: {
          title: page.title,
          parent: titles.get(idOf(page.parent) ?? '') ?? null,
          link,
          updatedAt: page.updatedAt,
        },
      }
      for (const tab of tabs) {
        type Section = {
          name?: string | null
          startMonth?: string | null
          endMonth?: string | null
          rows?: Record<string, unknown>[]
        }
        const sections = (tab.sections as Section[] | undefined) ?? []
        for (const section of sections) {
          for (const row of section.rows ?? []) {
            table.rows.push({
              tab: tabs.length > 1 ? String(tab.label ?? '') : null,
              section: sections.length > 1 ? section.name?.trim() || null : null,
              season: { startMonth: section.startMonth, endMonth: section.endMonth },
              label: String(row.label ?? ''),
              subLabel:
                typeof row.subLabel === 'string' && row.subLabel.trim() ? row.subLabel : null,
              prices: [row.price1, row.price2, row.price3, row.price4].map((p) =>
                typeof p === 'string' ? p.trim() : '',
              ),
            })
          }
        }
      }
      if (table.rows.length > 0) facts.rateTables.push(table)
    }
  }
  // A club's main prices page (top level, e.g. "Visitors & green fees") before the pages under it.
  facts.rateTables.sort((a, b) => Number(Boolean(a.page.parent)) - Number(Boolean(b.page.parent)))
  factsCache.set(tenantID, { changes, facts })
  return facts
}

// ---------- Formatting ----------

const UK = 'Europe/London'
const dayMonth = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: UK })
const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: UK })
const pagePath = (p: { title: string; parent: string | null }) =>
  p.parent ? `${p.parent} › ${p.title}` : p.title

/** A price as a number, for "from £45" (null if it isn't one, e.g. "On request"). */
const amount = (price: string) => {
  const m = /(\d+(?:\.\d{1,2})?)/.exec(price.replace(/,/g, ''))
  return m ? Number(m[1]) : null
}

// ---------- Building each kind of answer ----------

const feesAnswer = (facts: PageFacts, words: string[], base: string): Answer | null => {
  const specific = words.filter((w) => w.length >= 3 && !GENERIC.has(w))
  const matches = (text: string) =>
    specific.length > 0 && specific.every((w) => new RegExp(`(^|[^\\p{L}])${w}`, 'iu').test(text))
  // Rows named by the search ("twilight"), else the first price list.
  let table = facts.rateTables.find((t) => t.rows.some((r) => matches(`${r.tab ?? ''} ${r.label}`)))
  let rows = table?.rows.filter((r) => matches(`${r.tab ?? ''} ${r.label}`)) ?? []
  if (!table) {
    if (specific.length > 0) return null
    table = facts.rateTables[0]
    rows = table?.rows ?? []
  }
  if (!table || rows.length === 0) return null
  // Only this season's prices, when the price lists say which months they cover.
  const today = siteToday()
  const current = rows.filter((r) => isCurrentSeason(r.season, today))
  if (current.length > 0) rows = current
  return {
    kind: 'fees',
    eyebrow: 'Top answer',
    title: table.heading || table.page.title,
    source: `From ${pagePath(table.page)}, updated ${dayMonth(table.page.updatedAt)}`,
    facts: rows.slice(0, 4).flatMap((r) => {
      const at = r.prices.findIndex(Boolean)
      if (at < 0) return []
      const column = table.columns.length > 1 ? table.columns[at] : null
      const season = current.length > 0 ? null : r.section
      return [
        {
          value: r.prices[at],
          label: [r.tab, season, r.label, column].filter(Boolean).join(' · '),
        },
      ]
    }),
    actions: [{ label: 'All prices', href: siteHref(base, table.page.link), primary: false }],
  }
}

type StatusDoc = {
  state: 'open' | 'restricted' | 'closed'
  reason?: string | null
  facilities?: { label: string; state: string; value?: string | null }[] | null
  changedBy?: string | null
  updatedAt: string
}

const loadStatus = async (payload: Payload, tenantID: string) =>
  (
    await payload.find({
      collection: 'course-status',
      where: { tenant: { equals: tenantID } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0] as unknown as StatusDoc | undefined

const stateLabel = (state: string) => STATUS_STATES.find((s) => s.value === state)?.label ?? state

const statusAnswer = (
  status: StatusDoc | undefined,
  facts: PageFacts,
  base: string,
): Answer | null => {
  if (!status) return null
  const age = siteToday().getTime() - new Date(status.updatedAt).getTime()
  const stale = age > STATUS_STALE_HOURS * 60 * 60 * 1000
  const by = status.changedBy?.trim() ? ` by ${status.changedBy.trim()}` : ''
  return {
    kind: 'status',
    eyebrow: 'Course status',
    title: `Course ${stateLabel(status.state).toLowerCase()}`,
    note: status.reason?.trim() || null,
    tone: status.state,
    source: stale
      ? `May be out of date: last updated ${dayMonth(status.updatedAt)}${by}`
      : `Updated ${clock(status.updatedAt)}${by}`,
    facts: (status.facilities ?? []).slice(0, 4).map((f) => ({
      value: f.value?.trim() || stateLabel(f.state),
      label: f.label,
    })),
    actions: facts.statusPage
      ? [{ label: 'Full course status', href: siteHref(base, facts.statusPage), primary: false }]
      : [],
  }
}

const hoursAnswer = (club: ClubSite, base: string): Answer | null => {
  const hours = club.footer.hours
  if (hours.length === 0) return null
  const more = club.footer.hoursLink ?? {
    label: 'Contact the club',
    link: { kind: 'page', slug: 'contact' } as SiteLink,
  }
  return {
    kind: 'hours',
    eyebrow: 'Top answer',
    title: 'Opening hours',
    source: `From ${club.name}’s opening hours`,
    facts: hours.slice(0, 4).map((h) => ({ value: h.times, label: h.place })),
    actions: [{ label: more.label, href: siteHref(base, more.link), primary: false }],
  }
}

const eventAnswer = async (
  club: ClubSite,
  words: string[],
  base: string,
): Promise<Answer | null> => {
  const competitionsOnly = words.some((w) => ['comp', 'competition', 'medal'].includes(w))
  const events = await clubEvents(club.tenantID)
  const next = events.find((e) => !competitionsOnly || e.category === 'competition') ?? null
  if (!next) return null
  const actions: Answer['actions'] = []
  if (next.link && next.booking !== 'soldOut') {
    actions.push({
      label: next.booking === 'book' ? 'Book' : 'Enquire',
      href: siteHref(base, next.link),
      primary: true,
      newTab: next.link.kind === 'url' && /^https?:\/\//i.test(next.link.href),
    })
  }
  actions.push({
    label: 'All events',
    href: siteHref(base, { kind: 'page', slug: 'events' }),
    primary: false,
  })
  return {
    kind: 'event',
    eyebrow: competitionsOnly ? 'Next competition' : 'Next event',
    title: next.title,
    source: null,
    facts: [
      {
        value: new Date(next.startsAt).toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          timeZone: UK,
        }),
        label: next.categoryLabel,
      },
      { value: clock(next.startsAt), label: next.timeNote ?? 'Starts' },
      ...(next.price ? [{ value: next.price, label: 'Entry' }] : []),
      ...(next.placesLeft !== null && next.booking !== 'soldOut'
        ? [{ value: String(next.placesLeft), label: 'Places left' }]
        : []),
    ].slice(0, 4),
    actions,
  }
}

/**
 * A person, when the search names exactly one of the people the site shows: their name, or a
 * word of their role ("secretary"). Two or more matches is a list, not an answer.
 */
const personAnswer = async (
  tenantID: string,
  words: string[],
  base: string,
): Promise<Answer | null> => {
  if (words.length === 0 || words.length > 3) return null
  const payload = await getPayload({ config })
  const db = (payload.db as unknown as { drizzle: Executor }).drizzle
  const { rows } = await db.execute(sql`
    SELECT title, eyebrow, link, details FROM search_entries
    WHERE tenant_id = ${tenantID} AND kind = 'person'`)
  type PersonRow = {
    title: string
    eyebrow: string | null
    link: SiteLink
    details: SearchDetails | null
  }
  const split = (text: string | null) => (text ?? '').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  const startsAll = (targets: string[]) => words.every((w) => targets.some((t) => t.startsWith(w)))
  // Their name ("claire", "claire benson"), or the job itself: the last word of their role
  // ("secretary" for Membership Secretary; not "membership", which is a topic, not a person).
  const matches = (rows as PersonRow[]).filter((p) => {
    const role = split(p.eyebrow)
    const job = role[role.length - 1]
    return (
      startsAll(split(p.title)) ||
      (job !== undefined && startsAll(role) && words.some((w) => job.startsWith(w)))
    )
  })
  if (matches.length !== 1) return null
  const p = matches[0]
  const d = p.details ?? {}
  const first = p.title.trim().split(/\s+/)[0]
  return {
    kind: 'person',
    eyebrow: p.eyebrow ?? 'Team',
    title: p.title,
    source: d.qualification ?? null,
    facts: [
      ...(d.department ? [{ value: d.department, label: 'Team' }] : []),
      ...(d.phone ? [{ value: d.phone, label: 'Phone' }] : []),
    ],
    person: {
      initials: initials(p.title),
      image: d.image
        ? { url: d.image.url, srcSet: d.image.srcSet, position: d.image.position }
        : null,
    },
    email: d.email ?? null,
    actions: [{ label: `About ${first}`, href: siteHref(base, p.link), primary: false }],
  }
}

/**
 * The answer to show above a search's results, or null. `club` gives the opening hours and the
 * club's own address (base).
 */
export const findAnswer = async (
  club: ClubSite,
  base: string,
  q: string,
): Promise<Answer | null> => {
  const words = searchWords(q)
  if (words.length === 0) return null
  const asked = askedFor(q)
  if (asked.size > 1) return null
  const payload = await getPayload({ config })
  const facts = await pageFacts(payload, club.tenantID)
  const kind = [...asked][0]
  if (kind === 'status') return statusAnswer(await loadStatus(payload, club.tenantID), facts, base)
  if (kind === 'hours') return hoursAnswer(club, base)
  if (kind === 'event') return eventAnswer(club, words, base)
  if (kind === 'fees') return feesAnswer(facts, words, base)
  // Nothing asked for in so many words: a single person, or a named rate ("twilight").
  const [person, fees] = await Promise.all([
    personAnswer(club.tenantID, words, base),
    Promise.resolve(feesAnswer(facts, words, base)),
  ])
  const named = fees && words.some((w) => w.length >= 4 && !GENERIC.has(w)) ? fees : null
  if (person && named) return null
  return person ?? named
}

// ---------- Quick access: the panel before anything is typed ----------

export type QuickAccess = {
  items: { label: string; detail: string; href: string | null }[]
  /** "This week at the club", or "Coming up" when nothing is on this week. */
  eventsHeading: string
  events: {
    title: string
    when: string
    href: string
    image: { url: string; srcSet: string | null; position: string } | null
  }[]
}

/** Live values for the panel's quick access (spec §3), each only when the club has it. */
export const quickAccess = async (club: ClubSite, base: string): Promise<QuickAccess> => {
  const payload = await getPayload({ config })
  const [facts, status, events] = await Promise.all([
    pageFacts(payload, club.tenantID),
    loadStatus(payload, club.tenantID),
    clubEvents(club.tenantID),
  ])
  const items: QuickAccess['items'] = []
  if (status) {
    items.push({
      label: 'Course status',
      detail: `${stateLabel(status.state)} · Updated ${clock(status.updatedAt)}`,
      href: facts.statusPage ? siteHref(base, facts.statusPage) : null,
    })
  }
  // Prices: the club's top-level prices page (e.g. "Visitors & green fees") if it has one, named
  // after its page and showing its lowest price.
  const table = facts.rateTables[0]
  if (table) {
    const prices = facts.rateTables
      .filter((t) => t.page.title === table.page.title)
      .flatMap((t) => t.rows.flatMap((r) => r.prices))
      .map((p) => ({ p, n: amount(p) }))
      .filter((x): x is { p: string; n: number } => x.n !== null && x.n > 0)
      .sort((a, b) => a.n - b.n)
    items.push({
      label: table.page.title,
      detail: prices[0] ? `From ${prices[0].p}` : table.heading || 'Prices',
      href: siteHref(base, table.page.link),
    })
  }
  if (club.footer.hours[0]) {
    const h = club.footer.hours[0]
    items.push({
      label: 'Opening hours',
      detail: `${h.place}: ${h.times}`,
      href: siteHref(base, club.footer.hoursLink?.link ?? { kind: 'page', slug: 'contact' }),
    })
  }
  const weekAhead = siteToday().getTime() + 7 * 24 * 60 * 60 * 1000
  const thisWeek = events.filter((e) => new Date(e.startsAt).getTime() < weekAhead)
  const shown = (thisWeek.length > 0 ? thisWeek : events).slice(0, 2)
  return {
    items,
    eventsHeading: thisWeek.length > 0 ? 'This week at the club' : 'Coming up',
    events: shown.map((e) => ({
      title: e.title,
      when: `${new Date(e.startsAt).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: UK })}, ${clock(e.startsAt)}`,
      href: siteHref(base, { kind: 'page', slug: 'events' }),
      image: e.image
        ? { url: e.image.url, srcSet: e.image.srcSet, position: e.image.position }
        : null,
    })),
  }
}
