// The font files live in ./font-files (latin subset, from Fontsource 5.3.0, SIL Open Font
// License: see the .LICENSE.txt files). Served from our own domain, and builds never need to
// reach Google. preload is off: each page only uses the two fonts of its club's set.
import localFont from 'next/font/local'

import type { FontSetID } from '@/theme/fontSets'

const cormorant = localFont({
  src: [
    {
      path: './font-files/cormorant-garamond-latin-300-normal.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: './font-files/cormorant-garamond-latin-400-normal.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './font-files/cormorant-garamond-latin-300-italic.woff2',
      weight: '300',
      style: 'italic',
    },
  ],
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'serif'],
})
const dmSans = localFont({
  src: [
    { path: './font-files/dm-sans-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './font-files/dm-sans-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
})
const fraunces = localFont({
  src: [
    { path: './font-files/fraunces-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './font-files/fraunces-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './font-files/fraunces-latin-300-italic.woff2', weight: '300', style: 'italic' },
  ],
  display: 'swap',
  preload: false,
  fallback: ['Georgia', 'serif'],
})
const manrope = localFont({
  src: [
    { path: './font-files/manrope-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './font-files/manrope-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
})
const archivo = localFont({
  src: [
    { path: './font-files/archivo-latin-300-normal.woff2', weight: '300', style: 'normal' },
    { path: './font-files/archivo-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './font-files/archivo-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './font-files/archivo-latin-300-italic.woff2', weight: '300', style: 'italic' },
  ],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
})
const inter = localFont({
  src: [
    { path: './font-files/inter-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './font-files/inter-latin-500-normal.woff2', weight: '500', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'sans-serif'],
})

const sets: Record<FontSetID, { display: string; body: string }> = {
  heritage: { display: cormorant.style.fontFamily, body: dmSans.style.fontFamily },
  editorial: { display: fraunces.style.fontFamily, body: manrope.style.fontFamily },
  contemporary: { display: archivo.style.fontFamily, body: inter.style.fontFamily },
}

/** The CSS variables that point a page at its club's font set. */
export const fontSetVariables = (id: FontSetID): Record<string, string> => ({
  '--font-display': sets[id].display,
  '--font-body': sets[id].body,
})
