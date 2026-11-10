/**
 * Every place the code skips Payload's access rules, and why that's safe (job 2, 21 Oct grilling).
 *
 * Skipping the rules means the code itself must keep each club to its own data. Each entry says
 * which club the query is limited to and why the normal rules can't be used there.
 * tests/unit/override-allowlist.spec.ts fails if:
 * - a function skips the rules and isn't listed here (or does so more times than listed), or
 * - an entry names a function that no longer skips them.
 *
 * "Skips the rules" means `overrideAccess: true`, or a Local API call (`payload.find(…)` etc.)
 * that doesn't set `overrideAccess`: Payload skips the rules by default then.
 *
 * Adding an entry is a security decision: say it in the PR, and expect it to be reviewed.
 */
export type OverrideUse = {
  /** Path from the repo root. */
  file: string
  /** The function it's in (or the variable/property an unnamed function is assigned to). */
  fn: string
  /** How many times that function skips the rules. */
  uses: number
  /** Which club's records it can reach, and what limits it to them. */
  club: string
  /** Why the normal access rules can't be used. */
  why: string
}

/** The public club site runs for anonymous visitors: there's no signed-in user to check. */
const PUBLIC_SITE =
  'Public club website: visitors aren’t signed in, so there is no user whose rules could apply'

/** The club the request is for, found from its web address or preview address. */
const RESOLVED_CLUB =
  'The club the request is for (src/site/resolveSite.ts, from its web address or /preview/<club>), passed in as tenantID and used in the where clause'

export const OVERRIDE_ALLOWLIST: OverrideUse[] = [
  // ---------- Audit log (src/audit) ----------
  {
    file: 'src/audit/record.ts',
    fn: 'recordAudit',
    uses: 1,
    club: 'None: adds one entry to the audit log, naming the club the action was about as plain text (no club link)',
    why: 'Nobody can add audit entries through the admin or the API (create access is false for everyone); only this trusted server code writes them, from hooks and routes that already ran their own checks',
  },
  {
    file: 'src/audit/content.ts',
    fn: 'auditContentDeleted',
    uses: 1,
    club: "The club the deleted item belonged to (its tenant, from the item itself); reads only that club's name",
    why: 'The signed-in editor may not be allowed to read the clubs list (only the super-admin can), so the name is read by trusted code to label the audit entry',
  },
  {
    file: 'src/audit/hooks.ts',
    fn: 'auditPasswordReset',
    uses: 1,
    club: 'The one account whose password was just set from a link (its ID comes from the reset result)',
    why: 'Setting a password from a link happens before anyone is signed in, so there is no user whose rules could apply; reads only that account to name it in the audit log',
  },
  {
    file: 'src/privacy/cleanUp.ts',
    fn: 'deleteOldAuditEntries',
    uses: 1,
    club: 'None: audit log entries older than 12 months, every club alike, by date alone',
    why: "The nightly clean-up runs from Vercel's scheduler with no signed-in user, and delete access on the audit log is false for everyone",
  },
  // ---------- Scheduled checks ----------
  {
    file: 'src/app/(frontend)/cron/club-sites/route.ts',
    fn: 'GET',
    uses: 1,
    club: 'Every club that has its own web address, but only its list of addresses (select: domains): no content, accounts or messages',
    why: "The hourly club address check runs from Vercel's scheduler with the secret, so there is no signed-in user; club web addresses are public",
  },
  // ---------- Accounts and sign-in (super-admin tools, scripts) ----------
  {
    file: 'src/accounts/createSuperAdmin.ts',
    fn: 'createSuperAdmin',
    uses: 1,
    club: 'None: creates a super-admin account (no club)',
    why: 'Only called by scripts/create-super-admin.ts, run by Dan from a terminal. Account creation also needs the allowAccountCreation context (src/access/accountCreation.ts)',
  },
  {
    file: 'src/accounts/passwordLinks.ts',
    fn: 'createPasswordLink',
    uses: 2,
    club: 'The one account named by ID, and that account’s own club (read for its name only)',
    why: 'Called from the super-admin’s password-link and invite endpoints (src/accounts/endpoints.ts), which check for a super-admin with their two-factor code first',
  },
  {
    file: 'src/accounts/passwordLinks.ts',
    fn: 'inviteEditor',
    uses: 1,
    club: 'The club the super-admin chose for the new editor',
    why: 'Called only from the invite endpoint after the super-admin check. Accounts can’t be created through the normal rules at all (allowAccountCreation context)',
  },
  {
    file: 'src/auth/sessionLimit.ts',
    fn: 'emailPasswordReset',
    uses: 1,
    club: 'The one account whose password was just set through a link (by its ID)',
    why: 'Reads only its email address, to tell the owner their password was set; nobody is signed in yet',
  },
  {
    file: 'src/auth/resetTwoFactor.ts',
    fn: 'resetTwoFactor',
    uses: 1,
    club: 'The one account named by ID',
    why: 'Clears a two-factor secret, which no access rule allows. Called by the endpoint below (super-admin checked) and scripts/reset-two-factor.ts',
  },
  {
    file: 'src/auth/resetTwoFactor.ts',
    fn: 'handler',
    uses: 1,
    club: 'The one account named in the address',
    why: 'Endpoint checks for a super-admin with their two-factor code before reading the account',
  },

  // ---------- Admin screens ----------
  {
    file: 'src/admin/clubSetup.ts',
    fn: 'clubHomeData',
    uses: 6,
    club: 'The tenantID passed in: the editor’s own club (editorTenantID) or, for the super-admin, the club picked in the club selector (src/admin/ClubHome.tsx). Every query filters by it',
    why: 'Reads counts and summaries across several collections for the home screen. Candidate to run as the signed-in user instead (see docs/security/override-review.md)',
  },
  {
    file: 'src/admin/clubSetup.ts',
    fn: 'allClubsProgress',
    uses: 1,
    club: 'Every club (list of names)',
    why: 'Super-admin only: ClubHome calls it only when isSuperAdmin(user)',
  },
  {
    file: 'src/agreement/acceptance.ts',
    fn: 'clubHasAccepted',
    uses: 1,
    club: 'The tenantID passed in (the editor’s own club, or the club being saved), in the where clause',
    why: 'Used inside Club Settings’ save rule, where calling access rules again would loop; returns a yes/no only',
  },
  {
    file: 'src/agreement/acceptance.ts',
    fn: 'agreementParty',
    uses: 1,
    club: 'The editor’s own club (editorTenantID in src/admin/AgreementText.tsx), in the where clause',
    why: 'Reads the club’s legal name and address to fill in the agreement text',
  },
  {
    file: 'src/collections/Pages.ts',
    fn: 'validParent',
    uses: 1,
    club: 'Pages named by the chosen parent chain. Not filtered by club, but it only reads `parent` to detect a loop and returns no data; a parent from another club is refused separately by sameClubCheck',
    why: 'Validation runs inside the save, with access rules already applied to the save itself',
  },
  {
    file: 'src/collections/Tenants.ts',
    fn: 'afterChange',
    uses: 3,
    club: 'The club just created (doc.id)',
    why: 'Creates its Club Settings, Course status and starter categories. Editors can’t create the first two, and the starter categories must exist before any editor does; only the super-admin can create a club',
  },
  {
    file: 'src/collections/Categories.ts',
    fn: 'count',
    uses: 1,
    club: 'The category being deleted: counts the news and the documents that use it (its ID in the where clause; keepCategoriesInUse calls it once for each)',
    why: 'Runs on the delete itself, for whoever is deleting; it must see every article of the club, including drafts the deleter might not be shown',
  },
  {
    file: 'src/collections/Documents.ts',
    fn: 'policiesNeedReviewDate',
    uses: 1,
    club: 'The one category the document is being saved with (its ID); only its address is read, and a category from another club is refused first by the same-club check on the same save',
    why: 'Validation runs inside the save and also for trusted scripts that have no signed-in user (club import, the demo club), where the normal rules would hide the category and silently skip the rule',
  },
  {
    file: 'src/collections/categoryIds.ts',
    fn: 'categoryIds',
    uses: 1,
    club: 'The one club passed in as tenant, in the where clause',
    why: 'Used only by scripts that fill a club (demo club, club import, canary clubs); no request or signed-in user',
  },
  {
    file: 'src/site/sameClub.ts',
    fn: 'sameClubCheck',
    uses: 1,
    club: 'The club of the record being saved, in the where clause',
    why: 'The check that refuses links to another club’s pages, photos or documents: it must see what exists in the club regardless of drafts',
  },
  {
    file: 'src/site/livePreview.ts',
    fn: 'previewURL',
    uses: 1,
    club: 'The club of the record being edited (its tenant field)',
    why: 'Reads the club’s slug to build the admin’s live preview address',
  },
  {
    file: 'src/site/livePreview.ts',
    fn: 'viewPageURL',
    uses: 1,
    club: 'The club of the page being edited (its tenant field)',
    why: 'Reads the club’s web address to build the page screen’s View page link; only a link is returned, never the club’s record',
  },

  // ---------- Demo club (staging only) ----------
  {
    file: 'src/collections/Tenants.ts',
    fn: 'deleteClubWithContent',
    uses: 2,
    club: 'The one club being deleted, in the where clause; refuses if it has accounts or an accepted agreement',
    why: 'Runs only when a super-admin deletes a club (Tenants.access.delete); clears its content first because the database refuses to delete a club that still owns anything',
  },
  {
    file: 'src/demo/demoClub.ts',
    fn: 'removeDemoClub',
    uses: 5,
    club: 'The club with the demo slug (heathcote-demo) only; refuses if it has accounts or an accepted agreement',
    why: 'Runs from /api/demo-club, which needs staging (SITE_PREVIEW=on) and a super-admin with their code',
  },
  {
    file: 'src/demo/demoClub.ts',
    fn: 'buildDemoClub',
    uses: 6,
    club: 'The demo club it has just created',
    why: 'As above: staging only, super-admin with their code',
  },
  {
    file: 'src/demo/demoClub.ts',
    fn: 'create',
    uses: 1,
    club: 'The demo club (tenant set on every record)',
    why: 'Helper inside buildDemoClub',
  },
  {
    file: 'src/demo/demoClub.ts',
    fn: 'save',
    uses: 1,
    club: 'The demo club’s own pages (IDs it created)',
    why: 'Helper inside buildDemoClub',
  },

  // ---------- Club import (docs/operations/club-import.md) ----------
  {
    file: 'src/import/clubImport.ts',
    fn: 'removeImportedClub',
    uses: 4,
    club: 'The club with the content file’s slug only; refuses if it has accounts or an accepted agreement',
    why: 'Run only by the import-club script, which asks for the database and a typed confirmation; no request or signed-in user',
  },
  {
    file: 'src/import/clubImport.ts',
    fn: 'importClub',
    uses: 4,
    club: 'A check that the content file’s slug is not already taken (production), the club it has just created and its demo switch, and its own pages (IDs it created)',
    why: 'As above: the import-club script only',
  },
  {
    file: 'src/import/clubImport.ts',
    fn: 'create',
    uses: 1,
    club: 'The imported club (tenant set on every record)',
    why: 'Helper inside importClub',
  },
  {
    file: 'src/import/clubImport.ts',
    fn: 'one',
    uses: 2,
    club: 'The imported club’s own settings and course status (found by its tenant)',
    why: 'Helper inside importClub',
  },

  // ---------- Live isolation canary (hidden canary clubs only) ----------
  {
    file: 'src/canary/setup.ts',
    fn: 'createCanaryClubs',
    uses: 8,
    club: 'The two canary clubs it creates (slugs canary-a and canary-b), and their records',
    why: 'Run only by scripts/create-canary-clubs.ts from a terminal (production needs Dan’s approval)',
  },
  {
    file: 'src/canary/targets.ts',
    fn: 'canaryTargets',
    uses: 3,
    club: 'Canary club B only (by its slug), its records and its marked account, to know what the canary must not be able to reach',
    why: 'Runs in the canary cron route (CRON_SECRET) with no user; the attempts themselves go over HTTP as canary A’s editor, with normal access rules',
  },

  // ---------- Company marketing site (no clubs) ----------
  {
    file: 'src/marketing/content.ts',
    fn: 'publishedMarketingPage',
    uses: 1,
    club: 'None: marketing pages are platform-level',
    why: 'The collection is super-admin only; visitors get published versions only',
  },
  {
    file: 'src/marketing/content.ts',
    fn: 'latestMarketingPage',
    uses: 1,
    club: 'None: marketing pages are platform-level',
    why: 'Drafts for the live preview; the preview page checks for the super-admin first',
  },
  {
    file: 'src/marketing/content.ts',
    fn: 'publishedMarketingSlugs',
    uses: 1,
    club: 'None: marketing pages are platform-level',
    why: 'The addresses of published pages only, so the nav and footer leave out unpublished ones',
  },
  {
    file: 'src/marketing/settings.ts',
    fn: 'marketingSettings',
    uses: 1,
    club: 'None: platform-level settings',
    why: 'Public values shown on the marketing site; the global is super-admin only to edit',
  },
  {
    file: 'src/marketing/site/FounderCard.tsx',
    fn: 'FounderCard',
    uses: 1,
    club: 'None: platform-level settings',
    why: 'As marketingSettings',
  },
  {
    file: 'src/marketing/starter/pages.ts',
    fn: 'addStarterPages',
    uses: 2,
    club: 'None: marketing pages are platform-level',
    why: 'Called from /api/marketing-starter, which checks for a super-admin with their code',
  },

  {
    file: 'src/marketing/booking/alert.ts',
    fn: 'sendDemoBookingEmails',
    uses: 4,
    club: 'No club data: one demo booking (company website) and the company website settings',
    why: 'Runs after the booking has answered, with no user; reads the booking by the ID the form just saved and records when its two emails were sent',
  },
  {
    file: 'src/marketing/booking/submit.ts',
    fn: 'submitDemoBooking',
    uses: 1,
    club: 'No club data: saves company-website demo bookings only',
    why: 'Public form with no user; nobody may create a booking any other way (create is refused to everyone else)',
  },
  {
    file: 'src/marketing/booking/config.ts',
    fn: 'takenSlots',
    uses: 1,
    club: 'No club data: which demo times are already booked, times only',
    why: 'Public Book a demo page with no user; reads only the slot keys, never a visitor’s details',
  },
  {
    file: 'src/media/convertExisting.ts',
    fn: 'convertExistingPhotos',
    uses: 2,
    club: 'Every club (or the one named): photo addresses and types only, to save older originals as WebP',
    why: 'One-off, run only by scripts/convert-photos-to-webp.ts from a terminal (production needs Dan’s approval)',
  },
  {
    file: 'src/privacy/cleanUp.ts',
    fn: 'deleteOldDemoBookings',
    uses: 1,
    club: 'No club data: company-website demo bookings past their retention period',
    why: 'Background job with no user. Runs from the cron route, which checks CRON_SECRET',
  },

  // ---------- Nightly clean-up (every club, by design) ----------
  {
    file: 'src/marketing/requests/alert.ts',
    fn: 'sendHomepageRequestEmails',
    uses: 3,
    club: 'No club data: one homepage request (company website) and the company website settings',
    why: 'Runs after the form has answered, with no user; reads the request by the ID the form just saved and records when its alert email was sent',
  },
  {
    file: 'src/marketing/requests/submit.ts',
    fn: 'submitHomepageRequest',
    uses: 2,
    club: 'No club data: counts and saves company-website homepage requests only',
    why: 'Public form with no user; nobody may create a request any other way (create is refused to everyone else)',
  },
  {
    file: 'src/privacy/cleanUp.ts',
    fn: 'deleteOldHomepageRequests',
    uses: 1,
    club: 'No club data: company-website homepage requests past their retention period',
    why: 'Background job with no user. Runs from the cron route, which checks CRON_SECRET',
  },
  {
    file: 'src/media/cleanExisting.ts',
    fn: 'cleanExistingPhotos',
    uses: 1,
    club: 'Every club: photo addresses and types only, to re-save older originals without hidden details',
    why: 'One-off, run only by scripts/clean-photo-details.ts from a terminal (production needs Dan’s approval)',
  },
  {
    file: 'src/privacy/cleanUp.ts',
    fn: 'deleteOldEnquiries',
    uses: 1,
    club: 'Every club: enquiries past their retention period',
    why: 'Background job with no user. Runs from the cron route, which checks CRON_SECRET',
  },
  {
    file: 'src/privacy/cleanUp.ts',
    fn: 'knownFolders',
    uses: 1,
    club: 'Every club: folder names only, to find orphaned files',
    why: 'Background job with no user; returns no content',
  },

  // ---------- Site search (built per club) ----------
  {
    file: 'src/search/answers.ts',
    fn: 'pageFacts',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/search/answers.ts',
    fn: 'loadStatus',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/search/build.ts',
    fn: 'buildClubEntries',
    uses: 2,
    club: RESOLVED_CLUB,
    why: `${PUBLIC_SITE}. Published content only`,
  },

  // ---------- Public club website ----------
  {
    file: 'src/site/resolveSite.ts',
    fn: 'clubByHost',
    uses: 1,
    club: 'The one club whose list of web addresses contains the requested host',
    why: `${PUBLIC_SITE}. This is how the club is found in the first place`,
  },
  {
    file: 'src/site/resolveSite.ts',
    fn: 'siteFromDemo',
    uses: 1,
    club: 'The one club whose short name AND random ending both match the link, and only while it is switched on as a demo and has not expired',
    why: `${PUBLIC_SITE}. A prospect demo is open to anyone holding its link (src/site/demo.ts)`,
  },
  {
    file: 'src/site/demoClub.ts',
    fn: 'isDemoClub',
    uses: 1,
    club: 'The one club by ID (the club the contact form was sent to); returns only whether it is a demo',
    why: `${PUBLIC_SITE}. Lets the contact form refuse to send or store anything from a demo`,
  },
  {
    file: 'src/collections/Tenants.ts',
    fn: 'demoClubsAreNotLive',
    uses: 1,
    club: 'The club being saved: counts its editor accounts (users with this tenant) and returns no data',
    why: 'Validation runs inside a super-admin’s save and only counts the club’s accounts; it reads no account data',
  },
  {
    file: 'src/access/accountCreation.ts',
    fn: 'noAccountsInDemoClubs',
    uses: 1,
    club: 'The club an account is being added to (by ID); returns nothing but a yes/no refusal',
    why: 'Runs inside the account save, which has its own rules (enforceAccountCreationRules); an editor can’t read Clubs other than their own',
  },
  {
    file: 'src/site/loadClub.ts',
    fn: 'clubIDBySlugFresh',
    uses: 1,
    club: 'The one club with this slug (from resolveSite); returns its ID only',
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/loadClub.ts',
    fn: 'loadClubSiteFresh',
    uses: 2,
    club: 'The one club by its ID, and its own Club Settings',
    why: PUBLIC_SITE,
  },
  { file: 'src/site/loadClub.ts', fn: 'clubPages', uses: 1, club: RESOLVED_CLUB, why: PUBLIC_SITE },
  {
    file: 'src/site/loadClub.ts',
    fn: 'clubPageFamilies',
    uses: 2,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/loadClub.ts',
    fn: 'clubHeroPhotos',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/loadClub.ts',
    fn: 'clubImages',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/loadClub.ts',
    fn: 'pageData',
    uses: 1,
    club: RESOLVED_CLUB,
    why: `${PUBLIC_SITE}. Drafts only when canSeeDrafts allowed it (the club’s own signed-in editor or the super-admin)`,
  },
  {
    file: 'src/site/loadClub.ts',
    fn: 'loadAnnouncement',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/blocks/media.ts',
    fn: 'clubBrand',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/blocks/media.ts',
    fn: 'loadClubMedia',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/blocks/resolve.ts',
    fn: 'loadClubStaff',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/blocks/resolve.ts',
    fn: 'loadClubCourses',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/blocks/resolve.ts',
    fn: 'loadClubCourseStatus',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/blocks/resolve.ts',
    fn: 'loadClubDocuments',
    uses: 2,
    club: `${RESOLVED_CLUB}. Both the documents (by ID) and the categories are limited to it`,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/blocks/resolve.ts',
    fn: 'loadBlockData',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  { file: 'src/site/events.ts', fn: 'toEvents', uses: 1, club: RESOLVED_CLUB, why: PUBLIC_SITE },
  {
    file: 'src/site/events.ts',
    fn: 'find',
    uses: 1,
    club: 'The tenantID every caller passes; the helper adds it to the where clause itself',
    why: PUBLIC_SITE,
  },
  { file: 'src/site/events.ts', fn: 'clubEvents', uses: 1, club: RESOLVED_CLUB, why: PUBLIC_SITE },
  {
    file: 'src/site/news.ts',
    fn: 'clubCategoriesFresh',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/news.ts',
    fn: 'newsForSitemap',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/news.ts',
    fn: 'latestNewsFresh',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/news.ts',
    fn: 'newsArchiveFresh',
    uses: 2,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/news.ts',
    fn: 'loadNewsPostFresh',
    uses: 1,
    club: RESOLVED_CLUB,
    why: `${PUBLIC_SITE}. Unpublished only when canSeeDrafts allowed it`,
  },
  { file: 'src/site/news.ts', fn: 'neighbour', uses: 1, club: RESOLVED_CLUB, why: PUBLIC_SITE },
  {
    file: 'src/site/routes/seo.ts',
    fn: 'sitemapResponse',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/contact/load.ts',
    fn: 'loadContactSettings',
    uses: 1,
    club: RESOLVED_CLUB,
    why: PUBLIC_SITE,
  },
  {
    file: 'src/site/contact/submit.ts',
    fn: 'submitEnquiry',
    uses: 2,
    club: 'The club whose Contact page was used (resolved from the address); the new enquiry is created in that club',
    why: `${PUBLIC_SITE}. Visitors can create an enquiry but never read one`,
  },
  {
    file: 'src/site/contact/submit.ts',
    fn: 'unusedReference',
    uses: 1,
    club: RESOLVED_CLUB,
    why: 'Counts matching references only; returns no data',
  },
  {
    file: 'src/site/contact/alert.ts',
    fn: 'sendEnquiryAlert',
    uses: 4,
    club: 'The club of the enquiry just saved (read from the enquiry itself)',
    why: 'Runs after the visitor’s request has been answered (next/server after()), with no user',
  },
]
