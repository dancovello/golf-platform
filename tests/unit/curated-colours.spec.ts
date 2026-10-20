import { describe, expect, it } from 'vitest'

import {
  BRAND_INPUTS,
  contrast,
  deriveSolidRoles,
  deriveTheme,
  isHex,
  mix,
  type Brand,
} from '@/theme/colour'
import { CURATED_SHADES, READY_MADE_PALETTES } from '@/theme/curatedColours'

const shadesFor = (key: keyof Brand) => CURATED_SHADES[key].flatMap((f) => f.shades)

/**
 * True when no text colour had to change for readability: every one is the designed colour
 * (doc 08). Eyebrows on the brand colour are left out: the old save check never covered them,
 * and some suggested accents sit just under 4.5:1 on some primaries, so the site lightens them.
 */
const keepsDesignedColours = (brand: Brand) => {
  const theme = deriveTheme(brand)
  const designed = deriveSolidRoles(brand)
  return (
    theme.page.text === brand.dark &&
    theme.page.muted === designed['text/secondary'] &&
    theme.page.eyebrow === designed['text/brand'] &&
    theme.brand.text === designed['action/on-solid'] &&
    theme.brand.muted === mix(theme.brand.text, 80, brand.primary) &&
    theme.onAccent === designed['action/on-accent'] &&
    theme.image.text === brand.light &&
    theme.image.eyebrow === designed['text/accent']
  )
}

describe('suggested brand colours', () => {
  it('are all upper-case #RRGGBB codes, with no repeats within a field', () => {
    for (const key of BRAND_INPUTS) {
      const shades = shadesFor(key)
      for (const shade of shades) {
        expect(isHex(shade) && shade === shade.toUpperCase(), `${key} ${shade}`).toBe(true)
      }
      expect(new Set(shades).size, key).toBe(shades.length)
    }
  })

  // The promise to clubs: any mix of suggested shades looks as designed, with no text colour
  // swapped for readability (src/theme/colour.ts).
  it('keep every designed text colour in every combination, eyebrows on bands aside', () => {
    const [primary, secondary, accent, light, dark] = BRAND_INPUTS.map(shadesFor)
    const failures: string[] = []
    for (const p of primary)
      for (const s of secondary)
        for (const a of accent)
          for (const l of light)
            for (const d of dark) {
              const brand = { primary: p, secondary: s, accent: a, light: l, dark: d }
              if (!keepsDesignedColours(brand)) failures.push(JSON.stringify(brand))
            }
    expect(failures.slice(0, 5)).toEqual([])
  })

  it('keep eyebrows on the brand colour readable, even when they have to be lightened', () => {
    for (const primary of shadesFor('primary')) {
      for (const accent of shadesFor('accent')) {
        const brand = { primary, secondary: '#717E6A', accent, light: '#FAF7F1', dark: '#111814' }
        expect(contrast(deriveTheme(brand).brand.eyebrow, primary)).toBeGreaterThanOrEqual(4.5)
      }
    }
  })

  it('make up every ready-made palette', () => {
    for (const { name, brand } of READY_MADE_PALETTES) {
      for (const key of BRAND_INPUTS) {
        expect(shadesFor(key), `${name} ${key}`).toContain(brand[key])
      }
    }
  })
})
