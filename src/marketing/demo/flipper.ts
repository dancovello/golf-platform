import { FONT_SETS, type FontSetID } from '@/theme/fontSets'

import { DEMO_CLUBS, type DemoClub } from './clubs'

/**
 * The Block Flipper's variants (Figma Marketing/Block Flipper 183:2796: "Card stack of one
 * block's variants (Hero A/B/C)"): one demo club's hero in each of the three hero styles.
 */
export const FLIPPER_CLUB: DemoClub = DEMO_CLUBS[0]

/**
 * Each hero is shown under a different one of the club template's three header styles (Dan,
 * 28 Oct): Transparent sits over a full-bleed hero, so it goes with Heritage; Classic and App
 * bar sit above the page, so they go with Resort and Booking-led.
 */
export const FLIPPER_STYLES = [
  { id: 'heritage', label: 'Hero · Heritage', header: 'transparent', headerLabel: 'Transparent' },
  { id: 'resort', label: 'Hero · Resort', header: 'classic', headerLabel: 'Classic' },
  { id: 'bookingLed', label: 'Hero · Booking-led', header: 'appBar', headerLabel: 'App bar' },
] as const

export type FlipperStyle = (typeof FLIPPER_STYLES)[number]['id']

/** Each hero is shown in a different font pack, so the variants differ in type as well as layout. */
export const FLIPPER_FONT_SETS: Record<FlipperStyle, FontSetID> = {
  heritage: 'heritage',
  resort: 'editorial',
  bookingLed: 'contemporary',
}

/** The short name of a variant's font pack: "Heritage", "Editorial". */
export const flipperFontName = (style: FlipperStyle) =>
  FONT_SETS[FLIPPER_FONT_SETS[style]].label.split(':')[0]

/** The demo club's hero copy in another hero style. */
export const flipperHero = (style: FlipperStyle): DemoClub['hero'] =>
  ({ ...FLIPPER_CLUB.hero, style }) as DemoClub['hero']

/** The widths each device is drawn at (the club template's Figma frames). */
export const DEVICES = [
  { id: 'desktop', label: 'Desktop', width: 1366 },
  { id: 'tablet', label: 'Tablet', width: 768 },
  { id: 'mobile', label: 'Mobile', width: 390 },
] as const

export type DeviceID = (typeof DEVICES)[number]['id']
