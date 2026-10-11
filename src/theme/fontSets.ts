/**
 * The font sets a club can choose from: a heading (display) face and a body face that work
 * together. Free, openly licensed and served from our own site (no requests to Google).
 * The fonts themselves are loaded in src/app/(frontend)/fonts.ts.
 */
export const FONT_SETS = {
  heritage: {
    label: 'Heritage: Cormorant Garamond + DM Sans',
    display: 'Cormorant Garamond',
    body: 'DM Sans',
  },
  editorial: { label: 'Editorial: Fraunces + Manrope', display: 'Fraunces', body: 'Manrope' },
  contemporary: { label: 'Contemporary: Archivo + Inter', display: 'Archivo', body: 'Inter' },
} as const

export type FontSetID = keyof typeof FONT_SETS

export const DEFAULT_FONT_SET: FontSetID = 'heritage'

export const isFontSetID = (value: unknown): value is FontSetID =>
  typeof value === 'string' && Object.hasOwn(FONT_SETS, value)
