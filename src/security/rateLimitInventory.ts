/**
 * Every route, endpoint and server action, with the limit that protects it and where that limit
 * is enforced (job 4, 21 Oct grilling). docs/operations/rate-limits.md explains it in plain
 * English and lists the Vercel Firewall rules.
 *
 * tests/int/rate-limit-inventory.int.spec.ts fails if anything in the isolation manifest
 * (src/security/isolation-manifest.ts) is missing here, so a new public route can't appear
 * without someone deciding its limit.
 */
export type Protection = {
  /** Who can reach it. */
  who: 'anyone' | 'signed in' | 'super-admin' | 'scheduler'
  /** The limit, in words. "None" with a reason when no limit is needed. */
  limit: string
  /** Where it's enforced: app (shared database), Payload (database), Vercel Firewall, or none. */
  where: string
}

const PAGE: Protection = {
  who: 'anyone',
  limit: 'No per-page limit in the app',
  where: "Vercel's built-in DDoS protection (always on); optional Vercel Firewall rule 4",
}
const SEARCH: Protection = {
  who: 'anyone',
  limit: '120 searches a minute per visitor (search page and panel together)',
  where: 'App, shared database (SEARCH_LIMIT, src/security/rateLimit.ts); Vercel Firewall rule 1',
}
const SIGNED_IN: Protection = {
  who: 'signed in',
  limit: 'Needs a signed-in account; no separate limit',
  where: 'Payload access rules',
}
const SUPER_ADMIN: Protection = {
  who: 'super-admin',
  limit: 'Super-admin with their two-factor code only',
  where: 'Code check in the route or endpoint',
}
const FILE: Protection = {
  who: 'anyone',
  limit: 'None: a small fixed file',
  where: "Vercel's built-in DDoS protection (always on)",
}

/** Payload's standard sign-in endpoints that anyone can call (not in the isolation manifest,
 * which covers them with each collection). */
export const SIGN_IN_ENDPOINTS: Record<string, Protection> = {
  'POST /api/users/login': {
    who: 'anyone',
    limit: 'Account locked for 10 minutes after 5 wrong passwords',
    where: 'Payload (stored on the account, shared); Vercel Firewall rule 2 per address',
  },
  'POST /api/users/forgot-password': {
    who: 'anyone',
    limit: 'One reset email per account every 15 minutes; refused while email reset is off',
    where: 'Payload (minRequestInterval, src/collections/Users.ts); Vercel Firewall rule 2',
  },
  'POST /api/users/reset-password': {
    who: 'anyone',
    limit: 'Needs a valid one-time link (random, expires)',
    where: 'Payload; Vercel Firewall rule 2',
  },
  'POST /api/users/unlock': {
    who: 'anyone',
    limit: 'Unlocks only with access to the account; no separate limit',
    where: 'Payload; Vercel Firewall rule 2',
  },
}

export const RATE_LIMITS: Record<string, Protection> = {
  // ---------- Club websites and the staging preview ----------
  'src/app/(frontend)/sites/[domain]/page.tsx': PAGE,
  'src/app/(frontend)/sites/[domain]/[...path]/page.tsx': PAGE,
  'src/app/(frontend)/sites/[domain]/search/page.tsx': SEARCH,
  'src/app/(frontend)/sites/[domain]/search/suggest/route.ts': SEARCH,
  'src/app/(frontend)/sites/[domain]/robots.txt/route.ts': FILE,
  'src/app/(frontend)/sites/[domain]/sitemap.xml/route.ts': PAGE,
  'src/app/(frontend)/preview/[club]/page.tsx': PAGE,
  'src/app/(frontend)/preview/[club]/[...path]/page.tsx': PAGE,
  'src/app/(frontend)/preview/[club]/search/page.tsx': SEARCH,
  'src/app/(frontend)/preview/[club]/search/suggest/route.ts': SEARCH,
  'src/site/contact/actions.ts': {
    who: 'anyone',
    limit:
      '20 messages an hour per club; hidden spam trap; too-fast sends dropped; Cloudflare Turnstile',
    where:
      'App, counted in the database (HOURLY_LIMIT, src/site/contact/submit.ts); Vercel Firewall rule 3',
  },
  // ---------- Platform services ----------
  'src/app/(frontend)/csp-report/route.ts': {
    who: 'anyone',
    limit: '60 reports a minute from everyone together; extra reports are dropped',
    where: 'App, shared database (CSP_REPORT_LIMIT, src/security/rateLimit.ts)',
  },
  'src/app/(frontend)/health/route.ts': FILE,
  'src/app/(frontend)/robots.txt/route.ts': FILE,
  'src/app/(frontend)/accounts-by-administrator/page.tsx': FILE,
  'src/app/(frontend)/cron/clean-up/route.ts': {
    who: 'scheduler',
    limit: "Only with Vercel's scheduler secret (CRON_SECRET); otherwise it doesn't exist",
    where: 'Code check in the route',
  },
  // ---------- Admin and API ----------
  'src/app/(payload)/admin/[[...segments]]/page.tsx': {
    who: 'anyone',
    limit: 'The login screen is public; everything else needs sign-in',
    where: 'Payload; Vercel Firewall rule 2 covers the sign-in endpoints',
  },
  'src/app/(payload)/layout.tsx': SIGNED_IN,
  'src/app/(payload)/api/[...slug]/route.ts': {
    who: 'anyone',
    limit: 'Sign-in endpoints as listed below; everything else needs sign-in',
    where: 'Payload, per endpoint (see SIGN_IN_ENDPOINTS)',
  },
  'src/app/(payload)/api/demo-club/route.ts': SUPER_ADMIN,
  'src/app/(payload)/api/marketing-starter/route.ts': SUPER_ADMIN,
  // ---------- Company marketing site ----------
  'src/app/(marketing)/marketing/[[...path]]/page.tsx': PAGE,
  'src/app/(marketing)/marketing/robots.txt/route.ts': FILE,
  'src/app/(marketing)/marketing/dev/components/page.tsx': SUPER_ADMIN,
  'src/app/(marketing)/marketing/dev/preview/[[...path]]/page.tsx': SUPER_ADMIN,
  // ---------- Endpoints beyond Payload's standard ones ----------
  'POST /api/users/invite': SUPER_ADMIN,
  'POST /api/users/:id/password-link': SUPER_ADMIN,
  'POST /api/users/:id/reset-two-factor': SUPER_ADMIN,
  'POST /api/storage-s3-generate-signed-url': SIGNED_IN,
  'POST /api/setup-totp': {
    who: 'signed in',
    limit: 'Password already accepted; wrong codes count towards the lockout below',
    where: 'payload-totp',
  },
  'POST /api/verify-totp': {
    who: 'signed in',
    limit: 'Locked for 10 minutes after 5 wrong codes (same settings as passwords)',
    where: 'payload-totp (totp-attempts, stored in the database)',
  },
  'POST /api/remove-totp': {
    who: 'signed in',
    limit: 'Refused while two-factor is required; wrong codes count towards the lockout',
    where: 'payload-totp',
  },
  'GET /api/tenants/populate-tenant-options': SIGNED_IN,
  'GET /api/access': SIGNED_IN,
  'GET /api/payload-preferences/:key': SIGNED_IN,
  'POST /api/payload-preferences/:key': SIGNED_IN,
  'DELETE /api/payload-preferences/:key': SIGNED_IN,
  'GET /api/payload-jobs/run': SUPER_ADMIN,
  'GET /api/payload-jobs/handle-schedules': SUPER_ADMIN,
  'GET /api/media/file/:filename': SIGNED_IN,
  'GET /api/documents/file/:filename': SIGNED_IN,
  'GET /api/marketing-media/file/:filename': SIGNED_IN,
  'GET /api/media/paste-url/:id?': { ...SIGNED_IN, limit: 'Switched off' },
  'GET /api/documents/paste-url/:id?': { ...SIGNED_IN, limit: 'Switched off' },
  'GET /api/marketing-media/paste-url/:id?': { ...SIGNED_IN, limit: 'Switched off' },
  ...SIGN_IN_ENDPOINTS,
}
