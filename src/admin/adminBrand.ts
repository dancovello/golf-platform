/**
 * The platform's own mark in the admin (Dan, 2026-11-04): the A1 wordmark in place of Payload's
 * logo, drawn from src/marketing/site/assets/logo.svg. Kept free of imports so payload.config.ts
 * can use it for the browser-tab icon.
 *
 * The wordmark is light grey and lime, made for dark backgrounds, so the admin always draws it on
 * a dark panel (src/admin/AdminLogo.tsx).
 */
export const ADMIN_BRAND_NAME = 'A1 Engine'
export const ADMIN_PANEL = '#14161a'
const GREY = '#e5e5e5'
const LIME = '#d6df23'

/** The wordmark's letters, as drawn in a 1096.58 × 173.41 box. */
export const WORDMARK_PATHS: readonly string[] = [
  'M58.87,11.36h29.77l59.09,159.1h-25.91l-12.5-34.55H37.73l-12.5,34.55H0L58.87,11.36ZM101.59,113.87l-27.27-75h-1.59l-27.27,75h56.14Z',
  'M202.5,53.41h-43.18v-18.86c29.77,0,44.77-7.05,44.77-23.18h22.73v159.1h-24.32V53.41Z',
  'M309.54,121.59h23.86c.23,16.36,13.64,29.32,35.68,29.32,18.86,0,31.59-8.64,31.59-22.96,0-42.96-86.14-11.14-86.14-75.23,0-24.09,19.55-44.32,53.18-44.32,27.05,0,54.09,14.54,54.55,47.73h-24.77c0-15.68-10.68-25.68-30-25.68s-28.64,10.46-28.64,21.82c0,38.41,87.05,9.55,87.05,73.87,0,26.59-21.14,47.27-57.73,47.27-34.09,0-58.64-21.14-58.64-51.82Z',
  'M460.67,132.73v-61.59h-21.36v-19.32h15.68c4.09,0,7.05-2.96,7.05-7.73v-26.14h22.5v33.64h34.55v19.55h-34.55v60.91c0,11.36,4.77,18.18,17.27,18.18h16.14v20.23h-19.77c-23.41,0-37.5-12.96-37.5-37.73Z',
  'M540.22,127.96V51.59h23.86v72.05c0,16.82,11.59,27.73,26.59,27.73,16.59,0,28.87-12.73,28.87-30V51.59h23.86v118.87h-23.18v-15.91h-1.59c-4.77,9.77-17.05,18.86-34.77,18.86-27.05,0-43.64-19.77-43.64-45.46Z',
  'M664.54,111.37c0-36.82,23.41-62.73,56.59-62.73,22.73,0,35,14.09,38.86,20.23h1.59V0h23.86v170.46h-23.41v-16.82h-1.36c-3.18,4.55-14.77,19.77-38.41,19.77-34.09,0-57.73-25.23-57.73-62.05ZM762.27,111.14c0-25.68-15.91-40.68-36.82-40.68s-36.59,16.82-36.59,40.68,15,40.68,36.82,40.68,36.59-18.18,36.59-40.68Z',
  'M814.31,51.59h23.86v118.87h-23.86V51.59Z',
  'M858.62,111.14c0-35.68,26.36-62.5,62.96-62.5s62.5,27.05,62.5,62.5-26.36,62.27-62.73,62.27-62.73-26.59-62.73-62.27ZM959.76,111.14c0-23.64-15.91-40.68-38.41-40.68s-38.41,17.27-38.41,40.68,16.14,40.68,38.41,40.68,38.41-17.27,38.41-40.68Z',
  'M1000.67,135.23h22.5c1.59,12.27,10.46,18.64,25.91,18.64s24.32-7.05,24.32-17.5c0-29.09-69.55-4.55-69.55-52.96,0-20,17.73-34.77,45-34.77,23.86,0,42.5,12.95,44.32,35.68h-21.82c-1.36-10-9.09-16.59-23.41-16.59-13.41,0-21.82,6.36-21.82,15.23,0,26.37,70.46,1.82,70.46,52.27,0,22.5-18.41,38.18-48.18,38.18s-46.14-15.23-47.73-38.18Z',
]

/** The small squares: the dot of the "i" and the full stop. */
export const WORDMARK_SQUARES = [
  { x: 814.33, y: 0, size: 23.88, fill: GREY },
  { x: 260.89, y: 149.5, size: 23.88, fill: LIME },
] as const

export const WORDMARK_BOX = { width: 1096.58, height: 173.41 } as const
export const WORDMARK_GREY = GREY

/** Just the "A1" at the start of the wordmark, for small spaces. */
export const MARK_PATHS = WORDMARK_PATHS.slice(0, 2)
export const MARK_BOX = { width: 232, height: 173.41 } as const

/** The browser-tab icon: the mark on the dark panel, as a self-contained picture. */
export const ADMIN_FAVICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-40 -80 312 333.41"><rect x="-40" y="-80" width="312" height="333.41" rx="40" fill="${ADMIN_PANEL}"/>` +
      MARK_PATHS.map((d) => `<path fill="${GREY}" d="${d}"/>`).join('') +
      '</svg>',
  )
