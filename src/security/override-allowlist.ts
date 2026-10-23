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
    file: 'src/admin/pageTreeData.ts',
    fn: 'query',
    uses: 1,
    club: 'The editor’s own club, or the club picked by the super-admin (src/admin/PageTree.tsx), in the where clause',
    why: 'Reads drafts and published versions together for the page tree. Candidate to run as the signed-in user instead',
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
    uses: 2,
    club: 'The club just created (doc.id)',
    why: 'Creates its Club Settings and Course status. Editors can’t create those records, and only the super-admin can create a club',
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

  // ---------- Demo club (staging only) ----------
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

  // ---------- Nightly clean-up (every club, by design) ----------
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
    fn: 'loadBlockData',
    uses: 2,
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
    uses: 1,
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
