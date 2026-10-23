import { describe, expect, it } from 'vitest'

import { DIAL_SWATCHES, readDial } from '@/marketing/demo/tokenDial'
import { AA_TEXT, contrast, DEFAULT_BRAND, deriveTheme } from '@/theme/colour'

// The Token Dial says what a club site really does with a colour (src/theme/colour.ts).

describe('the Token Dial', () => {
  const swatch = (name: string) => DIAL_SWATCHES.find((s) => s.name === name)!

  it('every swatch gives buttons text that passes WCAG AA, and the colour is never changed', () => {
    for (const s of DIAL_SWATCHES) {
      const reading = readDial(DEFAULT_BRAND, s)
      expect(reading.brand.accent).toBe(s.hex)
      expect(reading.ratio).toBeGreaterThanOrEqual(AA_TEXT)
      // The same answer the club site's theme gives.
      const onAccent = deriveTheme(reading.brand).onAccent
      expect(Math.round(contrast(onAccent, s.hex) * 10) / 10).toBe(reading.ratio)
    }
  })

  it('pale colours get the dark text, with the reason', () => {
    const primrose = readDial(DEFAULT_BRAND, swatch('Primrose'))
    expect(primrose.text).toBe('dark')
    expect(primrose.otherRatio).toBeLessThan(AA_TEXT)
    expect(primrose.note).toMatch(/^Light text would read at 1\.\d:1 on Primrose/)
    expect(primrose.note).toContain('Your colour stays exactly as you picked it.')
  })

  it('deep colours keep the light text', () => {
    expect(readDial(DEFAULT_BRAND, swatch('Navy')).text).toBe('light')
    expect(readDial(DEFAULT_BRAND, swatch('Claret')).text).toBe('light')
  })
})
