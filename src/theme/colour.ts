/**
 * The brand colour contract (docs/design/08-brand-colour-contract.md) in code.
 *
 * A club sets five colours. Every colour a block uses is a role derived from them by the
 * formulas below, which match the Figma Theme collection exactly (tests/unit/theme-colour.spec.ts
 * checks both Figma tenants). Blocks only ever use the `--color-*` roles.
 *
 * Text is contrast-checked against the background it sits on (WCAG AA, 4.5:1): the designed
 * colour when it passes, otherwise the club's other text colour, otherwise white or black. One
 * of white and black always passes, so any five colours give a legible site.
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

/** WCAG relative luminance, 0 (black) to 1 (white). */
export const luminance = (hex: string) => {
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

/** WCAG AA for normal-size text. Every text colour on the site meets it. */
export const AA_TEXT = 4.5
/** WCAG AA for graphics, used for logos. */
export const AA_GRAPHIC = 3

const WHITE = '#ffffff'
const BLACK = '#000000'
/** color/surface/raised: cards are always white. */
export const RAISED = WHITE

/** Whichever of the club's Light or Dark reads better on `background`. */
export const onColour = (background: string, brand: Brand): string =>
  contrast(brand.light, background) >= contrast(brand.dark, background) ? brand.light : brand.dark

/**
 * The first candidate that reaches 4.5:1 on every one of `backgrounds`. If none does, white or
 * black, whichever reads better.
 */
export const readable = (candidates: string[], backgrounds: string[]): string => {
  const worst = (colour: string) => Math.min(...backgrounds.map((bg) => contrast(colour, bg)))
  return (
    candidates.find((c) => worst(c) >= AA_TEXT) ?? (worst(WHITE) >= worst(BLACK) ? WHITE : BLACK)
  )
}

/** The derived roles whose value is a plain colour, as designed (before any contrast check). */
export const deriveSolidRoles = (brand: Brand) => ({
  'surface/subtle': mix(brand.secondary, 12, brand.light),
  'text/secondary': mix(brand.dark, 68, brand.light),
  'text/brand': mix(brand.secondary, 70, brand.dark),
  'text/accent': mix(brand.accent, 75, '#ffffff'),
  'border/subtle': mix(brand.dark, 12, brand.light),
  'action/on-accent': onColour(brand.accent, brand),
  'action/on-solid': onColour(brand.primary, brand),
})

/** The text colours for one kind of background. */
export type Tone = {
  /** Headings and body text. */
  text: string
  /** Softer supporting text. */
  muted: string
  /** Eyebrows and small highlights. */
  eyebrow: string
}

export type Theme = {
  /**
   * The page, white cards and the light tint (Light, white and Light mixed with Secondary).
   * `faint` is lighter than `muted`, for small counts beside a heading. It is checked on Light
   * and white only, so it is not for the light tint.
   */
  page: Tone & { faint: string }
  /** Brand bands, solid buttons and the dark footer (Primary). */
  brand: Tone
  /** Text on Accent buttons. */
  onAccent: string
  /**
   * Over photos. The photo is shaded with `shade` until `text` reaches 4.5:1 on its brightest
   * part (see photoShade); `muted` is drawn as `text` at 80%.
   */
  image: { text: string; shade: string; eyebrow: string }
}

/** Every text colour the site uses, contrast-checked against what it sits on. */
export const deriveTheme = (brand: Brand): Theme => {
  const designed = deriveSolidRoles(brand)

  const pageBackgrounds = [brand.light, RAISED, designed['surface/subtle']]
  const pageText = readable([brand.dark], pageBackgrounds)

  const byContrast = (bg: string) =>
    [brand.light, brand.dark].sort((a, b) => contrast(b, bg) - contrast(a, bg))
  const onBrand = readable(byContrast(brand.primary), [brand.primary])

  // Photos are shaded towards the darker of Light and Dark, and the lighter one sits on top.
  // If the two are too close to tell apart, white on black.
  const [lighter, darker] = [brand.light, brand.dark].sort((a, b) => luminance(b) - luminance(a))
  const [imageText, shade] =
    contrast(lighter, darker) >= AA_TEXT ? [lighter, darker] : [WHITE, BLACK]

  return {
    page: {
      text: pageText,
      muted: readable([designed['text/secondary'], pageText], pageBackgrounds),
      faint: readable(
        [mix(brand.dark, 60, brand.light), designed['text/secondary'], pageText],
        [brand.light, RAISED],
      ),
      eyebrow: readable([designed['text/brand'], pageText], pageBackgrounds),
    },
    brand: {
      text: onBrand,
      muted: readable([mix(onBrand, 80, brand.primary), onBrand], [brand.primary]),
      eyebrow: readable(
        [designed['text/accent'], brand.accent, mix(brand.accent, 50, onBrand), onBrand],
        [brand.primary],
      ),
    },
    onAccent: readable(byContrast(brand.accent), [brand.accent]),
    image: {
      text: imageText,
      shade,
      eyebrow: readable([designed['text/accent'], imageText], [shade]),
    },
  }
}

/**
 * How much a photo must be shaded (0–100, percent of the theme's shade colour) so that text on
 * it reads at 4.5:1 even over its brightest part. `bright` is that part's colour, measured when
 * the photo was uploaded (src/media/measure.ts); without it, a white photo is assumed.
 *
 * Checks the softer text (80%) and a glass button (Light at 10%) too, and the eyebrow colour
 * (which falls back to the main text colour when this photo is too bright for it).
 */
export const photoShade = (
  bright: string | null | undefined,
  theme: Theme,
  brand: Brand,
): { shade: number; eyebrow: string } => {
  const photo = isHex(bright) ? bright : WHITE
  const { text, shade: colour, eyebrow } = theme.image
  const reads = (fg: string, bg: string) => contrast(fg, bg) >= AA_TEXT
  for (let pct = 0; pct <= 100; pct += 1) {
    const bg = mix(colour, pct, photo)
    const glass = mix(brand.light, 10, bg)
    if (reads(text, bg) && reads(text, glass) && reads(mix(text, 80, bg), bg)) {
      return { shade: pct, eyebrow: reads(eyebrow, bg) ? eyebrow : text }
    }
  }
  return { shade: 100, eyebrow: text }
}

/**
 * The per-club CSS: the five inputs plus every contrast-checked text colour. Every other role is
 * defined once in theme.css from these. Values are re-checked here, so nothing but a strict
 * #RRGGBB colour can ever reach the page.
 */
export const brandCSSVariables = (brand: Brand): Record<string, string> => {
  for (const key of BRAND_INPUTS) {
    if (!isHex(brand[key])) throw new Error(`Club colour "${key}" is not a #RRGGBB colour`)
  }
  const theme = deriveTheme(brand)
  return {
    '--brand-primary': brand.primary,
    '--brand-secondary': brand.secondary,
    '--brand-accent': brand.accent,
    '--brand-light': brand.light,
    '--brand-dark': brand.dark,
    '--ink-page': theme.page.text,
    '--ink-page-muted': theme.page.muted,
    '--ink-page-faint': theme.page.faint,
    '--ink-page-eyebrow': theme.page.eyebrow,
    '--ink-brand': theme.brand.text,
    '--ink-brand-muted': theme.brand.muted,
    '--ink-brand-eyebrow': theme.brand.eyebrow,
    '--ink-image': theme.image.text,
    '--ink-image-eyebrow': theme.image.eyebrow,
    '--image-shade': theme.image.shade,
    '--color-action-on-accent': theme.onAccent,
    '--color-action-on-solid': theme.brand.text,
  }
}
