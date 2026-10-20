/**
 * Tee colours (Figma "Tee Marker"). System colours, the same for every club; always shown
 * with a word, never colour alone. A plain module so the website can use it without the CMS.
 */
export const TEE_COLOURS = [
  { label: 'White', value: 'white' },
  { label: 'Yellow', value: 'yellow' },
  { label: 'Red', value: 'red' },
  { label: 'Blue', value: 'blue' },
] as const

export type TeeColour = (typeof TEE_COLOURS)[number]['value']

/** The holes field that holds a tee's yardage, e.g. "yardsWhite". */
export const yardsField = (colour: TeeColour) =>
  `yards${colour[0].toUpperCase()}${colour.slice(1)}` as
    'yardsWhite' | 'yardsYellow' | 'yardsRed' | 'yardsBlue'
