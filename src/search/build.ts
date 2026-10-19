import type { Payload } from 'payload'

import { newsCategoryLabel } from '@/collections/newsCategories'
import { STAFF_DEPARTMENTS } from '@/collections/staffDepartments'
import { BUILT_IN_PAGES } from '@/fields/link'
import { layoutRefs, pageBlocks } from '@/blocks'
import { idOf } from '@/blocks/types'
import { loadClubMedia, type SiteMedia } from '@/site/blocks/media'
import { loadBlockContext } from '@/site/blocks/resolve'
import { categoryName } from '@/site/blocks/documentsShared'
import { clubEvents } from '@/site/events'
import type { SiteLink } from '@/site/loadClub'
import { PUBLISHED } from '@/site/published'

import { blockWords, opening, richTextWords, tidy } from './text'

/** The kinds of result, in the order the results show them (spec §2). */
export const SEARCH_KINDS = ['event', 'page', 'news', 'course', 'person', 'document'] as const
export type SearchKind = (typeof SEARCH_KINDS)[number]

/** Shown on result rows; everything a row needs that isn't a column of its own. */
export type SearchDetails = {
  image?: SiteMedia | null
  /** Events: Book / Enquire, and where it goes. */
  action?: { label: string; link: SiteLink } | null
  /** People: their email in two halves (ProtectedEmail); only the results page shows it. */
  email?: { user: string; domain: string } | null
  /** Documents: e.g. "PDF" and "240 KB", and the page that lists them. */
  fileType?: string
  fileSize?: string
}

export type SearchEntry = {
  kind: SearchKind
  sourceID: string
  title: string
  eyebrow: string | null
  excerpt: string | null
  body: string | null
  link: SiteLink
  details: SearchDetails | null
  date: string | null
  visibleFrom: string | null
  visibleUntil: string | null
}

/** Long pages are searched on their first 20,000 characters (plenty for any club page). */
const MAX_BODY = 20_000

// Fixed IDs for the pages every club's site has (News, Events, Contact, Privacy policy).
const builtInID = (i: number) => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`

const departmentName = (value: string) =>
  STAFF_DEPARTMENTS.find((d) => d.value === value)?.label ?? ''

type PageDoc = {
  id: string
  title: string
  slug?: string | null
  parent?: unknown
  layout?: unknown
}

type NewsDoc = {
  id: string
  slug?: string | null
  title: string
  excerpt?: string | null
  category: string
  publishedAt: string
  image?: unknown
  author?: string | null
  body?: unknown
}

/**
 * Everything a visitor can find on one club's live site: its published pages, news and
 * events, and the people, documents and courses those pages show. Built only from what the
 * site itself shows, so nothing unpublished or unlisted can turn up in search.
 */
export const buildClubEntries = async (
  payload: Payload,
  tenantID: string,
): Promise<SearchEntry[]> => {
  const [pagesFound, newsFound, events] = await Promise.all([
    payload.find({
      collection: 'pages',
      where: { and: [{ tenant: { equals: tenantID } }, PUBLISHED] },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'news',
      where: { and: [{ tenant: { equals: tenantID } }, { status: { equals: 'published' } }] },
      pagination: false,
      depth: 0,
      overrideAccess: true,
    }),
    clubEvents(tenantID),
  ])
  const pages = (pagesFound.docs as unknown as PageDoc[]).filter((p) => p.slug)
  const news = (newsFound.docs as unknown as NewsDoc[]).filter((n) => n.slug)
  const titles = new Map(pages.map((p) => [String(p.id), p.title]))

  // Look everything up the way the pages themselves do, all pages at once.
  const ctx = await loadBlockContext(
    payload,
    tenantID,
    pages.flatMap((p) => (Array.isArray(p.layout) ? p.layout : [])),
  )
  const newsPhotos = await loadClubMedia(
    payload,
    tenantID,
    news.map((n) => idOf(n.image)).filter((id): id is string => Boolean(id)),
  )

  const entries: SearchEntry[] = []
  const seen = new Set<string>()
  const add = (entry: SearchEntry) => {
    const key = `${entry.kind}:${entry.sourceID}`
    if (seen.has(key)) return
    seen.add(key)
    entries.push(entry)
  }

  for (const page of pages) {
    const text = tidy(blockWords(pageBlocks, page.layout))
    const link: SiteLink = { kind: 'page', slug: String(page.slug) }
    add({
      kind: 'page',
      sourceID: String(page.id),
      title: page.title,
      eyebrow: titles.get(idOf(page.parent) ?? '') ?? null,
      excerpt: opening(text) || null,
      body: text.slice(0, MAX_BODY) || null,
      link,
      details: null,
      date: null,
      visibleFrom: null,
      visibleUntil: null,
    })

    // The people, documents and courses this page shows can be found too, and open this page
    // (documents open the file itself).
    for (const block of Array.isArray(page.layout) ? page.layout : []) {
      for (const ref of refsOf(block)) {
        if (ref.collection === 'staff') {
          const person = ctx.person(ref.id)
          if (!person) continue
          add({
            kind: 'person',
            sourceID: person.id,
            title: person.name,
            eyebrow: person.role,
            excerpt: person.bio ? opening(person.bio) : null,
            body:
              [departmentName(person.department), person.qualification, person.bio]
                .filter(Boolean)
                .join('\n') || null,
            link,
            details: { image: person.photo, email: person.email },
            date: null,
            visibleFrom: null,
            visibleUntil: null,
          })
        } else if (ref.collection === 'documents') {
          const doc = ctx.document(ref.id)
          if (!doc) continue
          add({
            kind: 'document',
            sourceID: doc.id,
            title: doc.title,
            eyebrow: categoryName(doc.category),
            excerpt: null,
            body: null,
            link: { kind: 'url', href: doc.url },
            details: { fileType: doc.type, fileSize: doc.size },
            date: doc.lastReviewed,
            visibleFrom: null,
            visibleUntil: null,
          })
        } else if (ref.collection === 'courses') {
          const course = ctx.course(ref.id)
          if (!course) continue
          const par = course.holes.reduce((sum, h) => sum + h.par, 0)
          const holes = course.holes.length
          add({
            kind: 'course',
            sourceID: course.id,
            title: course.name,
            eyebrow: holes ? `${holes} holes${par ? `, par ${par}` : ''}` : null,
            excerpt: null,
            body:
              tidy(course.holes.flatMap((h) => [h.name ?? '', h.tip ?? '', '\n'])).slice(
                0,
                MAX_BODY,
              ) || null,
            link,
            details: { image: course.holes.find((h) => h.image)?.image ?? null },
            date: null,
            visibleFrom: null,
            visibleUntil: null,
          })
        }
      }
    }
  }

  BUILT_IN_PAGES.forEach((p, i) => {
    add({
      kind: 'page',
      sourceID: builtInID(i),
      title: p.label,
      eyebrow: null,
      excerpt: null,
      body: null,
      link: { kind: 'page', slug: p.value },
      details: null,
      date: null,
      visibleFrom: null,
      visibleUntil: null,
    })
  })

  for (const post of news) {
    const image = newsPhotos.get(idOf(post.image) ?? '') ?? null
    const text = tidy(richTextWords(post.body))
    add({
      kind: 'news',
      sourceID: String(post.id),
      title: post.title,
      eyebrow: newsCategoryLabel(post.category),
      excerpt: post.excerpt?.trim() || opening(text) || null,
      body: [post.author, text].filter(Boolean).join('\n').slice(0, MAX_BODY) || null,
      link: { kind: 'page', slug: `news/${post.slug}` },
      details: { image: image?.mimeType.startsWith('image/') ? image : null },
      date: post.publishedAt,
      visibleFrom: post.publishedAt,
      visibleUntil: null,
    })
  }

  for (const event of events) {
    add({
      kind: 'event',
      sourceID: event.id,
      title: event.title,
      eyebrow: event.categoryLabel,
      excerpt: event.summary,
      body: [event.venue, event.timeNote].filter(Boolean).join('\n') || null,
      link: { kind: 'page', slug: 'events' },
      details: {
        image: event.image,
        action:
          event.link && event.booking !== 'soldOut'
            ? { label: event.booking === 'book' ? 'Book' : 'Enquire', link: event.link }
            : null,
      },
      date: event.startsAt,
      visibleFrom: null,
      visibleUntil: event.startsAt,
    })
  }

  return entries
}

/** The people, documents and courses one block points at. */
const refsOf = (block: unknown) =>
  layoutRefs([block]).filter(
    (r) => r.collection === 'staff' || r.collection === 'documents' || r.collection === 'courses',
  )
