import type { Payload } from 'payload'

import { layoutRefs } from '@/blocks'
import { idOf } from '@/blocks/types'
import { isSafeURL } from '@/fields/link'

import type { SiteLink } from '../loadClub'
import { loadClubMedia, type SiteMedia } from './media'

export type ResolvedLink = { label: string; link: SiteLink }

/** What a block's website component gets: its own data, with pages and photos looked up. */
export type BlockContext = {
  media: (value: unknown) => SiteMedia | null
  /** `fallbackLabel` for links whose text is fixed by the design (e.g. a whole card). */
  link: (value: unknown, fallbackLabel?: string) => ResolvedLink | null
}

/**
 * Prepares a page's blocks for the website. Every page and photo the blocks point at is
 * looked up within the club; anything else (another club's, deleted) is treated as missing.
 */
export const loadBlockContext = async (
  payload: Payload,
  tenantID: string,
  layout: unknown,
): Promise<BlockContext> => {
  const refs = layoutRefs(layout)
  const pageIDs = [...new Set(refs.filter((r) => r.collection === 'pages').map((r) => r.id))]
  const [media, pages] = await Promise.all([
    loadClubMedia(
      payload,
      tenantID,
      refs.filter((r) => r.collection === 'media').map((r) => r.id),
    ),
    pageIDs.length === 0
      ? Promise.resolve(new Map<string, string>())
      : payload
          .find({
            collection: 'pages',
            where: { and: [{ id: { in: pageIDs } }, { tenant: { equals: tenantID } }] },
            select: { slug: true },
            limit: pageIDs.length,
            depth: 0,
            overrideAccess: true,
          })
          .then(({ docs }) => new Map(docs.map((d) => [String(d.id), String(d.slug)]))),
  ])

  return {
    media: (value) => media.get(idOf(value) ?? '') ?? null,
    link: (value, fallbackLabel) => {
      const raw = (value ?? {}) as {
        label?: string | null
        type?: string
        page?: unknown
        url?: string
      }
      const label = raw.label?.trim() || fallbackLabel
      if (!label) return null
      if (raw.type === 'url') {
        return isSafeURL(raw.url) ? { label, link: { kind: 'url', href: raw.url.trim() } } : null
      }
      const slug = pages.get(idOf(raw.page) ?? '')
      return slug ? { label, link: { kind: 'page', slug } } : null
    },
  }
}
