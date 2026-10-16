# Decisions log

Decisions made after doc 04, with the reason for each. Newest first. Doc 04 still wins on anything not covered here.

## 2026-10-10 — First planning session

### Account types (super-admin vs club editor)
Payload's admin panel can only log people in from **one** user collection. So the two account types share one login collection, but are kept structurally separate by these rules. All of them are required:

1. **The database enforces the account type.** A super-admin has no club. A club editor has exactly one club. A record that breaks either rule cannot be saved.
2. **A club editor can never change their own account type or club**, through the admin screens or the API.
3. **Super-admins are created only by a command-line script.** There is no sign-up or admin-screen route to create one. The script never stores credentials in the repo. It needs Dan's explicit approval before it is ever run against production.
4. **Super-admins must use two-factor authentication.**
5. **The tenant-isolation tests include escalation attempts.** An editor trying to become a super-admin, or to reach another club, must fail. If such an attempt succeeds, the build fails.
6. **This design must be checked before launch** by the devops contact and by the independent security review.

### Club editors
- A club can have several editors. In v1 they all have the same permissions.
- Only the super-admin invites editors.

### Per-club "globals"
Site Settings, Navigation and Booking Integration are described as "globals" in docs 02, 04 and 08. In Payload, a global has a single copy for the whole app, so each one is built as a tenant-owned collection with exactly one record per club. Never build these as real Payload globals, because that would share one club's settings with every club.

### Tenancy approach
Use Payload's official multi-tenant plugin, hardened so that editors cannot discover other clubs. Every collection still defines its own explicit access rules. A short spike at the start of step 2 confirms the plugin against the isolation tests. If it can't close a leak, we stop and explain before switching to hand-rolled access control.

### Repository and CI
- The repo is **private**, on GitHub Pro.
- Classic branch protection is used rather than rulesets, because rulesets on private repos need GitHub Team.
- GitHub's own secret scanning is a paid add-on on private repos, so CI uses **gitleaks**, which is free. Dependency scanning uses `pnpm audit`, OSV-Scanner and Dependabot alerts.

### Environments
- **Staging only for now.** Production (the Vercel production environment and the Neon production project) is not created until step 3, once backups and a restore have been proven.
- Staging is a Vercel custom environment (Pro includes one) tracking `main`. It uses a Neon project in London (`aws-eu-west-2`).
- Vercel's production branch is set to `production`, which won't exist until step 3. Vercel always makes a new project's first deployment a "production" one. That deployment has no database or secrets.
- No platform name or domain yet, so staging uses a placeholder `*.vercel.app` address.
- Production releases (from step 3 onwards) happen only when Dan merges a release PR from `main` into `production`.

## 2026-10-11 — Step 2 decisions (after the 2.1 spike)

- **Two-factor login is required for every account**, super-admins and editors alike. It uses a free, open-source option, with no paid service. The recommended choice is `payload-totp`, with two-factor secrets encrypted at rest; the final pick goes past the devops contact.
- **No backup codes in v1.** A lost phone is handled by the super-admin resetting that editor's two-factor. A super-admin's own reset is done from the command line, and needs Dan's approval on production.
- **Editor invites:** the super-admin copies a one-time "set your password" link and sends it to the editor, until an email provider is chosen.
- **Document locking is off** (no "X is editing this page" warning). Payload's lock records are readable by every logged-in user across clubs, and their access rules can't be changed. A test fails if locking comes back.
- **Every record gets a random ID (UUID v4)**, never a counting number, so IDs don't reveal how many clubs or records exist.
- **Account creation rules:**
  - Editors are created by a super-admin in the admin screens, or by a trusted script.
  - Super-admins are created only by `pnpm create-super-admin`.
  - Payload's "create first user" screen is replaced with an explanation page.

## 2026-10-11 — Devops review of step 2

Dan's devops contact checked and approved the review items raised in PRs #18, #23 and #25:

- **Account types:**
  - database-enforced account type and club, set once and never changeable;
  - super-admins created only by script;
  - editors only by a super-admin.
- **Two-factor login:**
  - `payload-totp`, required for everyone;
  - secrets encrypted at rest with `TOTP_ENCRYPTION_KEY`, kept in Vercel and the password manager;
  - the plugin has a single maintainer, so its version is pinned and each update is reviewed.
- **Known limitations, accepted for now:**
  - a code can be reused within its 30-second window (the plugin has no replay protection);
  - two simultaneous logins to one account can overwrite each other's session (Payload behaviour);
  - the plugin's code boxes have no screen-reader labels (accessibility follow-up);
  - the "Reset Password" wording on invite links (follow-up).
- **Invites:** one-time set-your-password links, valid for 72 hours. Public "Forgot password?" is off until an email provider is chosen.

**Still open (actions, not covered by this approval):**
- **A less-powerful database account for the app**, instead of `neondb_owner`. Due in build step 3, before production exists.
- **An independent security review / penetration test before launch** (doc 04 §7). Dan's condition on the account design also requires it. A devops review isn't a substitute.

## 2026-10-11 — Neon plan

- Neon **stays on the free plan** until the first club's data (step 4). Production is empty until then.
- **Step 4 can't start onboarding a club until** Neon is upgraded to Launch, production has 7-day history, daily snapshots and branch protection, and the Neon parts of the restore drill have been rerun.

## 2026-10-11 — Photo and video storage (step 5.1b)

- **Cloudflare R2, one bucket per environment:** `golf-platform-media-staging` (staging and pull-request previews) and `golf-platform-media-production`. Location hint Western Europe. Not the EU jurisdiction used for backups: these are public website images, not personal data, and Cloudflare doesn't document the public address for jurisdiction buckets.
- **Public files on a separate domain** (doc 04 §8). Until step 4 brings a domain, that's each bucket's `r2.dev` address, which Cloudflare intends for non-production traffic. **Step 4 must move production to a custom domain** (e.g. `media.<platform domain>`) behind Cloudflare.
- **Unguessable, never listed:** each file sits in its own random folder, and every file name starts with a random code. The code also stops Payload renaming club A's `hero.jpg` to `hero-1.jpg` because club B has one, which would hint that another club exists. Visitors can't list the bucket or the Media collection.
- **Uploads go straight from the browser to R2** (Vercel refuses request bodies over 4.5 MB), using a 10-minute signed link that can't overwrite an existing file. Links are only issued for the allowed types (JPEG, PNG, WebP, AVIF, MP4, WebM; no SVG; 50 MB), and the file is stored and served as that type (`src/media/uploadGuards.ts`; Payload itself doesn't check its own list at this step). Payload then downloads the file once and checks its real contents, refusing the record if they don't match.
- **Local development and tests** use SeaweedFS (`docker-compose.yml`), never real R2.
- **Known gap:** a file that fails Payload's content check after a browser upload stays in the bucket, unlisted and served only as an allowed image or video type. A response header telling browsers not to second-guess the type (`X-Content-Type-Options: nosniff`) needs the custom domain in step 4. A clean-up job is a follow-up (Payload Jobs Queue).

## 2026-10-15 — Privacy policy on every club site

- **A system page, not a CMS page.** Every club has `/privacy` (on staging, `/preview/<club>/privacy`), written from code in `src/site/privacy/`. Clubs can't edit or delete it; the footer link to it is built in. A club page with the address "privacy" can't replace it. It's served by the same route as every club page, not a route of its own: a separate route made Next.js split the shared stylesheets into a different order, which moved the news archive tabs.
- **Club Settings → Privacy & legal:** optional legal name, privacy email, newsletter service, Google Analytics ID and "Additional information" (paragraphs, lists and links only). Blank boxes fall back to the club name and footer email.
- **Footer email and address are now required** whenever Club Settings are saved. Not a database rule: settings are created blank with each new club, and clubs saved earlier still load. Until filled in, the policy leaves those lines out.
- **Platform name:** "Clubhouse", a working name (`PLATFORM_NAME` in `src/site/privacy/policy.ts`). Change it there when the real name is chosen.
- **Bookings, member accounts and Stripe** parts of the policy are written but always off, because those features are out of scope for v1.
- **Cookie banner** only for clubs with a Google Analytics ID. Google's script isn't added until the visitor accepts; "Cookie settings" in the footer reopens the banner. The choice is kept in the visitor's browser.
- **Vercel Web Analytics isn't installed**, so the brief's sentence about it is left out of the policy (Dan, 2026-10-15). If it's switched on later, the sentence goes back in.
- **Search engines:** the page follows the staging rule (not indexed) until real domains arrive in step 4, when the brief's "index, follow" applies.
- **Before the first real club:** a data-protection adviser should review the wording, and the written agreement between the platform and each club that section 1 mentions must exist.

## 2026-10-15 — Data processing agreement in the admin

- **Every club accepts the platform's data processing agreement (UK GDPR Article 28) in the admin**, under "Data processing agreement". The wording is in code (`src/agreement/text.ts`) with a version; changing the version asks every club again.
- **Any editor can accept**, giving their name and role and confirming they have authority. The super-admin can't accept for a club.
- **Not accepted → the club's editors can't save Club Settings** (a clear message, and a notice at the top of the screen). The public website and other admin screens are unaffected, and the super-admin can still set a club up.
- **Records are permanent evidence:** version, account and time are set by the server; nobody can edit or delete a record in the admin, and the website's `golf_app` database account can only add rows to that table.
- **Draft wording, written by Claude Code from ICO guidance, awaiting Dan's solicitor.** The admin shows "Draft" until `AGREEMENT_APPROVED` is set. The provider's legal name, company number, address and contact email, and the liability clause, are left in square brackets.
- **Before the first real club:** Dan to confirm he has accepted each supplier's own data processing terms (Vercel, Neon, Cloudflare, GitHub), which the agreement relies on, and to decide whether to move Vercel's function region from the default (Washington, D.C.) to London, next to the database.

## 2026-10-16 — Contact page enquiries

- **Saved in the CMS and emailed** (Dan, 2026-10-16). Each club's Contact page saves messages to its own "Enquiries" list, then emails them to the club (see "Email: Resend" below).
- **Only the website creates enquiries**, as trusted server code (`src/site/contact/submit.ts`). Nobody, including the super-admin, can add one through the admin or the API. Editors can mark them handled, add notes and delete them; what the visitor sent can't be changed.
- **The club comes from the page address**, never from the form.
- **Spam checks that keep nothing about the visitor:** a hidden box, a signed time check (sent less than 3 seconds after loading = bot; over a day old = expired), and 20 messages per club per hour. Bots caught by the first two see the normal "sent" screen. No IP addresses or other visitor details are stored.
- **Before the first real club:** a security review of the form, and a clean-up job for messages older than the 12 months the privacy policy promises.

## 2026-10-16 — Email: Resend

- **Resend, not Postmark** (Dan, 2026-10-16). Free for 3,000 emails a month (100 a day), then about $20 a month for 50,000; Postmark's free plan is 100 a month. It connects to Vercel, and Payload has an official adapter (`@payloadcms/email-resend`, which calls Resend's web API with no further packages).
- **Only for the platform's own small emails:** new Contact page messages to the club now; editors' password reset and invitations next. Clubs keep their own newsletter service.
- **Where:** sent from Ireland (eu-west-1); Resend keeps account data and email logs in the USA. Added to Schedule 3 of the data processing agreement (version `2026-10-16-draft`) and to the privacy policy's "who we share it with".
- **Nothing is sent without `RESEND_API_KEY`.** Payload's fallback writes whole emails into the server logs, so the app sends nothing instead. Staging and previews set `EMAIL_OVERRIDE_TO` so every email goes to one address, never to the test clubs.
- **One sending domain:** emails come from one address on the platform's domain (`EMAIL_FROM_ADDRESS`), named after the club ("Heathcote Golf Club website"), with Reply-To set to the visitor. Until the domain exists and is verified in Resend, its test sender is used, which only delivers to the Resend account owner.
- **Contact alerts** go to the topic's inbox in Club Settings → Contact page, or the footer email. Plain text only. They're sent after the visitor sees "sent", so a slow or failed email never breaks the form; each enquiry records when it was emailed, and a blank shows one that wasn't.
- **Not built:** a "we've got your message" copy to the visitor. Anyone could type someone else's address into the form and have the club's website email them, so it's left out unless there's a clear need.

## 2026-10-16 — Demo club on staging

- **"Create demo club" button** above the Clubs list in the admin builds **Heathcote Golf Club** (fictional, from the Figma file) at `/preview/heathcote-demo`. Pressing it again deletes the demo club and builds it fresh, so it can be reset after testing.
- **Uses everything:** every block in every design style (a test fails if a new style is added and the demo doesn't use it), plus the menu, footer, announcement bar, cookie banner, course status, two courses, ten team members, twelve news stories (one draft, one scheduled), eight events, ten documents, contact settings and four enquiries.
- **Pictures are drawn in code** (simple illustrated landscapes and silhouettes), so nothing is copied, and every alt text starts "Illustration:".
- **Staging and local only**, for a super-admin with their code entered; refused on production. It only ever touches the club with the address `heathcote-demo`, and refuses to rebuild one that has editor accounts or an accepted agreement.

## 2026-10-16 — Menu and footer control

- **Parent pages** (Dan, 2026-10-16): any page can sit under another ("Parent page" in the page's sidebar), with an optional position number and a "leave out of drop-downs" tick. Addresses stay short (`/championship-course`, not `/golf/championship-course`), so moving a page never breaks a link. A page can't sit inside itself or its own child pages, or under another club's page.
- **Menu items** do one of three things: go to a page or link; open a drop-down of a page's child pages (kept up to date automatically, optionally with the page itself first and up to 4 extra links at the end); or open a drop-down of hand-picked links in up to 3 groups, each with an optional heading. Items saved before this keep working as they were.
- **Footer**: up to 3 link columns in every style (style C used to have none and style A showed only the first), each with its own heading and either hand-picked links or a page's child pages (so a column can match a menu drop-down).
- **Not done:** drag-and-drop ordering of pages (Payload's version is marked experimental), breadcrumbs, and pages three levels deep in drop-downs (only a page's direct child pages are listed).

## 2026-10-16 — Page drafts and live preview

- **Live preview for pages only** (Dan, 2026-10-16). The eye button at the top of a page opens the club's page beside the form, updating as the editor types, with Phone, Tablet and Desktop sizes. News and events don't have it: their layout is always the same.
- **Pages now have drafts.** Edits are saved as a draft automatically (under a second after typing stops) and reach the website only when the editor presses "Publish changes". The last 50 versions of each page are kept and can be restored. Every page that existed before this change was marked published, so nothing disappeared from any club's site.
- **Visitors only ever see published pages**, in the menus, footer columns, page links and events as well as the page itself. A page that has never been published doesn't exist as far as visitors are concerned.
- **Who sees drafts:** the preview (`?live=1` on the page's address) shows the draft only to someone signed in with their two-factor code who is that club's editor, or the super-admin. Anyone else adding `?live=1`, including another club's editor, sees the published page.
- **Version history stays inside each club:** an editor can list, open and restore only their own club's page versions, and deleting a page deletes its history.
- **Not done:** a preview for Club Settings (the menu and footer). It would show the home page after each save; possible later if wanted.

## 2026-10-16 — Browser security headers

- **Every response** (`next.config.ts`) says: only this site may frame it (`frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`; the admin's live preview frames the club's page on the same address), always use https (two years, without `includeSubDomains` because a club's own domain may have other sites under it), don't guess file types, send only the site's address when following a link, no camera/microphone/location/payment. `X-Powered-By` is off.
- **Not yet:** a full content security policy limiting which scripts run. It needs a per-request code for Next.js's own inline scripts and Google Analytics, so it's its own change, ideally alongside the pen test.
