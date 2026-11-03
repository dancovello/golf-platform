// The marketing site's font (Silka, by Hopp Studio's licence: see font-files/silka.LICENSE.txt).
// One family for headings and text. The files live in ./font-files (WOFF2, the smallest web
// format). Served from our own domain; builds never need to reach Google. Preloaded: every
// marketing page uses it. Two variables keep the existing --mk-font-display / --mk-font-text names.
// next/font reads these options at build time, so they must be written out literally.
import localFont from 'next/font/local'

export const silkaDisplay = localFont({
  src: [
    { path: './font-files/silka-regular.woff2', weight: '400', style: 'normal' },
    { path: './font-files/silka-medium.woff2', weight: '500', style: 'normal' },
  ],
  variable: '--mk-font-display',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})

export const silka = localFont({
  src: [
    { path: './font-files/silka-light.woff2', weight: '300', style: 'normal' },
    { path: './font-files/silka-regular.woff2', weight: '400', style: 'normal' },
    { path: './font-files/silka-medium.woff2', weight: '500', style: 'normal' },
    { path: './font-files/silka-semibold.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--mk-font-text',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
})
