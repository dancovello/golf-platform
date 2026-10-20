import { describe, expect, it } from 'vitest'

import { sitePreviewEnabled } from '@/site/preview'

import {
  brandCSSVariables,
  contrast,
  DEFAULT_BRAND,
  deriveSolidRoles,
  deriveTheme,
  mix,
  photoShade,
  RAISED,
  type Brand,
} from '@/theme/colour'

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))

// Exported from the Figma Theme collection (file GXzYibwnWKKyTeUkwRn8Of), both modes.
const figma: { name: string; brand: Brand; derived: Record<string, string> }[] = [
  {
    name: 'Default tenant',
    brand: DEFAULT_BRAND,
    derived: {
      'surface/subtle': '#eae8e1',
      'text/secondary': '#5c5f5b',
      'text/brand': '#545f50',
      'text/accent': '#c6af89',
      'border/subtle': '#dedcd6',
      'action/on-accent': '#111814',
      'action/on-solid': '#faf7f1',
    },
  },
  {
    name: 'Demo · Coastal links',
    brand: {
      primary: '#16324f',
      secondary: '#6e8ca0',
      accent: '#c9a13b',
      light: '#f6f4ef',
      dark: '#0f1a24',
    },
    derived: {
      'surface/subtle': '#e6e8e6',
      'text/secondary': '#596065',
      'text/brand': '#526a7b',
      'text/accent': '#d6b86c',
      'border/subtle': '#dadad7',
      'action/on-accent': '#0f1a24',
      'action/on-solid': '#f6f4ef',
    },
  },
]

describe('brand colour contract', () => {
  for (const tenant of figma) {
    it(`derives the same colours as Figma for "${tenant.name}"`, () => {
      const derived = deriveSolidRoles(tenant.brand)
      for (const [role, value] of Object.entries(tenant.derived)) {
        // Within one shade per channel: Figma rounds exact halves down, CSS rounds them up.
        const ours = channels(derived[role as keyof typeof derived])
        channels(value).forEach((c, i) =>
          expect(Math.abs(c - ours[i]), role).toBeLessThanOrEqual(1),
        )
      }
    })

    it(`keeps every designed colour for "${tenant.name}" (they all pass)`, () => {
      const theme = deriveTheme(tenant.brand)
      const designed = deriveSolidRoles(tenant.brand)
      expect(theme.page).toEqual({
        text: tenant.brand.dark,
        muted: designed['text/secondary'],
        eyebrow: designed['text/brand'],
      })
      expect(theme.brand.text).toBe(designed['action/on-solid'])
      expect(theme.brand.eyebrow).toBe(designed['text/accent'])
      expect(theme.onAccent).toBe(designed['action/on-accent'])
      expect(theme.image).toEqual({
        text: tenant.brand.light,
        shade: tenant.brand.dark,
        eyebrow: designed['text/accent'],
      })
    })
  }

  it('gives a light brand colour dark text', () => {
    const theme = deriveTheme({ ...DEFAULT_BRAND, primary: '#e8d9a8' })
    expect(theme.brand.text).toBe(DEFAULT_BRAND.dark)
    expect(contrast(theme.brand.eyebrow, '#e8d9a8')).toBeGreaterThanOrEqual(4.5)
  })

  it("falls back to white or black when the club's own text colours can't be read", () => {
    // A mid-grey brand colour: neither Light nor Dark reaches 4.5:1 on it... but black does.
    const theme = deriveTheme({ ...DEFAULT_BRAND, primary: '#767676', dark: '#3a3a3a' })
    expect(['#000000', '#ffffff']).toContain(theme.brand.text)
    expect(contrast(theme.brand.text, '#767676')).toBeGreaterThanOrEqual(4.5)
  })

  it('makes every text colour readable for any five colours (2,000 random palettes)', () => {
    let seed = 42
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 256
    const colour = () =>
      '#' + [0, 0, 0].map(() => Math.floor(random()).toString(16).padStart(2, '0')).join('')
    for (let n = 0; n < 2000; n++) {
      const brand: Brand = {
        primary: colour(),
        secondary: colour(),
        accent: colour(),
        light: mix(colour(), 15, '#ffffff'),
        dark: mix(colour(), 25, '#000000'),
      }
      const theme = deriveTheme(brand)
      const subtle = deriveSolidRoles(brand)['surface/subtle']
      const reads = (fg: string, bg: string) =>
        expect(
          contrast(fg, bg),
          `${fg} on ${bg} in ${JSON.stringify(brand)}`,
        ).toBeGreaterThanOrEqual(4.5)
      for (const bg of [brand.light, RAISED, subtle]) {
        reads(theme.page.text, bg)
        reads(theme.page.muted, bg)
        reads(theme.page.eyebrow, bg)
      }
      reads(theme.brand.text, brand.primary)
      reads(theme.brand.muted, brand.primary)
      reads(theme.brand.eyebrow, brand.primary)
      reads(theme.onAccent, brand.accent)
      const photo = colour()
      const { shade, eyebrow } = photoShade(photo, theme, brand)
      const shaded = mix(theme.image.shade, shade, photo)
      reads(theme.image.text, shaded)
      reads(mix(theme.image.text, 80, shaded), shaded)
      reads(theme.image.text, mix(brand.light, 10, shaded))
      reads(eyebrow, shaded)
    }
  })

  it('shades a bright photo more than a dark one, and an unmeasured one as if white', () => {
    const theme = deriveTheme(DEFAULT_BRAND)
    const dark = photoShade('#202020', theme, DEFAULT_BRAND).shade
    const bright = photoShade('#f0e8d0', theme, DEFAULT_BRAND).shade
    expect(dark).toBe(0)
    expect(bright).toBeGreaterThan(40)
    expect(photoShade(null, theme, DEFAULT_BRAND).shade).toBe(
      photoShade('#ffffff', theme, DEFAULT_BRAND).shade,
    )
  })

  it('never lets anything but a #RRGGBB colour into the page', () => {
    for (const bad of ['red', '#fff', '#1B2A22;} body{display:none', 'url(x)', '']) {
      expect(() => brandCSSVariables({ ...DEFAULT_BRAND, primary: bad })).toThrow()
    }
  })
})

describe('staging preview switch', () => {
  const run = (env: Record<string, string | undefined>) => {
    const saved = { ...process.env }
    Object.assign(process.env, env)
    try {
      return sitePreviewEnabled()
    } finally {
      process.env = saved
    }
  }

  it('is off unless SITE_PREVIEW=on', () => {
    expect(run({ SITE_PREVIEW: undefined, VERCEL_ENV: 'preview' })).toBe(false)
    expect(run({ SITE_PREVIEW: 'on', VERCEL_ENV: 'preview' })).toBe(true)
  })

  it('is never on in production, even if switched on by mistake', () => {
    expect(run({ SITE_PREVIEW: 'on', VERCEL_ENV: 'production' })).toBe(false)
  })
})
