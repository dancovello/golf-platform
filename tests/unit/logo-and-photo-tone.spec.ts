import sharp from 'sharp'
import { describe, expect, it } from 'vitest'

import { measureImage } from '@/media/measure'
import { chooseLogo } from '@/site/components/Logo'
import type { SiteImage } from '@/site/loadClub'
import { DEFAULT_BRAND, luminance } from '@/theme/colour'

const logo = (url: string, colour: string | null): SiteImage => ({
  url,
  alt: '',
  width: 200,
  height: 60,
  colour,
})
const black = logo('/black.png', '#111111')
const white = logo('/white.png', '#f5f5f5')

describe('choosing the logo by its background', () => {
  it('uses each logo where it was meant to go', () => {
    const logos = { onLight: black, onDark: white }
    expect(chooseLogo(DEFAULT_BRAND, logos, 'page')).toMatchObject({ image: black })
    expect(chooseLogo(DEFAULT_BRAND, logos, 'brand')).toMatchObject({ image: white })
    expect(chooseLogo(DEFAULT_BRAND, logos, 'image')).toMatchObject({ image: white })
  })

  it('swaps them when they were uploaded the wrong way round', () => {
    const logos = { onLight: white, onDark: black }
    expect(chooseLogo(DEFAULT_BRAND, logos, 'page')).toMatchObject({ image: black })
    expect(chooseLogo(DEFAULT_BRAND, logos, 'image')).toMatchObject({ image: white })
  })

  it('shows a dark-only logo in white over a dark photo or band (the Foxhills case)', () => {
    const logos = { onLight: black, onDark: black }
    expect(chooseLogo(DEFAULT_BRAND, logos, 'image')).toEqual({
      kind: 'image',
      image: black,
      recolour: 'white',
    })
    expect(chooseLogo(DEFAULT_BRAND, logos, 'brand')).toMatchObject({ recolour: 'white' })
    expect(chooseLogo(DEFAULT_BRAND, logos, 'page')).toMatchObject({ recolour: 'none' })
  })

  it('follows a light brand colour: the dark logo on a light footer band', () => {
    const brand = { ...DEFAULT_BRAND, primary: '#e8d9a8' }
    expect(chooseLogo(brand, { onLight: black, onDark: white }, 'brand')).toMatchObject({
      image: black,
      recolour: 'none',
    })
  })

  it('trusts an older, unmeasured logo in its own slot, and falls back to the club name', () => {
    const old = logo('/old.png', null)
    expect(chooseLogo(DEFAULT_BRAND, { onLight: null, onDark: old }, 'image')).toMatchObject({
      image: old,
      recolour: 'none',
    })
    expect(chooseLogo(DEFAULT_BRAND, { onLight: null, onDark: null }, 'page')).toEqual({
      kind: 'wordmark',
    })
  })
})

describe('measuring an uploaded image', () => {
  const png = (svg: string) => sharp(Buffer.from(svg)).png().toBuffer()

  it('finds a bright sky in a mostly dark photo', async () => {
    const photo = await png(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
        <rect width="200" height="200" fill="#202020"/>
        <rect width="200" height="40" fill="#f4ecd8"/>
      </svg>`,
    )
    const tone = await measureImage(photo)
    expect(luminance(tone!.bright)).toBeGreaterThan(0.7)
    expect(luminance(tone!.average)).toBeLessThan(0.3)
  })

  it("ignores a logo's transparent background", async () => {
    const mark = await png(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60">
        <rect x="20" y="10" width="160" height="40" fill="#101010"/>
      </svg>`,
    )
    expect(luminance((await measureImage(mark))!.average)).toBeLessThan(0.02)
  })

  it('returns nothing for a file that is not an image', async () => {
    expect(await measureImage(Buffer.from('not an image'))).toBeNull()
  })
})
