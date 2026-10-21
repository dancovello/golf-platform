// The marketing site's two fonts (hand-off §8). The files live in ./font-files (latin subset,
// from Fontsource 5.3.0, SIL Open Font License: see the .LICENSE.txt files). Served from our own
// domain; builds never need to reach Google. Preloaded: every marketing page uses both.
import localFont from 'next/font/local'

export const newsreader = localFont({
  src: [{ path: './font-files/newsreader-latin-400-normal.woff2', weight: '400', style: 'normal' }],
  variable: '--mk-font-display',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
})

export const hankenGrotesk = localFont({
  src: [
    { path: './font-files/hanken-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './font-files/hanken-grotesk-latin-500-normal.woff2', weight: '500', style: 'normal' },
    { path: './font-files/hanken-grotesk-latin-600-normal.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--mk-font-text',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
