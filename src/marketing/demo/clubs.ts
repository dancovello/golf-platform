import { sceneSVG, type SceneOptions } from '@/demo/sceneSVG'
import type { SiteMedia } from '@/site/blocks/media'
import type { BlockContext, ResolvedLink, SiteCourseStatus } from '@/site/blocks/resolve'
import type { ClubSite } from '@/site/loadClub'
import { siteToday } from '@/site/today'
import { type Brand, DEFAULT_BRAND } from '@/theme/colour'
import type { FontSetID } from '@/theme/fontSets'
import type { Page } from '@/payload-types'

/**
 * The marketing site's three demo clubs (Figma Marketing/Tenant Morph, 176:2177). Fictional,
 * always labelled "Demo club", and never in the database (decision B, 2026-10-21): their content
 * lives here and is drawn by the real club block components. Pictures are drawn in code
 * (src/demo/sceneSVG.ts), not photos.
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
      'heath-dawn',
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
      'links-evening',
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
      'pine-morning',
      'Demo club  ·  Visitors welcome',
      'Your morning on the Championship course',
      null,
      null,
    ),
  },
]

const SCENES: Record<string, SceneOptions> = {
  'heath-dawn': { sky: 'dawn', land: 'heath', seed: 2 },
  'links-evening': { sky: 'evening', land: 'links', seed: 3 },
  'pine-morning': { sky: 'morning', land: 'pine', seed: 4 },
  'autumn-noon': { sky: 'noon', land: 'autumn', seed: 6 },
}

/** A demo picture as SiteMedia: the drawing inline (no file, no request). */
export const demoPicture = (key: string, width = 2400, height = 1350): SiteMedia | null => {
  const options = SCENES[key]
  if (!options) return null
  const svg = sceneSVG(width, height, options)
  return {
    url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    alt: '',
    mimeType: 'image/svg+xml',
    width,
    height,
    srcSet: null,
    position: '50% 60%',
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

/** The ClubSite a club block needs, for a demo club: its name, colours, fonts and booking. */
export const demoClubSite = (club: DemoClub): ClubSite =>
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
      style: 'a',
      booking: { label: 'Book a tee time', link: { kind: 'url', href: '#' } },
      phone: null,
      dropdown: 'simple',
      menu: [],
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
