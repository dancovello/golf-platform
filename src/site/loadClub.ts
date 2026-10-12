import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import { isSafeURL } from '@/fields/link'
import { type Brand, BRAND_INPUTS, DEFAULT_BRAND, isHex } from '@/theme/colour'
import { DEFAULT_FONT_SET, type FontSetID, isFontSetID } from '@/theme/fontSets'

/** A link on the public site: one of the club's pages (by slug) or a checked web address. */
export type SiteLink = { kind: 'page'; slug: string } | { kind: 'url'; href: string }
export type MenuItem = {
  label: string
  link: SiteLink | null
  groups: { heading: string; links: { label: string; link: SiteLink }[] }[]
}
export type SiteImage = { url: string; alt: string; width: number | null; height: number | null }
export type HeaderStyle = 'classic' | 'transparent' | 'appBar'

export type ClubSite = {
  tenantID: string
  slug: string
  name: string
  brand: Brand
  fontSet: FontSetID
  strapline: string | null
  logoOnLight: SiteImage | null
  logoOnDark: SiteImage | null
  header: {
    style: HeaderStyle
    booking: { label: string; link: SiteLink } | null
    phone: string | null
    menu: MenuItem[]
  }
}

type RawLink = { label?: string | null; type?: string | null; page?: unknown; url?: string | null }
type RawSettings = {
  clubName?: string | null
  branding?: Partial<Brand> & {
    fontSet?: unknown
    logoOnLight?: unknown
    logoOnDark?: unknown
    strapline?: string | null
  }
  header?: {
    style?: string | null
    booking?: RawLink | null
    phone?: string | null
    menu?:
      | {
          label?: string | null
          link?: RawLink | null
          groups?: { heading?: string | null; links?: { link?: RawLink | null }[] | null }[] | null
        }[]
      | null
  }
}

const idOf = (v: unknown) =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String(v.id) : null

const HEADER_STYLES: HeaderStyle[] = ['classic', 'transparent', 'appBar']

/**
 * Reads what the public site needs for one club. Visitors aren't logged in, so access rules
 * can't scope this: every query filters by the club's own ID explicitly and returns only the
 * fields the site shows. Linked pages and photos are looked up again within the club, so a
 * stray reference to another club's content is dropped, never shown.
 */
export const loadClubBySlug = async (slug: string): Promise<ClubSite | null> => {
  const payload = await getPayload({ config })
  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    select: { name: true, slug: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const tenant = tenants[0]
  if (!tenant) return null
  const tenantID = String(tenant.id)

  const { docs } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: tenantID } },
    select: { clubName: true, branding: true, header: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const s = (docs[0] ?? {}) as RawSettings
  const b = s.branding ?? {}
  const h = s.header ?? {}

  const rawLinks: RawLink[] = [
    ...(h.booking ? [h.booking] : []),
    ...(h.menu ?? []).flatMap((m) => [
      ...(m.link ? [m.link] : []),
      ...(m.groups ?? []).flatMap((g) => (g.links ?? []).map((l) => l.link ?? {})),
    ]),
  ]
  const pageSlugs = await clubPageSlugs(
    payload,
    tenantID,
    rawLinks.map((l) => idOf(l.page)),
  )
  const images = await clubImages(payload, tenantID, [idOf(b.logoOnLight), idOf(b.logoOnDark)])

  const toLink = (raw: RawLink | null | undefined): SiteLink | null => {
    if (!raw) return null
    if (raw.type === 'url') return isSafeURL(raw.url) ? { kind: 'url', href: raw.url.trim() } : null
    const pageSlug = pageSlugs.get(idOf(raw.page) ?? '')
    return pageSlug ? { kind: 'page', slug: pageSlug } : null
  }

  const bookingLink = toLink(h.booking)
  const bookingLabel = h.booking?.label?.trim()

  return {
    tenantID,
    slug: String(tenant.slug),
    name: s.clubName || String(tenant.name),
    brand: Object.fromEntries(
      BRAND_INPUTS.map((key) => [key, isHex(b[key]) ? b[key] : DEFAULT_BRAND[key]]),
    ) as Brand,
    fontSet: isFontSetID(b.fontSet) ? b.fontSet : DEFAULT_FONT_SET,
    strapline: b.strapline?.trim() || null,
    logoOnLight: images.get(idOf(b.logoOnLight) ?? '') ?? null,
    logoOnDark: images.get(idOf(b.logoOnDark) ?? '') ?? null,
    header: {
      style: HEADER_STYLES.includes(h.style as HeaderStyle) ? (h.style as HeaderStyle) : 'classic',
      booking: bookingLink && bookingLabel ? { label: bookingLabel, link: bookingLink } : null,
      phone: h.phone?.trim() || null,
      menu: (h.menu ?? [])
        .map((m) => ({
          label: m.label?.trim() ?? '',
          link: toLink(m.link),
          groups: (m.groups ?? [])
            .map((g) => ({
              heading: g.heading?.trim() ?? '',
              links: (g.links ?? []).flatMap((l) => {
                const link = toLink(l.link)
                const label = l.link?.label?.trim()
                return link && label ? [{ label, link }] : []
              }),
            }))
            .filter((g) => g.heading && g.links.length > 0),
        }))
        .filter((m) => m.label && (m.link || m.groups.length > 0)),
    },
  }
}

/** Slugs of the given pages, only if they belong to this club. */
const clubPageSlugs = async (payload: Payload, tenantID: string, ids: (string | null)[]) => {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (wanted.length === 0) return new Map<string, string>()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenantID } }] },
    select: { slug: true },
    limit: wanted.length,
    depth: 0,
    overrideAccess: true,
  })
  return new Map(docs.map((d) => [String(d.id), String(d.slug)]))
}

/** Public addresses of the given images, only if they belong to this club. */
const clubImages = async (payload: Payload, tenantID: string, ids: (string | null)[]) => {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (wanted.length === 0) return new Map<string, SiteImage>()
  const { docs } = await payload.find({
    collection: 'media',
    where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenantID } }] },
    select: { url: true, alt: true, width: true, height: true, mimeType: true },
    limit: wanted.length,
    depth: 0,
    overrideAccess: true,
  })
  return new Map(
    docs
      .filter((d) => typeof d.url === 'string' && String(d.mimeType ?? '').startsWith('image/'))
      .map((d) => [
        String(d.id),
        { url: String(d.url), alt: d.alt ?? '', width: d.width ?? null, height: d.height ?? null },
      ]),
  )
}

/** One of the club's pages by its address, or null. */
export const loadClubPage = async (tenantID: string, slug: string) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { tenant: { equals: tenantID } }] },
    select: { title: true, slug: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ? { title: String(docs[0].title), slug: String(docs[0].slug) } : null
}
