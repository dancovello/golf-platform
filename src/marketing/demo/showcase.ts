import type { PanelResults } from '@/site/search/panelData'
import type { PanelShortcut } from '@/site/search/SearchPanel'
import type { QuickAccess } from '@/search/answers'
import type { RateTableBlock } from '@/payload-types'
import type { SiteEvent } from '@/site/events'
import type { SiteCourseStatus } from '@/site/blocks/resolve'

import { demoPicture } from './clubs'

/**
 * Sample club data for the Website builder page's feature showcase. The pieces drawn from it are
 * the club site's own components (Course status, Event card, Rate table, the header search); only
 * what they show is made up, for the demo club.
 */

/** Course status as the greenkeeper posted it at 06:12; the trolley rule is what changes. */
export const showcaseStatus = (trolleys: 'allowed' | 'paths'): SiteCourseStatus => {
  const posted = new Date()
  posted.setHours(6, 12, 0, 0)
  return {
    state: 'open',
    reason: 'Greens cut and rolled this morning.',
    facilities: [
      { label: 'Greens', state: 'open', value: 'Cut & rolled' },
      { label: 'Tees', state: 'open', value: 'Main tees in play' },
      trolleys === 'allowed'
        ? { label: 'Trolleys', state: 'open', value: 'Allowed' }
        : { label: 'Trolleys', state: 'restricted', value: 'Paths only' },
      { label: 'Bunkers', state: 'open', value: 'Raked, playable' },
    ],
    changedBy: 'Duty manager',
    updatedAt: posted.toISOString(),
    stale: false,
  }
}

const link = { kind: 'url', href: '#' } as const

const event = (
  e: Partial<SiteEvent> & Pick<SiteEvent, 'id' | 'title' | 'startsAt'>,
): SiteEvent => ({
  category: 'competition',
  categoryLabel: 'Competition',
  venue: 'Clubhouse',
  timeNote: null,
  summary: null,
  image: null,
  price: null,
  memberPrice: null,
  booking: 'book',
  link,
  capacity: null,
  placesLeft: null,
  featured: false,
  ...e,
})

export const SHOWCASE_EVENTS: SiteEvent[] = [
  event({
    id: 'captains-day',
    title: 'Captain’s Day',
    startsAt: '2027-06-12T07:00:00.000Z',
    timeNote: 'shotgun',
    venue: 'First tee',
    image: demoPicture('heath-dawn', 1200, 800),
    price: '£45',
    memberPrice: '£38',
  }),
  event({
    id: 'greensomes',
    title: 'Mixed Greensomes',
    startsAt: '2027-06-20T12:30:00.000Z',
    venue: 'First tee',
    image: demoPicture('pine-morning', 1200, 800),
    price: '£30',
    memberPrice: '£25',
  }),
  event({
    id: 'summer-supper',
    title: 'Summer Supper',
    category: 'social',
    categoryLabel: 'Social',
    startsAt: '2027-06-25T18:00:00.000Z',
    image: demoPicture('links-evening', 1200, 800),
    price: '£28',
    booking: 'enquire',
  }),
]

const col = (label: string) => ({ label })

/** The Rate table block (Classic) with the winter weekday rate as it was, and as it becomes. */
export const showcaseRates = (weekday: string): RateTableBlock =>
  ({
    blockType: 'rateTable',
    style: 'classic',
    heading: 'Green fees',
    columns: [col('Mon–Thu'), col('Fri–Sun & BH')],
    tabs: [
      {
        label: 'Winter 2026/27',
        sections: [
          {
            name: 'Winter',
            rows: [
              { label: '18 holes', price1: weekday, price2: '£70' },
              { label: 'Twilight', subLabel: 'After 2pm', price1: '£35', price2: '£40' },
              { label: 'Junior', subLabel: 'Under 18', price1: '£20', price2: '£25' },
            ],
          },
        ],
      },
    ],
  }) as unknown as RateTableBlock

export const SEARCH_QUERY = 'winter green fees'

export const SEARCH_SHORTCUTS: PanelShortcut[] = [
  { label: 'Book a tee time', detail: null, href: '#', newTab: false },
  { label: 'Membership', detail: null, href: '#', newTab: false },
]
export const SEARCH_CONTACT: PanelShortcut = {
  label: 'Contact the club',
  detail: null,
  href: '#',
  newTab: false,
}

export const SEARCH_QUICK: QuickAccess = {
  items: [
    { label: 'Course status', detail: 'Open · updated 06:12', href: '#' },
    { label: 'Green fees', detail: 'From £20', href: '#' },
    { label: 'Opening hours', detail: 'Open today 07:00 – 19:00', href: '#' },
  ],
  eventsHeading: 'This week at the club',
  events: SHOWCASE_EVENTS.slice(0, 3).map((e) => ({
    title: e.title,
    when:
      e.id === 'captains-day'
        ? 'Sat 12 Jun, 08:00'
        : e.id === 'greensomes'
          ? 'Sun 20 Jun, 13:30'
          : 'Fri 25 Jun, 19:00',
    href: '#',
    image: e.image ? { url: e.image.url, srcSet: null, position: e.image.position } : null,
  })),
}

export const SEARCH_RESULTS: PanelResults = {
  query: SEARCH_QUERY,
  total: 2,
  suggestion: null,
  answer: {
    kind: 'fees',
    eyebrow: 'Top answer',
    title: 'Green fees',
    source: 'From Visitors & green fees, updated 3 November',
    facts: [
      { value: '£55', label: 'Winter · 18 holes · Mon–Thu' },
      { value: '£70', label: 'Winter · 18 holes · Fri–Sun & BH' },
    ],
    actions: [{ label: 'All prices', href: '#', primary: false }],
  },
  best: {
    kind: 'page',
    id: 'visitors',
    title: 'Visitors & green fees',
    meta: 'Visit',
    href: '#',
    newTab: false,
    image: null,
  },
  groups: [
    {
      kind: 'page',
      count: 1,
      items: [
        {
          kind: 'page',
          id: 'visitors',
          title: 'Visitors & green fees',
          meta: 'Visit',
          href: '#',
          newTab: false,
          image: null,
        },
      ],
    },
    {
      kind: 'document',
      count: 1,
      items: [
        {
          kind: 'document',
          id: 'winter-rules',
          title: 'Winter rules',
          meta: 'PDF',
          href: '#',
          newTab: true,
          image: null,
        },
      ],
    },
  ],
}
