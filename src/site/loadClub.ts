import config from '@payload-config'
import { getPayload, type Payload } from 'payload'

import type { Page } from '@/payload-types'

import {
  STATUS_STALE_HOURS,
  STATUS_STATES,
  type StatusState,
} from '@/collections/courseStatusStates'
import { isSafeURL } from '@/fields/link'
import { loadBlockContext } from '@/site/blocks/resolve'
import { type Brand, BRAND_INPUTS, DEFAULT_BRAND, isHex } from '@/theme/colour'
import { DEFAULT_FONT_SET, type FontSetID, isFontSetID } from '@/theme/fontSets'

import { isGAMeasurementID, type PrivacySettings } from './privacy/policy'
import { siteToday } from './today'

/** A link on the public site: one of the club's pages (by slug) or a checked web address. */
export type SiteLink = { kind: 'page'; slug: string } | { kind: 'url'; href: string }
export type MenuItem = {
  label: string
  link: SiteLink | null
  groups: { heading: string; links: { label: string; link: SiteLink }[] }[]
}
export type SiteImage = { url: string; alt: string; width: number | null; height: number | null }
export type HeaderStyle = 'classic' | 'transparent' | 'appBar'
export type FooterStyle = 'brandColumns' | 'lightColumns' | 'editorial'
export type LabelledLink = { label: string; link: SiteLink }

/** The bar above the header (Club Settings → Announcement), with only notices showing today. */
export type SiteAnnouncement = {
  style: 'classic' | 'rotator' | 'utility'
  tone: 'brand' | 'accent' | 'subtle'
  items: { tag: string; message: string; link: LabelledLink | null; expiresAt: string }[]
  /** Style C: the course status, unless it is more than 24 hours old. */
  status: { state: StatusState; label: string } | null
  /** Style C: the header phone number. */
  phone: string | null
}

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
  location: {
    latitude: number | null
    longitude: number | null
    mapLabel: string | null
    what3words: string | null
  }
  announcement: SiteAnnouncement | null
  footer: {
    style: FooterStyle
    about: string | null
    linkColumns: { heading: string; links: LabelledLink[] }[]
    hours: { place: string; times: string }[]
    hoursLink: LabelledLink | null
    email: string | null
    address: string | null
    directions: string | null
    social: { network: string; url: string }[]
    secondaryButton: LabelledLink | null
    legalLinks: LabelledLink[]
  }
  /** Club Settings → Privacy & legal (the privacy policy and cookie banner). */
  privacy: PrivacySettings
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
  footer?: {
    style?: string | null
    about?: string | null
    linkColumns?: { heading?: string | null; links?: { link?: RawLink | null }[] | null }[] | null
    hours?: { place?: string | null; times?: string | null }[] | null
    hoursLink?: RawLink | null
    email?: string | null
    address?: string | null
    directions?: string | null
    social?: { network?: string | null; url?: string | null }[] | null
    secondaryButton?: RawLink | null
    legalLinks?: { link?: RawLink | null }[] | null
  }
  announcement?: {
    style?: string | null
    tone?: string | null
    showStatus?: boolean | null
    items?:
      | {
          message?: string | null
          tag?: string | null
          startsAt?: string | null
          expiresAt?: string | null
          link?: RawLink | null
        }[]
      | null
  }
  location?: {
    latitude?: number | null
    longitude?: number | null
    mapLabel?: string | null
    what3words?: string | null
  }
  privacy?: {
    legalName?: string | null
    email?: string | null
    newsletterProvider?: string | null
    gaMeasurementId?: string | null
    additionalInfo?: unknown
  }
}

const idOf = (v: unknown) =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String(v.id) : null

const HEADER_STYLES: HeaderStyle[] = ['classic', 'transparent', 'appBar']
const FOOTER_STYLES: FooterStyle[] = ['brandColumns', 'lightColumns', 'editorial']
const SOCIAL = ['instagram', 'facebook', 'x', 'youtube', 'linkedin', 'tiktok']

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
    select: {
      clubName: true,
      branding: true,
      header: true,
      footer: true,
      location: true,
      announcement: true,
      privacy: true,
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const s = (docs[0] ?? {}) as RawSettings
  const b = s.branding ?? {}
  const h = s.header ?? {}
  const f = s.footer ?? {}

  const rawLinks: RawLink[] = [
    ...(h.booking ? [h.booking] : []),
    ...(h.menu ?? []).flatMap((m) => [
      ...(m.link ? [m.link] : []),
      ...(m.groups ?? []).flatMap((g) => (g.links ?? []).map((l) => l.link ?? {})),
    ]),
    ...(f.linkColumns ?? []).flatMap((c) => (c.links ?? []).map((l) => l.link ?? {})),
    ...(f.hoursLink ? [f.hoursLink] : []),
    ...(f.secondaryButton ? [f.secondaryButton] : []),
    ...(f.legalLinks ?? []).map((l) => l.link ?? {}),
    ...(s.announcement?.items ?? []).map((i) => i.link ?? {}),
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

  const labelled = (raw: RawLink | null | undefined): LabelledLink | null => {
    const link = toLink(raw)
    const label = raw?.label?.trim()
    return link && label ? { label, link } : null
  }
  const text = (v: string | null | undefined) => v?.trim() || null

  const bookingLink = toLink(h.booking)
  const bookingLabel = h.booking?.label?.trim()

  const announcement = await loadAnnouncement(payload, tenantID, s.announcement, {
    labelled,
    phone: h.phone?.trim() || null,
  })

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
    location: {
      latitude: typeof s.location?.latitude === 'number' ? s.location.latitude : null,
      longitude: typeof s.location?.longitude === 'number' ? s.location.longitude : null,
      mapLabel: s.location?.mapLabel?.trim() || null,
      what3words: /^[a-z]+\.[a-z]+\.[a-z]+$/.test(s.location?.what3words?.trim() ?? '')
        ? (s.location?.what3words?.trim() ?? null)
        : null,
    },
    announcement,
    footer: {
      style: FOOTER_STYLES.includes(f.style as FooterStyle)
        ? (f.style as FooterStyle)
        : 'brandColumns',
      about: text(f.about),
      linkColumns: (f.linkColumns ?? [])
        .map((c) => ({
          heading: c.heading?.trim() ?? '',
          links: (c.links ?? []).flatMap((l) => labelled(l.link) ?? []),
        }))
        .filter((c) => c.heading && c.links.length > 0),
      hours: (f.hours ?? []).flatMap((r) =>
        r.place?.trim() && r.times?.trim()
          ? [{ place: r.place.trim(), times: r.times.trim() }]
          : [],
      ),
      hoursLink: labelled(f.hoursLink),
      email: text(f.email),
      address: text(f.address),
      directions: isSafeURL(f.directions) ? f.directions.trim() : null,
      social: (f.social ?? []).flatMap((x) =>
        x.network && SOCIAL.includes(x.network) && x.url && /^https:\/\/\S+$/.test(x.url.trim())
          ? [{ network: x.network, url: x.url.trim() }]
          : [],
      ),
      secondaryButton: labelled(f.secondaryButton),
      legalLinks: (f.legalLinks ?? []).flatMap((l) => labelled(l.link) ?? []),
    },
    privacy: {
      legalName: text(s.privacy?.legalName),
      email: text(s.privacy?.email),
      newsletterProvider: text(s.privacy?.newsletterProvider),
      gaMeasurementId: isGAMeasurementID(s.privacy?.gaMeasurementId)
        ? s.privacy.gaMeasurementId.trim()
        : null,
      additionalInfo: s.privacy?.additionalInfo ?? null,
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
    // No `select`: a file's address is worked out from its folder and stored name.
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

/** One of the club's pages by its address, with its blocks ready to draw, or null. */
export const loadClubPage = async (tenantID: string, slug: string) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { tenant: { equals: tenantID } }] },
    select: { title: true, slug: true, layout: true, updatedAt: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const doc = docs[0]
  if (!doc) return null
  const layout = (doc.layout ?? []) as NonNullable<Page['layout']>
  return {
    title: String(doc.title),
    slug: String(doc.slug),
    updatedAt: doc.updatedAt ? String(doc.updatedAt) : null,
    layout,
    ctx: await loadBlockContext(payload, tenantID, layout),
  }
}

const ANNOUNCEMENT_STYLES = ['classic', 'rotator', 'utility'] as const
const TONES = ['brand', 'accent', 'subtle'] as const
const TAGS: Record<string, string> = {
  notice: 'Notice',
  event: 'Event',
  course: 'Course',
  offer: 'Offer',
}
/** A day as YYYY-MM-DD in the UK, so "until 31 Oct" means the whole of 31 October here. */
const ukDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

const loadAnnouncement = async (
  payload: Payload,
  tenantID: string,
  raw: RawSettings['announcement'],
  {
    labelled,
    phone,
  }: { labelled: (l: RawLink | null | undefined) => LabelledLink | null; phone: string | null },
): Promise<SiteAnnouncement | null> => {
  const style = ANNOUNCEMENT_STYLES.find((x) => x === raw?.style) ?? 'classic'
  const tone = TONES.find((x) => x === raw?.tone) ?? 'brand'
  const now = siteToday()
  const today = ukDay(now)
  const items = (raw?.items ?? []).flatMap((i) => {
    const message = i.message?.trim()
    if (!message || !i.expiresAt) return []
    if (i.startsAt && ukDay(new Date(i.startsAt)) > today) return []
    if (ukDay(new Date(i.expiresAt)) < today) return []
    return [
      {
        tag: TAGS[i.tag ?? ''] ?? 'Notice',
        message,
        link: labelled(i.link),
        expiresAt: i.expiresAt,
      },
    ]
  })
  const shown = style === 'rotator' ? items : items.slice(0, 1)

  let status: SiteAnnouncement['status'] = null
  if (style === 'utility' && raw?.showStatus !== false) {
    const { docs } = await payload.find({
      collection: 'course-status',
      where: { tenant: { equals: tenantID } },
      select: { state: true, updatedAt: true },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const d = docs[0]
    const fresh =
      d && now.getTime() - new Date(d.updatedAt).getTime() <= STATUS_STALE_HOURS * 3_600_000
    if (d && fresh) {
      const label = STATUS_STATES.find((x) => x.value === d.state)?.label ?? d.state
      status = { state: d.state, label: `Course ${label.toLowerCase()}` }
    }
  }

  const utilityPhone = style === 'utility' ? phone : null
  if (shown.length === 0 && !status && !utilityPhone) return null
  return { style, tone, items: shown, status, phone: utilityPhone }
}
