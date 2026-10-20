import { describe, expect, it } from 'vitest'

import { BRAND_INPUTS, contrastProblems, isHex, type Brand } from '@/theme/colour'
import { CURATED_SHADES, READY_MADE_PALETTES } from '@/theme/curatedColours'

const shadesFor = (key: keyof Brand) => CURATED_SHADES[key].flatMap((f) => f.shades)

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

  // The promise to clubs: any mix of suggested shades can be saved.
  it('pass the save check in every combination', () => {
    const [primary, secondary, accent, light, dark] = BRAND_INPUTS.map(shadesFor)
    const failures: string[] = []
    for (const p of primary)
      for (const s of secondary)
        for (const a of accent)
          for (const l of light)
            for (const d of dark) {
              const brand = { primary: p, secondary: s, accent: a, light: l, dark: d }
              if (contrastProblems(brand).length > 0) failures.push(JSON.stringify(brand))
            }
    expect(failures.slice(0, 5)).toEqual([])
  })

  it('make up every ready-made palette', () => {
    for (const { name, brand } of READY_MADE_PALETTES) {
      for (const key of BRAND_INPUTS) {
        expect(shadesFor(key), `${name} ${key}`).toContain(brand[key])
      }
    }
  })
})
