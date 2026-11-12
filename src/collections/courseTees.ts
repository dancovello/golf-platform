/**
 * Tee colours (Figma "Tee Marker"). System colours, the same for every club; always shown
 * with a word, never colour alone. A plain module so the website can use it without the CMS.
 * A course has up to four tees, each a different colour; black is for clubs whose back tees
 * sit behind the whites (course tour, 12 Nov 2026).
 */
export const TEE_COLOURS = [
  { label: 'White', value: 'white' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
  { label: 'Black', value: 'black' },
] as const

export type TeeColour = (typeof TEE_COLOURS)[number]['value']

/** The holes field that holds a tee's yardage, e.g. "yardsWhite". */
export const yardsField = (colour: TeeColour) =>
  `yards${colour[0].toUpperCase()}${colour.slice(1)}` as
    'yardsWhite' | 'yardsYellow' | 'yardsRed' | 'yardsBlue' | 'yardsBlack'

/** The longest name a club can give a tee, e.g. "Championship Back Markers". */
export const TEE_NAME_MAX = 25

/** A tee's name on the website: the club's own, or else its colour ("White"). */
export const teeName = (tee: { colour: TeeColour; name?: string | null }) =>
  tee.name?.trim() || (TEE_COLOURS.find((c) => c.value === tee.colour)?.label ?? tee.colour)
