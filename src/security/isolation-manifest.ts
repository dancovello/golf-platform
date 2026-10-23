/**
 * The tenant-isolation manifest (job 2, 21 Oct grilling): every collection, every endpoint
 * beyond Payload's standard ones, every web route and every server action, each pointing at the
 * test that proves one club can't reach another club's data through it.
 *
 * tests/int/isolation-manifest.int.spec.ts fails if:
 * - a collection, endpoint, route or server action exists that isn't listed here,
 * - an entry names something that no longer exists, or
 * - a test named here isn't in the file named (so renaming a test can't quietly break the link).
 *
 * Standard Payload endpoints (list, read, create, update, delete, versions, count, login and the
 * like) are covered by their collection's entry: the isolation suite tests them for every
 * collection.
 */
export type Cover = {
  /** Test file, from the repo root. */
  file: string
  /** The test's title as written in the file (for it.each / describe.each, the template). */
  test: string
}

type Manifest = Record<string, Cover[]>

const INT = 'tests/int/isolation.int.spec.ts'
const API = 'tests/e2e/api-isolation.spec.ts'
const ADMIN = 'tests/e2e/admin-isolation.spec.ts'
const CONFIG = 'tests/int/config-access.int.spec.ts'
const DOMAINS = 'tests/e2e/site-domains.spec.ts'

const perCollection: Cover = { file: INT, test: '%s: editor A gets nothing from club B' }
const payloadOwn: Cover = { file: CONFIG, test: '%s does only what is listed for a club editor' }
const noLeaks: Cover = {
  file: API,
  test: 'no API response mentions club B, its editor or a super-admin',
}

/** Every collection in the running Payload config. */
export const COLLECTIONS: Manifest = {
  pages: [
    perCollection,
    { file: API, test: 'lists only club A pages and club settings' },
    { file: INT, test: "editor A gets none of club B's page history or drafts" },
    { file: API, test: "club B's page history answers like history that doesn't exist" },
  ],
  news: [perCollection],
  events: [perCollection],
  'course-status': [perCollection],
  staff: [perCollection],
  courses: [perCollection],
  documents: [perCollection],
  media: [perCollection],
  enquiries: [
    perCollection,
    { file: ADMIN, test: "the enquiries list shows only club A's messages" },
  ],
  'club-settings': [
    perCollection,
    { file: ADMIN, test: "Club Settings opens club A's own settings" },
  ],
  'agreement-acceptances': [perCollection],
  users: [
    {
      file: 'tests/int/accounts.int.spec.ts',
      test: 'sees only editors of its own club, never super-admins or other clubs',
    },
    {
      file: 'tests/int/accounts.int.spec.ts',
      test: "cannot read club B's editor or the super-admin by ID",
    },
    { file: ADMIN, test: 'the accounts list shows only club A editors' },
  ],
  tenants: [
    { file: 'tests/int/accounts.int.spec.ts', test: 'sees only its own club record' },
    { file: ADMIN, test: 'the clubs list is not available' },
  ],
  'marketing-pages': [
    { file: 'tests/int/marketing.int.spec.ts', test: 'pages: no read, create, update or delete' },
    {
      file: 'tests/e2e/marketing-content.spec.ts',
      test: "club A's editor can't reach it through the API",
    },
  ],
  'marketing-media': [
    { file: 'tests/int/marketing.int.spec.ts', test: 'photos and settings: no read or change' },
  ],
  'payload-preferences': [
    { file: INT, test: "editor A cannot read club B's admin preferences" },
    payloadOwn,
  ],
  'payload-jobs': [
    { file: INT, test: 'editor A can neither read nor run the background job queue' },
    payloadOwn,
  ],
  'payload-kv': [payloadOwn],
  'totp-attempts': [payloadOwn],
  'payload-migrations': [payloadOwn],
}

/** Endpoints beyond Payload's standard ones, as "METHOD /api/…". */
export const ENDPOINTS: Manifest = {
  // Our own (src/accounts/endpoints.ts, src/auth/resetTwoFactor.ts)
  'POST /api/users/invite': [
    {
      file: 'tests/e2e/accounts-admin.spec.ts',
      test: 'an editor cannot open the invite page or make links',
    },
  ],
  'POST /api/users/:id/password-link': [
    {
      file: 'tests/e2e/accounts-admin.spec.ts',
      test: 'an editor cannot open the invite page or make links',
    },
  ],
  'POST /api/users/:id/reset-two-factor': [
    { file: 'tests/e2e/two-factor.spec.ts', test: 'an editor cannot reset anyone' },
  ],
  // Plugins: storage uploads, two-factor, multi-tenant
  'POST /api/storage-s3-generate-signed-url': [
    {
      file: 'tests/e2e/media-upload.spec.ts',
      test: "a crafted upload request cannot reach club B's file",
    },
  ],
  'POST /api/setup-totp': [
    {
      file: 'tests/e2e/two-factor.spec.ts',
      test: 'a super-admin without two-factor must set it up before anything else',
    },
  ],
  'POST /api/verify-totp': [
    { file: 'tests/e2e/two-factor.spec.ts', test: 'a wrong code is refused' },
  ],
  'POST /api/remove-totp': [
    { file: API, test: 'switching off two-factor does nothing for an account without it' },
    {
      file: 'tests/e2e/two-factor.spec.ts',
      test: "a super-admin can't switch their two-factor off",
    },
  ],
  'GET /api/tenants/populate-tenant-options': [noLeaks],
  // Payload's own, beyond the standard ones
  'GET /api/access': [noLeaks],
  'GET /api/payload-preferences/:key': [
    { file: INT, test: "editor A cannot read club B's admin preferences" },
    noLeaks,
  ],
  'POST /api/payload-preferences/:key': [
    { file: INT, test: "editor A cannot read club B's admin preferences" },
  ],
  'DELETE /api/payload-preferences/:key': [
    { file: INT, test: "editor A cannot read club B's admin preferences" },
  ],
  'GET /api/payload-jobs/run': [{ file: API, test: 'cannot read or run the background job queue' }],
  'GET /api/payload-jobs/handle-schedules': [
    { file: API, test: 'cannot read or run the background job queue' },
  ],
  // Upload collections: files are read-checked like records; pasting from a web address is off.
  'GET /api/media/file/:filename': [
    { file: API, test: "club B's photo file isn't served through the API" },
  ],
  'GET /api/documents/file/:filename': [
    { file: API, test: "club B's photo file isn't served through the API" },
    perCollection,
  ],
  'GET /api/marketing-media/file/:filename': [
    { file: API, test: "club B's photo file isn't served through the API" },
    { file: 'tests/int/marketing.int.spec.ts', test: 'photos and settings: no read or change' },
  ],
  'GET /api/media/paste-url/:id?': [
    { file: API, test: 'pasting a photo from a web address is switched off' },
    { file: CONFIG, test: 'pasting a photo from a web address is off everywhere' },
  ],
  'GET /api/documents/paste-url/:id?': [
    { file: CONFIG, test: 'pasting a photo from a web address is off everywhere' },
  ],
  'GET /api/marketing-media/paste-url/:id?': [
    { file: CONFIG, test: 'pasting a photo from a web address is off everywhere' },
  ],
}

/** Every page and route file under src/app. */
export const ROUTES: Manifest = {
  // Club websites on their own domains
  'src/app/(frontend)/sites/[domain]/page.tsx': [
    { file: DOMAINS, test: "club A's domain shows club A, with clean page addresses" },
  ],
  'src/app/(frontend)/sites/[domain]/[...path]/page.tsx': [
    { file: DOMAINS, test: 'the same address on two domains shows each club its own page' },
    { file: DOMAINS, test: "a visitor can't pose as another club with request headers" },
  ],
  'src/app/(frontend)/sites/[domain]/search/page.tsx': [
    { file: DOMAINS, test: "search on club A's domain never finds club B" },
  ],
  'src/app/(frontend)/sites/[domain]/search/suggest/route.ts': [
    { file: DOMAINS, test: "search on club A's domain never finds club B" },
  ],
  'src/app/(frontend)/sites/[domain]/robots.txt/route.ts': [
    { file: DOMAINS, test: "robots.txt and sitemap.xml are the club's own" },
  ],
  'src/app/(frontend)/sites/[domain]/sitemap.xml/route.ts': [
    { file: DOMAINS, test: "robots.txt and sitemap.xml are the club's own" },
  ],
  // The staging preview of club sites (and the admin's live preview)
  'src/app/(frontend)/preview/[club]/page.tsx': [
    {
      file: 'tests/e2e/site-preview.spec.ts',
      test: "club A's preview shows club A and nothing of club B",
    },
  ],
  'src/app/(frontend)/preview/[club]/[...path]/page.tsx': [
    {
      file: 'tests/e2e/site-preview.spec.ts',
      test: "club A's preview shows club A and nothing of club B",
    },
    {
      file: 'tests/e2e/admin-live-preview.spec.ts',
      test: 'the live preview shows the draft to the editor and the published page to visitors',
    },
  ],
  'src/app/(frontend)/preview/[club]/search/page.tsx': [
    { file: 'tests/e2e/site-search.spec.ts', test: 'club A finds its own page, never club B’s' },
  ],
  'src/app/(frontend)/preview/[club]/search/suggest/route.ts': [
    {
      file: 'tests/e2e/site-search-panel.spec.ts',
      test: 'club A’s panel never shows club B’s page',
    },
  ],
  // Platform services
  'src/app/(frontend)/accounts-by-administrator/page.tsx': [
    { file: ADMIN, test: 'the "create first user" address shows an explanation, not a form' },
  ],
  'src/app/(frontend)/cron/clean-up/route.ts': [
    { file: 'tests/int/cleanup.int.spec.ts', test: "doesn't exist without the scheduler's secret" },
  ],
  'src/app/(frontend)/csp-report/route.ts': [
    {
      file: 'tests/e2e/security-policy.spec.ts',
      test: 'the report address accepts reports quietly',
    },
  ],
  'src/app/(frontend)/health/route.ts': [{ file: API, test: 'platform files hold no club data' }],
  'src/app/(frontend)/robots.txt/route.ts': [
    { file: API, test: 'platform files hold no club data' },
  ],
  // The admin and its API
  'src/app/(payload)/admin/[[...segments]]/page.tsx': [
    { file: ADMIN, test: "the pages list shows only club A's page" },
  ],
  'src/app/(payload)/api/[...slug]/route.ts': [
    { file: API, test: 'lists only club A pages and club settings' },
    { file: API, test: "club B's records answer exactly like records that don't exist" },
  ],
  'src/app/(payload)/api/demo-club/route.ts': [
    {
      file: 'tests/e2e/demo-club.spec.ts',
      test: 'only a super-admin, with their code entered, may build the demo club',
    },
    { file: 'tests/int/demo-club.int.spec.ts', test: 'never touches another club' },
  ],
  'src/app/(payload)/api/marketing-starter/route.ts': [
    {
      file: 'tests/e2e/marketing-home.spec.ts',
      test: 'the super-admin can add the Figma pages; existing ones are left alone',
    },
  ],
  // The company marketing site (no club data)
  'src/app/(marketing)/marketing/[[...path]]/page.tsx': [
    {
      file: 'tests/e2e/marketing-routing.spec.ts',
      test: "a club's domain never shows the marketing site",
    },
  ],
  'src/app/(marketing)/marketing/robots.txt/route.ts': [
    {
      file: 'tests/e2e/marketing-routing.spec.ts',
      test: "a club's domain never shows the marketing site",
    },
  ],
  'src/app/(marketing)/marketing/dev/components/page.tsx': [
    {
      file: 'tests/e2e/marketing-controls.spec.ts',
      test: 'only the signed-in super-admin can see the review page',
    },
  ],
  'src/app/(marketing)/marketing/dev/preview/[[...path]]/page.tsx': [
    {
      file: 'tests/e2e/marketing-chrome.spec.ts',
      test: 'live preview shows drafts to the super-admin only',
    },
  ],
}

/** Files with server actions ('use server'): each can be called by a POST to any page. */
export const SERVER_ACTIONS: Manifest = {
  'src/site/contact/actions.ts': [
    { file: DOMAINS, test: "the Contact form on club A's domain saves into club A" },
    {
      file: 'tests/int/contact.int.spec.ts',
      test: 'refuses a form token from another club, a forged one and an expired one',
    },
  ],
  // Payload's admin server functions (the admin screens run through them).
  'src/app/(payload)/layout.tsx': [
    { file: ADMIN, test: "the pages list shows only club A's page" },
  ],
}

/** Every cached club loader (src/site/cache.ts, job 5): each must stay inside one club. */
const CACHE = 'tests/int/cache-isolation.int.spec.ts'
const cacheCovers: Cover[] = [
  { file: CACHE, test: "every cached entry's key and tag name exactly one club" },
  { file: CACHE, test: "publishing at club A clears club A's cache, never club B's" },
]
export const CACHED: Manifest = {
  clubByHost: [{ file: CACHE, test: "changing a club's web addresses clears the address lookups" }],
  clubIDBySlug: [
    {
      file: CACHE,
      test: "the club's shared data (menus, settings) is cached per club and correct for each",
    },
  ],
  loadClubSite: [
    {
      file: CACHE,
      test: "the club's shared data (menus, settings) is cached per club and correct for each",
    },
    ...cacheCovers,
  ],
  publishedPage: [
    {
      file: CACHE,
      test: 'two clubs with the same page address each get their own page, from the cache too',
    },
    { file: CACHE, test: 'a visitor never gets a cached draft' },
    ...cacheCovers,
  ],
  latestNews: cacheCovers,
  newsArchive: cacheCovers,
  newsPost: cacheCovers,
  upcomingEvents: [
    { file: CACHE, test: 'a past event drops off within 5 minutes, without anyone publishing' },
    ...cacheCovers,
  ],
  featuredEvent: cacheCovers,
  eventsArchive: cacheCovers,
}
