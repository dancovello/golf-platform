/**
 * The content security policy: which scripts, pictures, frames and connections a page may use
 * (doc 04 §8; approved by Dan 2026-10-21). Built per request by src/proxy.ts with a fresh
 * one-time code (nonce): only scripts carrying it run, plus the scripts those load
 * ('strict-dynamic': Turnstile, and Google Analytics after cookie consent).
 *
 * - Club sites (own domains and /preview): enforced.
 * - The admin (/admin): enforced since 10 Nov 2026 (ADMIN_ENFORCED below). It was report-only
 *   first, and those reports were misleading: while a policy is report-only, Next.js doesn't
 *   put the one-time code on the page's own scripts, so every script was reported. Enforced,
 *   every script carries it (checked on every admin screen and by the browser tests).
 * - The company's marketing site: enforced, and without the club-only extras (the map). Each is
 *   added back only when a marketing page needs it. It has Cloudflare's spam check, for the
 *   homepage request form (Switching page), and Google Analytics only when MARKETING_GA_ID is
 *   set (production), after the visitor accepts cookies.
 *
 * Kept free of imports so the proxy can use it without loading Payload.
 */

/** 'platform': every other page on the platform's own address (the API, /health, the
 * "accounts are made by the administrator" page). Enforced, with no club extras (headers audit,
 * finding 3). */
export type PolicyKind = 'site' | 'admin' | 'marketing' | 'platform'

/** The admin's policy blocks, rather than only reports (see above). Set to false to go back to
 * report-only in an emergency, but expect every script to be reported while it is. */
export const ADMIN_ENFORCED = true

/** Where browsers send reports of anything blocked (src/app/(frontend)/csp-report). */
export const REPORT_PATH = '/csp-report'

const originOf = (value: string | undefined): string | null => {
  if (!value) return null
  try {
    return new URL(value.trim()).origin
  } catch {
    return null
  }
}

type Env = {
  NODE_ENV?: string
  VERCEL_ENV?: string
  MEDIA_PUBLIC_URL?: string
  MEDIA_S3_ENDPOINT?: string
  MARKETING_GA_ID?: string
}

// Cloudflare's spam check on the contact form.
const TURNSTILE = 'https://challenges.cloudflare.com'
// Google Analytics, only for clubs with an ID and only after the visitor accepts cookies.
const GOOGLE_ANALYTICS = [
  'https://*.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
]
// The interactive map (loads when the visitor asks for it).
const OPENSTREETMAP = 'https://www.openstreetmap.org'
// Videos kept on YouTube or Vimeo (src/blocks/video). They load only when a visitor presses
// play. YouTube's "no cookie" address, Vimeo's player: nothing else may be framed.
const VIDEO_PLAYERS = ['https://www.youtube-nocookie.com', 'https://player.vimeo.com']
// Vercel's comment toolbar on staging and pull-request previews, never on production
// (Dan, 2026-10-21; Vercel's documented list).
const VERCEL_TOOLBAR = {
  script: ['https://vercel.live'],
  connect: ['https://vercel.live', 'wss://ws-us3.pusher.com'],
  img: ['https://vercel.live', 'https://vercel.com'],
  frame: ['https://vercel.live'],
  style: ['https://vercel.live'],
  font: ['https://vercel.live', 'https://assets.vercel.com'],
}

export const buildPolicy = (kind: PolicyKind, nonce: string, env: Env = process.env): string => {
  const dev = env.NODE_ENV === 'development'
  const toolbar = env.VERCEL_ENV !== undefined && env.VERCEL_ENV !== 'production'
  const media = originOf(env.MEDIA_PUBLIC_URL)
  // The admin uploads photos straight from the browser to storage (signed links).
  const storage = kind === 'admin' ? originOf(env.MEDIA_S3_ENDPOINT) : null
  const extra = (list: string[]) => (toolbar ? list : [])
  // Club sites and the admin (which previews them) use these; the marketing site doesn't yet.
  const club = (list: string[]) => (kind === 'marketing' || kind === 'platform' ? [] : list)
  // Google Analytics: club sites as above. The marketing site only when it has its own ID
  // (production), so staging and previews stay as strict as before. The ID's shape is checked
  // here as well as where it's used (src/marketing/analytics.ts); this file takes no imports.
  const analytics = (list: string[]) =>
    kind === 'marketing' && /^G-[A-Z0-9]{4,15}$/.test(env.MARKETING_GA_ID?.trim() ?? '')
      ? list
      : club(list)

  const directives: Record<string, (string | null)[]> = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      // Ignored by browsers that understand 'strict-dynamic'; kept for older ones.
      TURNSTILE,
      ...analytics(GOOGLE_ANALYTICS),
      ...extra(VERCEL_TOOLBAR.script),
      // React needs eval only in development, for its error overlays.
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    // Inline styles stay allowed: every club's colours are set on the elements themselves, and
    // a code can't cover style attributes. Styles are a far smaller risk than scripts.
    'style-src': ["'self'", "'unsafe-inline'", ...extra(VERCEL_TOOLBAR.style)],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      media,
      ...analytics(GOOGLE_ANALYTICS),
      ...extra(VERCEL_TOOLBAR.img),
    ],
    'media-src': ["'self'", 'blob:', media],
    'font-src': ["'self'", 'data:', ...extra(VERCEL_TOOLBAR.font)],
    'connect-src': [
      "'self'",
      TURNSTILE,
      ...analytics(GOOGLE_ANALYTICS),
      storage,
      ...extra(VERCEL_TOOLBAR.connect),
      // Next's live reload in development.
      ...(dev ? ['ws:'] : []),
    ],
    // The admin's live preview frames the club's page on the same address.
    'frame-src': [
      "'self'",
      TURNSTILE,
      ...club([OPENSTREETMAP, ...VIDEO_PLAYERS]),
      ...extra(VERCEL_TOOLBAR.frame),
    ],
    'worker-src': ["'self'", 'blob:'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    // Only the site itself may frame it (the admin's live preview).
    'frame-ancestors': ["'self'"],
    'report-uri': [REPORT_PATH],
  }
  return Object.entries(directives)
    .map(([name, values]) => [name, ...values.filter((v): v is string => Boolean(v))].join(' '))
    .join('; ')
}

/** A fresh one-time code for each page view. */
export const newNonce = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return btoa(String.fromCharCode(...bytes))
}

/** The response header for each kind: the admin reports only, until ADMIN_ENFORCED. */
export const policyHeaderName = (kind: PolicyKind) =>
  kind !== 'admin' || ADMIN_ENFORCED
    ? 'Content-Security-Policy'
    : 'Content-Security-Policy-Report-Only'
