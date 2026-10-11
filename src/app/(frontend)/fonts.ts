// next/font downloads these at build time and serves them from our own domain.
// preload is off: each page only uses the two fonts of its club's set.
import { Archivo, Cormorant_Garamond, DM_Sans, Fraunces, Inter, Manrope } from 'next/font/google'

import type { FontSetID } from '@/theme/fontSets'

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
})
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
})
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
})
const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  preload: false,
})
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  display: 'swap',
  preload: false,
})
const inter = Inter({ subsets: ['latin'], weight: ['400', '500'], display: 'swap', preload: false })

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
