import type { Payload } from 'payload'

import { priceListPhase, visibleLists } from '../site/blocks/seasons'
import { ukStartOfDay } from '../site/ukTime'

/**
 * "Needs attention" on the club home screen (G15, 15 Nov 2026): things a club secretary would
 * want to know before a visitor notices. Never shown on the public website. Each query names
 * the club, so one club's list can only ever hold that club's pages and events.
 */

export type AttentionItem = { key: string; text: string; href: string }

/** A page left alone this long is mentioned (the club can untick it by editing the page). */
export const STALE_PAGE_DAYS = 365
/** A price list is flagged when it runs out within this many days and nothing follows it. */
export const PRICE_LEAD_DAYS = 30

const DAY = 86_400_000

type RateSection = { validFrom?: string | null; validUntil?: string | null }
type RateBlock = {
  blockType?: string
  heading?: string
  style?: string
  showUpcoming?: boolean | null
  tabs?: { sections?: RateSection[] | null }[] | null
}
type PageDoc = {
  id: string | number
  title?: string | null
  slug?: string | null
  updatedAt: string
  layout?: unknown
}

const ukDate = (iso: string | Date) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  })

/** Price lists that have ended or are about to, with nothing after them (G2 dates). */
export const priceListWarnings = (pages: PageDoc[], now: Date): AttentionItem[] => {
  const items: AttentionItem[] = []
  for (const page of pages) {
    const blocks = (Array.isArray(page.layout) ? page.layout : []) as RateBlock[]
    blocks.forEach((block, i) => {
      if (block?.blockType !== 'rateTable') return
      const lists = (block.tabs ?? []).flatMap((t) => t.sections ?? [])
      const dated = lists.filter((l) => l.validFrom || l.validUntil)
      if (dated.length === 0) return
      const name = `${block.heading ?? 'Price table'} on “${page.title ?? page.slug}”`
      const href = `/admin/collections/pages/${page.id}`
      const showing = visibleLists(lists, now, Boolean(block.showUpcoming))
      const current = lists.filter((l) => priceListPhase(l, now) === 'current')
      const comingUp = lists.some((l) => priceListPhase(l, now) === 'upcoming')
      if (showing.length === 0 || (current.length === 0 && !comingUp)) {
        items.push({
          key: `prices-ended-${page.id}-${i}`,
          text: `${name}: every dated price list has ended, so the table is hidden.`,
          href,
        })
        return
      }
      // Undated lists never run out; dated ones in force are the ones that can.
      if (comingUp || current.some((l) => !l.validUntil)) return
      const last = current
        .map((l) => new Date(l.validUntil!).getTime())
        .reduce((a, b) => Math.max(a, b), 0)
      if (last - ukStartOfDay(now).getTime() <= PRICE_LEAD_DAYS * DAY) {
        items.push({
          key: `prices-ending-${page.id}-${i}`,
          text: `${name}: the prices run out on ${ukDate(new Date(last))}, with no newer list after them.`,
          href,
        })
      }
    })
  }
  return items
}

/** Pages nobody has edited for a year, as one line naming up to three of them. */
export const oldPageWarning = (pages: PageDoc[], now: Date): AttentionItem | null => {
  const old = pages
    .filter((p) => now.getTime() - new Date(p.updatedAt).getTime() > STALE_PAGE_DAYS * DAY)
    .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
  if (old.length === 0) return null
  const names = old
    .slice(0, 3)
    .map((p) => `“${p.title ?? p.slug}”`)
    .join(', ')
  return {
    key: 'old-pages',
    text: `${old.length === 1 ? '1 page has' : `${old.length} pages have`} not been changed for over a year: ${names}${old.length > 3 ? ' and more' : ''}.`,
    href: '/admin/collections/pages',
  }
}

export const clubAttention = async (
  payload: Payload,
  tenantID: string,
  now = new Date(),
): Promise<AttentionItem[]> => {
  const byClub = { tenant: { equals: tenantID } }
  const [pages, upcoming, anyEvent] = await Promise.all([
    payload.find({
      collection: 'pages',
      where: { and: [byClub, { _status: { equals: 'published' } }] },
      select: { title: true, slug: true, updatedAt: true, layout: true },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    payload.count({
      collection: 'events',
      where: {
        and: [
          byClub,
          { status: { equals: 'published' } },
          { startsAt: { greater_than: now.toISOString() } },
        ],
      },
      overrideAccess: true,
    }),
    payload.count({ collection: 'events', where: byClub, overrideAccess: true }),
  ])
  const docs = pages.docs as unknown as PageDoc[]
  const items = priceListWarnings(docs, now)
  // Only clubs that use Events are nagged about an empty list.
  if (anyEvent.totalDocs > 0 && upcoming.totalDocs === 0) {
    items.push({
      key: 'no-events',
      text: 'Nothing is coming up in What’s on. Add an event, or visitors see an empty list.',
      href: '/admin/collections/events/create',
    })
  }
  const old = oldPageWarning(docs, now)
  if (old) items.push(old)
  return items
}
