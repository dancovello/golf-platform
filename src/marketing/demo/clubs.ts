import type { SiteMedia } from '@/site/blocks/media'
import type { BlockContext, ResolvedLink, SiteCourseStatus } from '@/site/blocks/resolve'
import type { ClubSite, HeaderStyle, MenuItem } from '@/site/loadClub'
import { siteToday } from '@/site/today'
import { type Brand, DEFAULT_BRAND } from '@/theme/colour'
import type { FontSetID } from '@/theme/fontSets'
import type { Page } from '@/payload-types'

import { DEMO_PHOTOS, isDemoPhotoKey } from './photos'

/**
 * The marketing site's three demo clubs (Figma Marketing/Tenant Morph, 176:2177). Fictional,
 * always labelled "Demo club", and never in the database (decision B, 2026-10-21): their content
 * lives here and is drawn by the real club block components. Pictures are real
 * golf course photos (./photos.ts).
 */
export type DemoClubID = 'heritage' | 'coastal' | 'bookingLed'

export type DemoClub = {
  id: DemoClubID
  name: string
  /** The style shown on its Tenant Chip. */
  style: string
  domain: string
  /** The Tenant Chip swatch (Figma). */
  swatch: string
  brand: Brand
  fontSet: FontSetID
  hero: Extract<NonNullable<Page['layout']>[number], { blockType: 'hero' }>
}

/** The Figma Theme collection's "Demo · Coastal links" mode (tests/unit/theme-colour.spec.ts). */
const COASTAL: Brand = {
  primary: '#16324f',
  secondary: '#6e8ca0',
  accent: '#c9a13b',
  light: '#f6f4ef',
  dark: '#0f1a24',
}

const hero = (
  style: 'heritage' | 'resort' | 'bookingLed',
  picture: string,
  eyebrow: string,
  headline: string,
  primary: string | null,
  secondary: string | null,
): DemoClub['hero'] =>
  ({
    blockType: 'hero',
    style,
    mediaType: 'image',
    image: picture,
    eyebrow,
    headline,
    primaryButton: primary ? { label: primary, type: 'url', url: '#' } : null,
    secondaryLink: secondary ? { label: secondary, type: 'url', url: '#' } : null,
  }) as unknown as DemoClub['hero']

// Copy from the Figma Tenant Morph frames. Booking-led shows the club's booking button, which
// works today, instead of Figma's tee-time search bar, which is coming next.
export const DEMO_CLUBS: DemoClub[] = [
  {
    id: 'heritage',
    name: 'Ashgrove Park',
    style: 'Heritage',
    domain: 'ashgrovepark.golf',
    swatch: '#1B2A22',
    brand: DEFAULT_BRAND,
    fontSet: 'heritage',
    hero: hero(
      'heritage',
      'heathland',
      'Demo club  ·  Heathland course',
      'The quiet grandeur of heathland golf',
      'Explore the courses',
      'Visitor tee times',
    ),
  },
  {
    id: 'coastal',
    name: 'Carreg Bay Links',
    style: 'Coastal',
    domain: 'carregbay.golf',
    swatch: '#16324F',
    brand: COASTAL,
    fontSet: 'heritage',
    hero: hero(
      'resort',
      'links',
      'Demo club  ·  Resort golf',
      'Thirty-six holes, one unhurried escape',
      'Book a tee time',
      'Plan your stay',
    ),
  },
  {
    id: 'bookingLed',
    name: 'Kingsmere',
    style: 'Booking-led',
    domain: 'kingsmere.golf',
    swatch: '#B39462',
    brand: DEFAULT_BRAND,
    fontSet: 'heritage',
    hero: hero(
      'bookingLed',
      'lakeside',
      'Demo club  ·  Visitors welcome',
      'Your morning on the Championship course',
      null,
      null,
    ),
  },
]

/** A demo picture as SiteMedia: a resized photo, with sizes for srcset. */
export const demoPicture = (key: string): SiteMedia | null => {
  if (!isDemoPhotoKey(key)) return null
  const photo = DEMO_PHOTOS[key]
  const largest = photo.sizes[photo.sizes.length - 1]
  return {
    url: largest.src,
    alt: photo.alt,
    mimeType: 'image/webp',
    width: largest.width,
    height: largest.height,
    srcSet: photo.sizes.map((size) => `${size.src} ${size.width}w`).join(', '),
    position: photo.position,
    shading: { '--photo-shade': '30%' } as SiteMedia['shading'],
  }
}

/** A demo course status: open, changed this morning (never "not updated today"). */
export const demoCourseStatus = (): SiteCourseStatus => {
  const today = siteToday()
  today.setHours(7, 40, 0, 0)
  return {
    state: 'open',
    reason: 'Buggies permitted',
    facilities: [
      { label: 'Buggies', state: 'open', value: null },
      { label: 'Practice ground', state: 'open', value: null },
      { label: 'Trolleys', state: 'open', value: null },
    ],
    changedBy: 'Greenkeeper',
    updatedAt: today.toISOString(),
    stale: false,
  }
}

/**
 * What the club block components get, for a demo: pictures drawn in code, links that go
 * nowhere (the demo is inert), no documents, people or courses unless given.
 */
export const demoContext = (overrides: Partial<BlockContext> = {}): BlockContext => ({
  media: (value) => (typeof value === 'string' ? demoPicture(value) : null),
  link: (value, fallbackLabel) => {
    const v = value as { label?: string } | null | undefined
    const label = v?.label || fallbackLabel
    return label ? ({ label, link: { kind: 'url', href: '#' } } satisfies ResolvedLink) : null
  },
  document: () => null,
  person: () => null,
  course: () => null,
  courseStatus: demoCourseStatus(),
  ...overrides,
})

const demoLink = (label: string): MenuItem => ({
  label,
  link: { kind: 'url', href: '#' },
  overview: null,
  image: null,
  children: [],
  columns: null,
})

/** A typical club menu, for the header in a demo. Every link goes nowhere. */
const DEMO_MENU: MenuItem[] = ['The course', 'Visitors', 'Membership', 'News', 'Contact'].map(
  demoLink,
)

/**
 * The ClubSite a club block needs, for a demo club: its name, colours, fonts and booking. With
 * `headerStyle`, its header too (the block flipper draws the real header above the hero).
 */
export const demoClubSite = (club: DemoClub, headerStyle: HeaderStyle = 'classic'): ClubSite =>
  ({
    tenantID: `demo-${club.id}`,
    slug: `demo-${club.id}`,
    name: club.name,
    brand: club.brand,
    fontSet: club.fontSet,
    strapline: null,
    logoOnLight: null,
    logoOnDark: null,
    header: {
      style: headerStyle,
      booking: { label: 'Book a tee time', link: { kind: 'url', href: '#' } },
      phone: '01234 567890',
      dropdown: 'panel',
      menu: DEMO_MENU,
    },
    location: { latitude: null, longitude: null, mapLabel: null, what3words: null },
    announcement: null,
    footer: {
      style: 'a',
      about: null,
      linkColumns: [],
      hours: [],
      hoursLink: null,
      email: null,
      address: null,
      directions: null,
      social: [],
      secondaryButton: null,
      legalLinks: [],
    },
    privacy: {} as ClubSite['privacy'],
  }) as unknown as ClubSite
