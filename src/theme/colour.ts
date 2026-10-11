/**
 * The brand colour contract (docs/design/08-brand-colour-contract.md) in code.
 *
 * A club sets five colours. Every colour a block uses is a role derived from them by the
 * formulas below, which match the Figma Theme collection exactly (tests/unit/theme-colour.spec.ts
 * checks both Figma tenants). Blocks only ever use the `--color-*` roles.
 */

export type BrandInput = 'primary' | 'secondary' | 'accent' | 'light' | 'dark'
export type Brand = Record<BrandInput, string>

export const BRAND_INPUTS: readonly BrandInput[] = [
  'primary',
  'secondary',
  'accent',
  'light',
  'dark',
]

/** The Figma "Default tenant" palette: used until a club sets its own. */
export const DEFAULT_BRAND: Brand = {
  primary: '#1B2A22',
  secondary: '#717E6A',
  accent: '#B39462',
  light: '#FAF7F1',
  dark: '#111814',
}

const HEX = /^#[0-9a-f]{6}$/i

export const isHex = (value: unknown): value is string =>
  typeof value === 'string' && HEX.test(value)

type RGB = [number, number, number]

const toRGB = (hex: string): RGB => {
  if (!isHex(hex)) throw new Error(`Not a #RRGGBB colour: ${String(hex)}`)
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB
}

const toHex = (rgb: RGB) =>
  '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')

/** CSS `color-mix(in srgb, a pct%, b)`, for two opaque colours. */
export const mix = (a: string, pct: number, b: string): string => {
  const [x, y] = [toRGB(a), toRGB(b)]
  return toHex(x.map((c, i) => c * (pct / 100) + y[i] * (1 - pct / 100)) as RGB)
}

const luminance = (hex: string) => {
  const [r, g, b] = toRGB(hex).map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** WCAG contrast ratio, 1 to 21. */
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return (hi + 0.05) / (lo + 0.05)
}

/** Whichever of the club's Light or Dark reads better on `background`. */
export const onColour = (background: string, brand: Brand): string =>
  contrast(brand.light, background) >= contrast(brand.dark, background) ? brand.light : brand.dark

/** The derived roles whose value is a plain colour (the ones the save check needs). */
export const deriveSolidRoles = (brand: Brand) => ({
  'surface/subtle': mix(brand.secondary, 12, brand.light),
  'text/secondary': mix(brand.dark, 68, brand.light),
  'text/brand': mix(brand.secondary, 70, brand.dark),
  'text/accent': mix(brand.accent, 75, '#ffffff'),
  'border/subtle': mix(brand.dark, 12, brand.light),
  'action/on-accent': onColour(brand.accent, brand),
  'action/on-solid': onColour(brand.primary, brand),
})

/** `field` is the club colour to change to fix it. */
export type ContrastProblem = { pair: string; field: BrandInput; ratio: number }

const MIN_RATIO = 4.5

/** Doc 08 rule 4: the pairings that must reach 4.5:1 before a club's colours can be saved. */
export const contrastProblems = (brand: Brand): ContrastProblem[] => {
  const roles = deriveSolidRoles(brand)
  const pairs: [string, BrandInput, string, string][] = [
    ['Dark text on the Light background', 'dark', brand.dark, brand.light],
    ['Secondary text on the Light background', 'dark', roles['text/secondary'], brand.light],
    [
      'Eyebrow text (Secondary mixed with Dark) on the Light background',
      'secondary',
      roles['text/brand'],
      brand.light,
    ],
    ['Text on Accent buttons', 'accent', roles['action/on-accent'], brand.accent],
    ['Text on Primary buttons and bands', 'primary', roles['action/on-solid'], brand.primary],
  ]
  return pairs
    .map(([pair, field, fg, bg]) => ({
      pair,
      field,
      ratio: Math.round(contrast(fg, bg) * 100) / 100,
    }))
    .filter((p) => p.ratio < MIN_RATIO)
}

/**
 * The per-club CSS: the five inputs plus the two auto-contrast colours. Every other role is
 * defined once in theme.css from these. Values are re-checked here, so nothing but a strict
 * #RRGGBB colour can ever reach the page.
 */
export const brandCSSVariables = (brand: Brand): Record<string, string> => {
  for (const key of BRAND_INPUTS) {
    if (!isHex(brand[key])) throw new Error(`Club colour "${key}" is not a #RRGGBB colour`)
  }
  const roles = deriveSolidRoles(brand)
  return {
    '--brand-primary': brand.primary,
    '--brand-secondary': brand.secondary,
    '--brand-accent': brand.accent,
    '--brand-light': brand.light,
    '--brand-dark': brand.dark,
    '--color-action-on-accent': roles['action/on-accent'],
    '--color-action-on-solid': roles['action/on-solid'],
  }
}
