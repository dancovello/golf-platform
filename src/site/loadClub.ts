import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { cache } from 'react'

import type { ClubSetting, Page } from '@/payload-types'

import {
  STATUS_STALE_HOURS,
  STATUS_STATES,
  type StatusState,
} from '@/collections/courseStatusStates'
import { COLUMN_LINK_LIMIT } from './menuLimits'
import { builtInLabel, builtInLink, isSafeURL, linksToPage } from '@/fields/link'
import { measureMissing } from '@/media/measure'
import { loadClubMedia, type SiteMedia } from '@/site/blocks/media'
import { loadBlockContext } from '@/site/blocks/resolve'
import { type Brand, BRAND_INPUTS, DEFAULT_BRAND, isHex } from '@/theme/colour'
import { DEFAULT_FONT_SET, type FontSetID, isFontSetID } from '@/theme/fontSets'

import { isGAMeasurementID, type PrivacySettings } from './privacy/policy'
import { PUBLISHED } from './published'
import { siteToday } from './today'
import { idOf } from '@/blocks/types'

/** A link on the public site: one of the club's pages (by slug) or a checked web address. */
export type SiteLink = { kind: 'page'; slug: string } | { kind: 'url'; href: string }
/**
 * One top-level menu item. With two or more `children` it opens a drop-down (spec 17); with
 * fewer it's a plain link to `link`.
 */
export type MenuItem = {
  label: string
  link: SiteLink | null
  /** The drop-down's "Overview" link: the section's own page. None for "links I choose". */
  overview: SiteLink | null
  /** The section page's hero photo, for the "Panel + picture" drop-down style only. */
  image: SiteMedia | null
  /** Every link in the drop-down. With `columns`, all their headings and links in order. */
  children: LabelledLink[]
  /** A drop-down of two or three pages: one column each. Null for every other menu item. */
  columns: MenuColumn[] | null
}
/** A drop-down column: a page, then its child pages (the first few, then "All … pages"). */
export type MenuColumn = { heading: LabelledLink; links: LabelledLink[]; more: LabelledLink | null }
export type DropdownStyle = 'panel' | 'panelTile'
export type SiteImage = {
  url: string
  alt: string
  width: number | null
  height: number | null
  /** The average colour of its visible pixels, measured on upload (null for older uploads). */
  colour: string | null
}
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
    dropdown: DropdownStyle
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

/**
 * Club Settings as saved, from Payload's generated types, with every value treated as possibly
 * missing: settings saved before a field existed don't have it. Built from the generated type
 * (not written out by hand) so renaming a field shows up here as a type error.
 */
type Loose<T> = T extends (infer U)[]
  ? Loose<U>[]
  : T extends Record<string, unknown>
    ? { [K in keyof T]?: Loose<T[K]> | null }
    : T | null
type RawSettings = Loose<
  Pick<
    ClubSetting,
    'clubName' | 'branding' | 'header' | 'footer' | 'announcement' | 'location' | 'privacy'
  >
>
/** Any link field (src/fields/link.ts). */
type RawLink = {
  label?: string | null
  type?: string | null
  page?: unknown
  url?: string | null
  builtIn?: unknown
}

const HEADER_STYLES: HeaderStyle[] = ['classic', 'transparent', 'appBar']
const FOOTER_STYLES: FooterStyle[] = ['brandColumns', 'lightColumns', 'editorial']
const SOCIAL = ['instagram', 'facebook', 'x', 'youtube', 'linkedin', 'tiktok']

/**
 * Reads what the public site needs for one club. Visitors aren't logged in, so access rules
 * can't scope this: every query filters by the club's own ID explicitly and returns only the
 * fields the site shows. Linked pages and photos are looked up again within the club, so a
 * stray reference to another club's content is dropped, never shown.
 *
 * Loaded once per page view however many parts of the page ask for it (React `cache`: the
 * page title and the page itself both need the club).
 */
export const loadClubBySlug = cache(async (slug: string): Promise<ClubSite | null> => {
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
      ...(m.links ?? []).map((l) => l.link ?? {}),
      ...(m.groups ?? []).flatMap((g) => (g.links ?? []).map((l) => l.link ?? {})),
      ...(m.extraLinks ?? []).map((l) => l.link ?? {}),
    ]),
    ...(f.linkColumns ?? []).flatMap((c) => (c.links ?? []).map((l) => l.link ?? {})),
    ...(f.hoursLink ? [f.hoursLink] : []),
    ...(f.secondaryButton ? [f.secondaryButton] : []),
    ...(f.legalLinks ?? []).map((l) => l.link ?? {}),
    ...(s.announcement?.items ?? []).map((i) => i.link ?? {}),
  ]
  const dropdown: DropdownStyle = h.dropdown === 'panelTile' ? 'panelTile' : 'panel'
  /** A drop-down's pages: "Pages in the drop-down", or the one page chosen before that list
   * existed (copied over by the 20261020 migration; kept as a fallback). */
  const sectionsOf = (m: NonNullable<typeof h.menu>[number]): string[] => {
    const chosen = (m.sections ?? []).flatMap((x) => idOf(x.page) ?? [])
    const legacy = idOf(m.page)
    return chosen.length > 0 ? chosen : legacy ? [legacy] : []
  }
  const sectionPages = (h.menu ?? []).flatMap((m) => (m.kind === 'children' ? sectionsOf(m) : []))
  // These don't depend on each other, so they're looked up at the same time.
  const [pages, images, family, heroPhotos] = await Promise.all([
    clubPages(
      payload,
      tenantID,
      rawLinks.map((l) => (linksToPage(l.type) ? idOf(l.page) : null)),
    ),
    clubImages(payload, tenantID, [idOf(b.logoOnLight), idOf(b.logoOnDark)]),
    // Menu items and footer columns that list a page's child pages.
    clubPageFamilies(payload, tenantID, [
      ...sectionPages,
      ...(f.linkColumns ?? []).map((c) => (c.source === 'children' ? idOf(c.page) : null)),
    ]),
    dropdown === 'panelTile'
      ? clubHeroPhotos(payload, tenantID, sectionPages)
      : new Map<string, SiteMedia>(),
  ])

  const toLink = (raw: RawLink | null | undefined): SiteLink | null => {
    if (!raw) return null
    if (raw.type === 'url') return isSafeURL(raw.url) ? { kind: 'url', href: raw.url.trim() } : null
    if (raw.type === 'builtIn') return builtInLink(raw.builtIn)
    const page = pages.get(idOf(raw.page) ?? '')
    return page ? { kind: 'page', slug: page.slug } : null
  }
  /** What a link left without text shows: the name of the page it goes to. */
  const nameOf = (raw: RawLink | null | undefined): string | undefined => {
    if (!raw || raw.type === 'url') return undefined
    if (raw.type === 'builtIn') return builtInLabel(raw.builtIn)
    return pages.get(idOf(raw.page) ?? '')?.title
  }

  const labelled = (raw: RawLink | null | undefined): LabelledLink | null => {
    const link = toLink(raw)
    const label = raw?.label?.trim() || nameOf(raw)
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
      dropdown,
      menu: (h.menu ?? [])
        .map((m): MenuItem => {
          const text = m.label?.trim() ?? ''
          const plain = (link: SiteLink | null, name?: string): MenuItem => ({
            label: text || name || '',
            link,
            overview: null,
            image: null,
            children: [],
            columns: null,
          })
          // Items saved before "What it does" existed: groups mean a drop-down.
          const kind = m.kind ?? ((m.groups ?? []).length > 0 ? 'manual' : 'link')
          if (kind === 'link') return plain(toLink(m.link), nameOf(m.link))
          if (kind === 'children') {
            // Only this club's published pages: anything else is left out.
            const sections = sectionsOf(m).flatMap((id) => {
              const page = family.parents.get(id)
              return page ? [{ id, page }] : []
            })
            const label = text || sections[0]?.page.label || ''
            if (sections.length > 1) {
              const columns = sections.map(({ id, page }): MenuColumn => {
                const links = family.children.get(id) ?? []
                return {
                  heading: page,
                  links: links.slice(0, COLUMN_LINK_LIMIT),
                  more:
                    links.length > COLUMN_LINK_LIMIT
                      ? { label: `All ${page.label} pages`, link: page.link }
                      : null,
                }
              })
              return {
                label,
                link: null,
                overview: null,
                image: null,
                children: columns.flatMap((c) => [
                  c.heading,
                  ...c.links,
                  ...(c.more ? [c.more] : []),
                ]),
                columns,
              }
            }
            // One page: its child pages. The page itself is reached through "Overview", so it
            // isn't listed.
            const parentID = sections[0]?.id ?? ''
            const parent = sections[0]?.page
            const children = [
              ...(family.children.get(parentID) ?? []),
              ...(m.extraLinks ?? []).flatMap((l) => labelled(l.link) ?? []),
            ]
            // A page with fewer than two child pages is just a link to it.
            if (children.length < 2) return plain(parent?.link ?? null, label)
            return {
              label,
              link: parent?.link ?? null,
              overview: parent?.link ?? null,
              image: heroPhotos.get(parentID) ?? null,
              children,
              columns: null,
            }
          }
          // "Links I type": one list. Before that list existed, the links of every group (whose
          // headings were never shown); the 20261020 migration copied them over.
          const typed =
            (m.links ?? []).length > 0 ? m.links : (m.groups ?? []).flatMap((g) => g.links ?? [])
          const children = (typed ?? []).flatMap((l) => labelled(l.link) ?? [])
          if (children.length < 2) return plain(children[0]?.link ?? null, children[0]?.label)
          return { label: text, link: null, overview: null, image: null, children, columns: null }
        })
        .filter((m) => m.label && (m.link || m.children.length > 0)),
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
          links:
            c.source === 'children'
              ? (family.children.get(idOf(c.page) ?? '') ?? [])
              : (c.links ?? []).flatMap((l) => labelled(l.link) ?? []),
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
})

/** Addresses and names of the given pages, only if they belong to this club. */
const clubPages = async (payload: Payload, tenantID: string, ids: (string | null)[]) => {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (wanted.length === 0) return new Map<string, { slug: string; title: string }>()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenantID } }, PUBLISHED] },
    select: { slug: true, title: true },
    limit: wanted.length,
    depth: 0,
    overrideAccess: true,
  })
  return new Map(docs.map((d) => [String(d.id), { slug: String(d.slug), title: d.title }]))
}

/** Slugs of the given pages, only if they belong to this club. */
export const clubPageSlugs = async (payload: Payload, tenantID: string, ids: (string | null)[]) =>
  new Map([...(await clubPages(payload, tenantID, ids))].map(([id, p]) => [id, p.slug]))

/**
 * For menu items and footer columns that list a page's child pages: each chosen page (as a
 * link with its title) and its child pages, in "Position" order then A–Z, leaving out pages
 * marked "Leave out of drop-downs". Only pages of this club, so another club's page is never
 * listed even if a stray reference points at it.
 */
const clubPageFamilies = async (payload: Payload, tenantID: string, ids: (string | null)[]) => {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  const parents = new Map<string, LabelledLink>()
  const children = new Map<string, LabelledLink[]>()
  if (wanted.length === 0) return { parents, children }
  const [{ docs: tops }, { docs: kids }] = await Promise.all([
    payload.find({
      collection: 'pages',
      where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenantID } }, PUBLISHED] },
      select: { title: true, slug: true },
      limit: wanted.length,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'pages',
      where: {
        and: [
          { parent: { in: wanted } },
          { tenant: { equals: tenantID } },
          { hideFromMenu: { not_equals: true } },
          PUBLISHED,
        ],
      },
      select: { title: true, slug: true, parent: true, menuPosition: true },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
  ])
  for (const p of tops) {
    parents.set(String(p.id), { label: p.title, link: { kind: 'page', slug: String(p.slug) } })
  }
  const sorted = [...kids].sort(
    (a, b) => (a.menuPosition ?? 1000) - (b.menuPosition ?? 1000) || a.title.localeCompare(b.title),
  )
  for (const p of sorted) {
    const parent = idOf(p.parent) ?? ''
    if (!parents.has(parent)) continue
    children.set(parent, [
      ...(children.get(parent) ?? []),
      { label: p.title, link: { kind: 'page', slug: String(p.slug) } },
    ])
  }
  return { parents, children }
}

/** Public addresses of the given images, only if they belong to this club. */
/**
 * The photo from each page's first hero block (only this club's published pages), by page ID:
 * the picture tile in "Panel + picture" drop-downs.
 */
const clubHeroPhotos = async (payload: Payload, tenantID: string, ids: (string | null)[]) => {
  const wanted = [...new Set(ids.filter((id): id is string => Boolean(id)))]
  if (wanted.length === 0) return new Map<string, SiteMedia>()
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ id: { in: wanted } }, { tenant: { equals: tenantID } }, PUBLISHED] },
    select: { layout: true },
    limit: wanted.length,
    depth: 0,
    overrideAccess: true,
  })
  const photoOf = new Map<string, string>()
  for (const page of docs) {
    const hero = (page.layout ?? []).find((b) => b.blockType === 'hero')
    const photo = hero && 'image' in hero ? idOf(hero.image) : null
    if (photo) photoOf.set(String(page.id), photo)
  }
  const media = await loadClubMedia(payload, tenantID, [...photoOf.values()])
  return new Map(
    [...photoOf].flatMap(([page, photo]) => {
      const m = media.get(photo)
      return m?.mimeType.startsWith('image/') ? [[page, m] as const] : []
    }),
  )
}

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
  measureMissing(payload, docs)
  return new Map(
    docs
      .filter((d) => typeof d.url === 'string' && String(d.mimeType ?? '').startsWith('image/'))
      .map((d) => [
        String(d.id),
        {
          url: String(d.url),
          alt: d.alt ?? '',
          width: d.width ?? null,
          height: d.height ?? null,
          colour: isHex(d.tone?.average) ? d.tone.average : null,
        },
      ]),
  )
}

/** One of the club's pages by its address, with its blocks ready to draw, or null. `draft`
 * (the live preview only, for the club's own editors) shows the latest draft instead. */
export const loadClubPage = async (
  tenantID: string,
  slug: string,
  { draft = false }: { draft?: boolean } = {},
) => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'pages',
    draft,
    where: {
      and: [
        { slug: { equals: slug } },
        { tenant: { equals: tenantID } },
        ...(draft ? [] : [PUBLISHED]),
      ],
    },
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
