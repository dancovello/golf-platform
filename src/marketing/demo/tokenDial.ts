import { type Brand, contrast, deriveTheme } from '@/theme/colour'

/** Marketing/Token Dial's swatches (Figma 183:2866), in order. */
export const DIAL_SWATCHES = [
  { name: 'Fairway', hex: '#1F4D3A' },
  { name: 'Navy', hex: '#1D3557' },
  { name: 'Claret', hex: '#6D1F2B' },
  { name: 'Gold', hex: '#C9A227' },
  { name: 'Sky', hex: '#8EC5E8' },
  { name: 'Primrose', hex: '#F2E28C' },
] as const

export type DialReading = {
  /** The demo club with the picked colour as its accent (the booking button). */
  brand: Brand
  /** Which of the club's text colours sits on it. */
  text: 'light' | 'dark'
  /** That text on the picked colour, e.g. 14.2. */
  ratio: number
  /** The other text colour on it, which the site doesn't use when it's hard to read. */
  otherRatio: number
  /** What happened, in a sentence (read out when it changes). */
  note: string
}

const round = (n: number) => Math.round(n * 10) / 10

/**
 * What a club site does with a picked colour (src/theme/colour.ts, the brand colour contract):
 * the colour itself is never changed; text on it uses whichever of the club's light and dark
 * text colours reads better, so buttons always reach WCAG AA (4.5:1).
 */
export const readDial = (base: Brand, swatch: (typeof DIAL_SWATCHES)[number]): DialReading => {
  const brand = { ...base, accent: swatch.hex }
  const onAccent = deriveTheme(brand).onAccent
  const text = onAccent.toLowerCase() === brand.dark.toLowerCase() ? 'dark' : 'light'
  const ratio = round(contrast(onAccent, swatch.hex))
  const other = text === 'dark' ? brand.light : brand.dark
  const otherRatio = round(contrast(other, swatch.hex))
  const note =
    text === 'dark'
      ? `Light text would read at ${otherRatio}:1 on ${swatch.name}, so its buttons use your dark text colour instead. Your colour stays exactly as you picked it.`
      : `${swatch.name} is deep enough for light text, so its buttons keep your light text colour.`
  return { brand, text, ratio, otherRatio, note }
}
