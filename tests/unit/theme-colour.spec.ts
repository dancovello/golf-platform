import { describe, expect, it } from 'vitest'

import { sitePreviewEnabled } from '@/site/preview'

import {
  brandCSSVariables,
  contrastProblems,
  DEFAULT_BRAND,
  deriveSolidRoles,
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

    it(`accepts the "${tenant.name}" palette`, () => {
      expect(contrastProblems(tenant.brand)).toEqual([])
    })
  }

  it('refuses a palette where text would be hard to read', () => {
    const problems = contrastProblems({ ...DEFAULT_BRAND, dark: '#9a9a9a' })
    expect(problems.map((p) => p.pair)).toContain('Dark text on the Light background')
    expect(problems.every((p) => p.ratio < 4.5)).toBe(true)
  })

  it('refuses an accent that neither Light nor Dark text can sit on', () => {
    const problems = contrastProblems({ ...DEFAULT_BRAND, accent: '#7a7a7a' })
    expect(problems.map((p) => p.pair)).toContain('Text on Accent buttons')
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
