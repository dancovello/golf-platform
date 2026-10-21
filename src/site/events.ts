import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import { EVENT_CATEGORIES, eventCategoryLabel } from '@/collections/eventCategories'
import { builtInLink, isSafeURL, linksToPage } from '@/fields/link'

import { loadClubMedia, type SiteMedia } from './blocks/media'
import { PUBLISHED } from './published'
import type { SiteLink } from './loadClub'
import { siteToday } from './today'
import { idOf } from '@/blocks/types'

/** An event as cards, rows and the featured panel show it. */
export type SiteEvent = {
  id: string
  title: string
  category: string
  categoryLabel: string
  startsAt: string
  venue: string | null
  timeNote: string | null
  summary: string | null
  image: SiteMedia | null
  price: string | null
  memberPrice: string | null
  booking: 'book' | 'enquire' | 'soldOut'
  /** Where Book / Enquire goes; null when sold out or not set. */
  link: SiteLink | null
  capacity: number | null
  placesLeft: number | null
  featured: boolean
}

/** The archive shows this many at first, and this many more each time. */
export const EVENTS_STEP = 6

type EventDoc = {
  id: string | number
  title: string
  category: string
  startsAt: string
  venue?: string | null
  timeNote?: string | null
  summary?: string | null
  image?: unknown
  price?: string | null
  memberPrice?: string | null
  booking: 'book' | 'enquire' | 'soldOut'
  link?: { type?: string | null; page?: unknown; url?: string | null; builtIn?: unknown } | null
  capacity?: number | null
  placesLeft?: number | null
  featured?: boolean | null
}

/** Published and not yet started. */
const upcoming = (tenantID: string, category?: string | null): Where => ({
  and: [
    { tenant: { equals: tenantID } },
    { status: { equals: 'published' } },
    { startsAt: { greater_than: siteToday().toISOString() } },
    ...(category ? [{ category: { equals: category } }] : []),
  ],
})

const toEvents = async (tenantID: string, docs: EventDoc[]): Promise<SiteEvent[]> => {
  const payload = await getPayload({ config })
  const photoIDs = docs.map((d) => idOf(d.image)).filter((id): id is string => Boolean(id))
  const pageIDs = [
    ...new Set(
      docs
        .map((d) => (linksToPage(d.link?.type) ? idOf(d.link?.page) : null))
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const [photos, pages] = await Promise.all([
    loadClubMedia(payload, tenantID, photoIDs),
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
  return docs.map((d) => {
    const image = photos.get(idOf(d.image) ?? '') ?? null
    let link: SiteLink | null = null
    if (d.booking !== 'soldOut' && d.link) {
      if (d.link.type === 'url') {
        link = isSafeURL(d.link.url) ? { kind: 'url', href: d.link.url.trim() } : null
      } else if (d.link.type === 'builtIn') {
        link = builtInLink(d.link.builtIn)
      } else {
        const slug = pages.get(idOf(d.link.page) ?? '')
        link = slug ? { kind: 'page', slug } : null
      }
    }
    return {
      id: String(d.id),
      title: d.title,
      category: d.category,
      categoryLabel: eventCategoryLabel(d.category),
      startsAt: d.startsAt,
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
    }
  })
}

const find = async (where: Where, limit: number) => {
  const payload = await getPayload({ config })
  return payload.find({
    collection: 'events',
    where,
    sort: 'startsAt',
    limit,
    depth: 0,
    overrideAccess: true,
  })
}

/** Every upcoming event, soonest first (site search: src/search/build.ts). */
export const clubEvents = async (tenantID: string): Promise<SiteEvent[]> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'events',
    where: upcoming(tenantID),
    sort: 'startsAt',
    pagination: false,
    depth: 0,
    overrideAccess: true,
  })
  return toEvents(tenantID, docs as unknown as EventDoc[])
}

/** The next events, soonest first, optionally in one category (Events blocks). */
export const upcomingEvents = async (
  tenantID: string,
  limit: number,
  category?: string | null,
): Promise<SiteEvent[]> => {
  const { docs } = await find(upcoming(tenantID, category), limit)
  return toEvents(tenantID, docs as EventDoc[])
}

/** The featured event (the soonest one marked featured, or simply the next one). */
export const featuredEvent = async (tenantID: string): Promise<SiteEvent | null> => {
  const marked = await find({ and: [upcoming(tenantID), { featured: { equals: true } }] }, 1)
  const docs = marked.docs.length > 0 ? marked.docs : (await find(upcoming(tenantID), 1)).docs
  return (await toEvents(tenantID, docs as EventDoc[]))[0] ?? null
}

/**
 * The archive: upcoming events in one category (or all), the first `show` of them.
 * `include`: one more of the club's events shown whatever its status or date, for the admin's
 * live preview (the caller checks who may see it: src/site/livePreviewAccess.ts).
 */
export const eventsArchive = async (
  tenantID: string,
  {
    category,
    show,
    include = null,
  }: { category: string | null; show: number; include?: string | null },
) => {
  const known = EVENT_CATEGORIES.some((c) => c.value === category) ? category : null
  const count = Math.min(Math.max(EVENTS_STEP, show), 200)
  const result = await find(upcoming(tenantID, known), count)
  // The event being previewed comes first, so the editor always sees it.
  const extra = include
    ? (await find({ and: [{ tenant: { equals: tenantID } }, { id: { equals: include } }] }, 1)).docs
    : []
  const docs = [...extra, ...result.docs.filter((d) => !extra.some((e) => e.id === d.id))]
  return {
    category: known,
    events: await toEvents(tenantID, docs as EventDoc[]),
    total: result.totalDocs,
    show: count,
  }
}
