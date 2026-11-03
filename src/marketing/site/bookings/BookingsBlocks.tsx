import type { CSSProperties } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import type { MarketingBookingDemoBlock } from '@/payload-types'
import { DEMO_CLUBS, demoPicture } from '@/marketing/demo/clubs'
import { brandCSSVariables } from '@/theme/colour'

import { ClubSettingsPanel } from './ClubSettingsPanel'
import { type Facility, FacilitiesCarousel } from './FacilitiesCarousel'
import { TeeSheetSimulator } from './TeeSheetSimulator'

const club = DEMO_CLUBS[0]

/** Figma Facilities Carousel copy (184:3613). Examples, as the page's label says. */
const FACILITIES: Omit<Facility, 'picture'>[] = [
  {
    tab: 'Range',
    title: 'Floodlit driving range',
    body: '24 floodlit bays. Book a bay by the half hour.',
    slots: [
      ['17:30 · Bay 4', '£12 / 30 min'],
      ['18:00 · Bay 11', '£12 / 30 min'],
      ['18:30 · Bay 2', '£12 / 30 min'],
    ],
    button: 'Book a bay',
  },
  {
    tab: 'Activities',
    title: 'Indoor simulators',
    body: 'Play 100 championship courses when it’s blowing a gale outside.',
    slots: [
      ['10:00 · Sim 1', '£30 / hour'],
      ['12:00 · Sim 2', '£30 / hour'],
      ['15:00 · Sim 1', '£30 / hour'],
    ],
    button: 'Book a simulator',
  },
  {
    tab: 'Spa',
    title: 'Spa & recovery',
    body: 'Sports massage and the sauna after eighteen holes.',
    slots: [
      ['14:00 · Massage', '£55 / 50 min'],
      ['15:30 · Massage', '£55 / 50 min'],
      ['16:00 · Sauna', '£55 / 50 min'],
    ],
    button: 'Book a treatment',
  },
]
const PICTURES = ['heathland', 'links', 'lakeside']

/** One Coming next booking preview, optionally with the label saying it isn't live. */
export const BookingDemo = ({ block }: { block: MarketingBookingDemoBlock }) => {
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  return (
    <div className="mk-booking-demo" style={theme}>
      {block.showLabel ? (
        <p className="mk-preview-label">
          <span className="mk-preview-label-lead">Coming next · designs from our build</span>
          <span>Not live yet. Prices and times are examples.</span>
        </p>
      ) : null}
      {block.demo === 'teeSheet' ? <TeeSheetSimulator /> : null}
      {block.demo === 'clubSettings' ? <ClubSettingsPanel /> : null}
      {block.demo === 'facilities' ? (
        <FacilitiesCarousel
          facilities={FACILITIES.map((f, i) => ({
            ...f,
            picture: demoPicture(PICTURES[i])?.url ?? '',
          }))}
        />
      ) : null}
    </div>
  )
}
