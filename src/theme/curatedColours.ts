import type { Brand, BrandInput } from './colour'

/**
 * Colours we know look right on a golf club site (Dan, 2026-10-20). The Branding page offers
 * these so a club that is "just playing" gets a heritage shade rather than, say, hot pink.
 * A club with its own brand colours can still type any code.
 *
 * Each field has its own list because each does a different job (doc 08): Primary shades are
 * deep so light text reads on them, Accent shades are mid-tone, and so on. Any mix of shades
 * from these lists passes the save check; tests/unit/curated-colours.spec.ts proves it.
 */
export type ColourFamily = { family: string; shades: string[] }

export const CURATED_SHADES: Record<BrandInput, ColourFamily[]> = {
  primary: [
    { family: 'Greens', shades: ['#1B2A22', '#1F3B2D', '#24402F', '#2F4A3A', '#38452C'] },
    { family: 'Blues', shades: ['#16233A', '#1C2D4A', '#253A55', '#1E3F46', '#20404F'] },
    { family: 'Reds', shades: ['#4A1C26', '#5A1F2B', '#5E2621'] },
    { family: 'Pinks', shades: ['#5B2340', '#6B2E46', '#6E3A4E'] },
    { family: 'Purples', shades: ['#33203F', '#3F2C4E', '#4A3552'] },
    { family: 'Browns', shades: ['#33261D', '#4A3626', '#4F3A2A'] },
    { family: 'Greys', shades: ['#25292B', '#2F3538', '#3A3F42'] },
  ],
  secondary: [
    { family: 'Greens', shades: ['#717E6A', '#6B8574', '#6E7A55', '#5E7A66'] },
    { family: 'Blues', shades: ['#6B7A86', '#647D93', '#5E8288', '#6C7894'] },
    { family: 'Reds', shades: ['#9A6B6B', '#8E6A5E'] },
    { family: 'Pinks', shades: ['#9A7478', '#A0727F', '#8C7280'] },
    { family: 'Purples', shades: ['#85728A', '#7A7090', '#8A7A94'] },
    { family: 'Browns', shades: ['#9A7660', '#857A6E', '#8A7B64'] },
    { family: 'Greys', shades: ['#7A7E80', '#8A8478', '#787C74'] },
  ],
  accent: [
    { family: 'Golds', shades: ['#B39462', '#C2A060', '#C9A43A', '#D2B272', '#A88B4A'] },
    { family: 'Coppers', shades: ['#B87447', '#C08552', '#C9825F', '#A97A4E'] },
    { family: 'Reds', shades: ['#C76E5E', '#D08770'] },
    { family: 'Pinks', shades: ['#D69CA0', '#D9A7A8', '#C98B97', '#E0B1AE'] },
    { family: 'Purples', shades: ['#A895B8', '#B8A3C4'] },
    { family: 'Blues', shades: ['#8FB3C9', '#9CB8D0', '#7FA9BE'] },
    { family: 'Greens', shades: ['#9CC0B4', '#A9BE8F', '#8FB49A', '#B5C48A'] },
  ],
  light: [
    { family: 'Warm', shades: ['#FAF7F1', '#FBF9F3', '#F6F1E7', '#F4EFE6'] },
    { family: 'Cool', shades: ['#F7F8F8', '#F3F5F4', '#F2F5F7'] },
    { family: 'Tinted', shades: ['#FBF5F3', '#F7F4F8', '#F4F6F0'] },
  ],
  dark: [
    { family: 'Warm', shades: ['#111814', '#1C1512', '#1A1612'] },
    { family: 'Cool', shades: ['#1A1C1E', '#111827', '#0F1A1F'] },
    { family: 'Tinted', shades: ['#1A1219', '#0F1A14', '#1E1418'] },
  ],
}

/** Whole five-colour palettes, one click to apply. Every colour comes from the lists above. */
export const READY_MADE_PALETTES: { name: string; brand: Brand }[] = [
  {
    name: 'Parkland',
    brand: {
      primary: '#1B2A22',
      secondary: '#717E6A',
      accent: '#B39462',
      light: '#FAF7F1',
      dark: '#111814',
    },
  },
  {
    name: 'Coastal links',
    brand: {
      primary: '#1E3F46',
      secondary: '#5E8288',
      accent: '#D2B272',
      light: '#F3F5F4',
      dark: '#0F1A1F',
    },
  },
  {
    name: 'Royal navy',
    brand: {
      primary: '#16233A',
      secondary: '#647D93',
      accent: '#C2A060',
      light: '#F7F8F8',
      dark: '#111827',
    },
  },
  {
    name: 'Claret and gold',
    brand: {
      primary: '#5A1F2B',
      secondary: '#9A6B6B',
      accent: '#C2A060',
      light: '#FBF9F3',
      dark: '#1C1512',
    },
  },
  {
    name: 'Heathland',
    brand: {
      primary: '#3F2C4E',
      secondary: '#85728A',
      accent: '#A9BE8F',
      light: '#F7F4F8',
      dark: '#1A1219',
    },
  },
  {
    name: 'Rose garden',
    brand: {
      primary: '#6B2E46',
      secondary: '#A0727F',
      accent: '#E0B1AE',
      light: '#FBF5F3',
      dark: '#1E1418',
    },
  },
  {
    name: 'Moorland',
    brand: {
      primary: '#38452C',
      secondary: '#6E7A55',
      accent: '#C08552',
      light: '#F6F1E7',
      dark: '#1A1612',
    },
  },
  {
    name: 'Slate and copper',
    brand: {
      primary: '#2F3538',
      secondary: '#7A7E80',
      accent: '#B87447',
      light: '#F7F8F8',
      dark: '#1A1C1E',
    },
  },
]
