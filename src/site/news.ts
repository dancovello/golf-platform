import config from '@payload-config'
import { getPayload, type Where } from 'payload'

import { NEWS_CATEGORIES, newsCategoryLabel } from '@/collections/newsCategories'

import { type BlockContext, loadBlockContext } from './blocks/resolve'
import { loadClubMedia, type SiteMedia } from './blocks/media'
import { siteToday } from './today'
import { idOf } from '@/blocks/types'

/** A news article as cards and lists show it. */
export type SiteNewsCard = {
  slug: string
  title: string
  excerpt: string | null
  category: string
  categoryLabel: string
  publishedAt: string
  image: SiteMedia | null
}

export type SiteNewsPost = SiteNewsCard & {
  imageCaption: string | null
  author: string | null
  body: unknown
  readingMinutes: number
  ctx: BlockContext
  previous: SiteNewsCard | null
  next: SiteNewsCard | null
  more: SiteNewsCard[]
}

/** The lead story plus a grid of six (Figma "News archive"). */
export const NEWS_PER_PAGE = 7

type NewsDoc = {
  slug?: string | null
  title: string
  excerpt?: string | null
  category: string
  publishedAt: string
  image?: unknown
  imageCaption?: string | null
  author?: string | null
  body?: unknown
}

/** Published, and its publish date has arrived (UK time is fine at day level). */
const live = (tenantID: string): Where[] => [
  { tenant: { equals: tenantID } },
  { status: { equals: 'published' } },
  { publishedAt: { less_than_equal: siteToday().toISOString() } },
]

const toCards = async (tenantID: string, docs: NewsDoc[]): Promise<SiteNewsCard[]> => {
  const payload = await getPayload({ config })
  const photos = await loadClubMedia(
    payload,
    tenantID,
    docs.map((d) => idOf(d.image)).filter((id): id is string => Boolean(id)),
  )
  return docs
    .filter((d) => d.slug)
    .map((d) => {
      const image = photos.get(idOf(d.image) ?? '') ?? null
      return {
        slug: String(d.slug),
        title: d.title,
        excerpt: d.excerpt?.trim() || null,
        category: d.category,
        categoryLabel: newsCategoryLabel(d.category),
        publishedAt: d.publishedAt,
        image: image?.mimeType.startsWith('image/') ? image : null,
      }
    })
}

const CARD_FIELDS = {
  slug: true,
  title: true,
  excerpt: true,
  category: true,
  publishedAt: true,
  image: true,
} as const

/** The latest published articles, optionally in one category (news blocks). */
export const latestNews = async (tenantID: string, limit: number, category?: string | null) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'news',
    where: { and: [...live(tenantID), ...(category ? [{ category: { equals: category } }] : [])] },
    sort: '-publishedAt',
    select: CARD_FIELDS,
    limit,
    depth: 0,
    overrideAccess: true,
  })
  return toCards(tenantID, docs as NewsDoc[])
}

/** One page of the archive, filtered by category and search words. */
export const newsArchive = async (
  tenantID: string,
  { category, q, page }: { category: string | null; q: string | null; page: number },
) => {
  const payload = await getPayload({ config })
  const known = NEWS_CATEGORIES.some((c) => c.value === category) ? category : null
  const words = (q ?? '').trim().slice(0, 60)
  const where: Where = {
    and: [
      ...live(tenantID),
      ...(known ? [{ category: { equals: known } }] : []),
      ...(words
        ? [{ or: [{ title: { like: words } }, { excerpt: { like: words } }] } as Where]
        : []),
    ],
  }
  const result = await payload.find({
    collection: 'news',
    where,
    sort: '-publishedAt',
    select: CARD_FIELDS,
    limit: NEWS_PER_PAGE,
    page: Math.max(1, page),
    depth: 0,
    overrideAccess: true,
  })
  return {
    category: known,
    q: words || null,
    cards: await toCards(tenantID, result.docs as NewsDoc[]),
    page: result.page ?? 1,
    pages: Math.max(1, result.totalPages),
    total: result.totalDocs,
  }
}

const wordCount = (value: unknown): number => {
  let n = 0
  const walk = (node: { text?: string; children?: unknown[] } | undefined) => {
    if (!node) return
    if (typeof node.text === 'string') n += node.text.split(/\s+/).filter(Boolean).length
    node.children?.forEach((c) => walk(c as typeof node))
  }
  walk((value as { root?: { children?: unknown[] } } | null)?.root)
  return n
}

/** One published article, with its neighbours (older and newer) and up to six more to read. */
export const loadNewsPost = async (
  tenantID: string,
  slug: string,
): Promise<SiteNewsPost | null> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'news',
    where: { and: [...live(tenantID), { slug: { equals: slug } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = docs[0] as NewsDoc | undefined
  if (!doc) return null
  const [card] = await toCards(tenantID, [doc])

  const neighbour = async (direction: 'older' | 'newer') => {
    const { docs: found } = await payload.find({
      collection: 'news',
      where: {
        and: [
          ...live(tenantID),
          { slug: { not_equals: slug } },
          direction === 'older'
            ? { publishedAt: { less_than: doc.publishedAt } }
            : { publishedAt: { greater_than: doc.publishedAt } },
        ],
      },
      sort: direction === 'older' ? '-publishedAt' : 'publishedAt',
      select: CARD_FIELDS,
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return (await toCards(tenantID, found as NewsDoc[]))[0] ?? null
  }

  const [previous, next, latest, ctx] = await Promise.all([
    neighbour('older'),
    neighbour('newer'),
    latestNews(tenantID, 7),
    // The article is drawn like a Text block, so its photos and links are checked the same way.
    loadBlockContext(payload, tenantID, [{ blockType: 'richText', content: doc.body }]),
  ])

  return {
    ...card,
    imageCaption: doc.imageCaption?.trim() || null,
    author: doc.author?.trim() || null,
    body: doc.body ?? null,
    readingMinutes: Math.max(1, Math.round(wordCount(doc.body) / 200)),
    ctx,
    previous,
    next,
    more: latest.filter((p) => p.slug !== slug).slice(0, 6),
  }
}
