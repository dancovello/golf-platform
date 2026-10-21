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

## 2026-10-16 — Release safety

- **Why:** staging releases failed 10 times in a row on 16 October without anyone noticing. A database change that worked on an empty database (every pull request's tests) failed on the release's copy of the real one: database accounts aren't part of a copy, and the change limited the website account's rights.
- **Every pull request now runs the release's dry run** (`migration-dry-run` in CI): main's database is built from main's own changes on one database server, copied to a second server exactly as a release copies the real database (`scripts/copy-database-structure.sh`, shared by both), and the pull request's changes are applied to the copy.
- **A failed release opens a GitHub issue** "Release to staging failed" (or production), which GitHub emails to Dan (Dan, 2026-10-16: a GitHub email is enough). Later failures are added to the same open issue. Close it once a release succeeds.

## 2026-10-16 — Page addresses and the Clubs list

- **Page addresses follow the same rule as news and club addresses:** lower-case letters, numbers and single dashes, up to 80 characters (`src/fields/slug.ts`, now shared by all three). Left empty, a page's address is made from its title when it is first published; not while drafting, so autosave can't fix it from the first few letters.
- **The addresses of the built-in pages (news, events, contact, privacy) are refused for pages**, because the built-in page always wins and the club's page would never be seen.
- **The Clubs list shows every club to the super-admin**, whichever club is picked in the club selector (the multi-tenant plugin's `useTenantsListFilter: false`). It used to show only the picked club, so the demo club looked as if it had vanished.

## 2026-10-16 — Browser security headers

- **Every response** (`next.config.ts`) says: only this site may frame it (`frame-ancestors 'self'`, `X-Frame-Options: SAMEORIGIN`; the admin's live preview frames the club's page on the same address), always use https (two years, without `includeSubDomains` because a club's own domain may have other sites under it), don't guess file types, send only the site's address when following a link, no camera/microphone/location/payment. `X-Powered-By` is off.
- **Not yet:** a full content security policy limiting which scripts run. It needs a per-request code for Next.js's own inline scripts and Google Analytics, so it's its own change, ideally alongside the pen test.

## 2026-10-16 — Password reset by email

- **On** (Dan, 2026-10-16), wherever email is set up (`RESEND_API_KEY`) **and** the admin's address is set (`ADMIN_URL`). Elsewhere "Forgot password?" is refused as before, so reset links never end up in server logs.
- **The link in the email always uses `ADMIN_URL`**, never the address the request came in on: anyone can ask for a reset email, and a forged address would send the reset code to someone else's site.
- **At most one email per account every 15 minutes.** Requests in between are quietly ignored: no email, no new link, and the earlier link keeps working. This protects inboxes and Resend's free allowance (100 emails a day), which Contact page alerts share.
- **The link works once, for one hour** (Payload's default). The 72-hour "set your password" links the super-admin makes are unchanged. Signing in afterwards still needs the authenticator code.
- The answer is the same whether or not the address has an account, so the form can't be used to find out who has one.

## 2026-10-16 — Contact form spam check: Cloudflare Turnstile

- **Added** (Dan, 2026-10-16). Before, one sender with a script could use up a club's 20-messages-an-hour allowance and block real visitors. Turnstile is Cloudflare's free "are you a person?" check; most visitors never see it (it asks for a click only when unsure).
- **On only when both keys are set** (`TURNSTILE_SITE_KEY`, public; `TURNSTILE_SECRET_KEY`, secret). Cloudflare's always-pass test keys work on staging and locally, never on production.
- **Checked on the server after the fields**, so a form sent back for fixing keeps its check. The check must have been made for this form (`action` "contact"). The visitor's IP address isn't sent to Cloudflare.
- **If Cloudflare can't be reached, the message isn't saved** and the visitor is asked to try again or phone or email: spam isn't let through. *Open to change if Dan prefers letting messages through during a Cloudflare outage.*
- **Privacy:** the privacy policy's cookies section mentions it (no tracking, no consent needed), and Schedule 3 of the data processing agreement adds the spam check to Cloudflare's role, so the agreement version is now `2026-10-16b-draft` (clubs are asked to accept again).

## 2026-10-17 — Admin: colour picker, club content, photo descriptions, uploads

- **Brand colours have a colour picker** (Dan): a swatch beside each colour code opens the computer's own colour picker. The code is still what's saved and checked for readability.
- **The super-admin can add club content only once a club is picked** in the club selector (Dan chose this over "never"): pages, news, events, team, courses, photos and documents. The server refuses it otherwise, and the form says "You're adding this for <club>" (editors don't see this; they have one club). Trusted scripts (demo club, tests) are unaffected.
- **Photo descriptions are optional** (Dan, 2026-10-17: they held people up). This relaxes doc 05's "alt text is required on every image": a photo without one is treated as decoration on the website (screen readers skip it), and the photo library marks it "Needs description" so it can be added later.
- **Photo library thumbnails** use the 640px copy's own address. Payload's default thumbnail address went through its file route, which can't find files kept in their own folders, so every photo showed as a file icon.
- **Bulk upload fixed:** a bulk upload shares one form between its files, so they all asked for the same storage folder and every file after the first failed with "invalid: prefix". Each file now gets its own new folder on the server, whatever the form sends.

## 2026-10-19 — Layout: carousels, scorecard, people profiles, event cards

- **Carousels run edge to edge** (Dan, 2026-10-17): the news, events, hole and timeline carousels spill to both window edges while the first card lines up with the page column.
- **A 9-hole scorecard fills the width** instead of a narrow card.
- **People profiles have Previous / Next** (and the arrow keys), with "3 of 8".
- **Event cards: option A** (Dan, 2026-10-19, from three options). A raised card: photo, category, title, then date and time, place and price together with small icons, and a full-width Book button at the foot (buttons line up across a row).

## 2026-10-19 — UX and accessibility pass

- **Web interface guidelines review** of the club site's code: no anti-patterns (no zoom blocking, no `transition: all`, no clickable divs, every image has dimensions). Added site-wide: a fallback keyboard focus ring, no tap delay, jump links that stop below the sticky header, balanced heading lines, and pop-ups that don't scroll the page behind them.
- **Skip link** was permanently visible on phones (the announcement bar is taller than its old "hide 100px above the header" trick). Now properly hidden until focused, and the first thing Tab reaches.
- **Page titles** without a hero no longer leave a double-height gap before the first block, and line up with the blocks on tablet and phone.
- **Automated accessibility scan (axe, WCAG 2.2 AA)** of 24 demo pages, desktop and phone: news and event labels moved from the accent colour (too faint on light backgrounds) to the brand text colour; every sideways-scrolling area (scorecards, hole lists, privacy tables, hole carousel) can be reached and scrolled with the keyboard; partner names and the disabled "Previous" fixed. The scan now finds no issues.

## 2026-10-19 — Site search (part 1: the index)

Dan approved site search from the Figma page "Search (v2)" (2026-10-19), with the rule that it must work on any club's site whatever they put on it, so nothing depends on particular wording or page set-ups.

- **One index per club, built from what the live site shows.** Published pages (the words in their blocks), published news from its publish date, upcoming events, and the team members, documents and courses that published pages display, plus the built-in News, Events, Contact and Privacy pages. Drafts, scheduled news, started events and anything not shown on a page can't be found. Each person, document or course result opens the page that shows it (documents open the file).
- **Not a Payload collection, and not the Payload search plugin.** The index is two plain database tables (`search_entries`, `search_state`) that only the website's own server code reads. The admin and the API can't reach them at all, and every query names one club first. No new dependency. The tenant-isolation suite checks club A's searches never return club B's content, and the reverse.
- **Kept fresh without slowing editors down.** Saving or deleting a page, article, event, team member, document, course or photo adds one to that club's change count, inside the same save. The next search for that club rebuilds its index first (about 0.05 seconds for the demo club), then searches are instant until something changes again.
- **Postgres full-text search** (English word endings, "golfing" finds "golf"), each word may be the start of a longer one as you type, and `pg_trgm` for spelling mistakes ("twilite" finds "Twilight" in titles) and "Did you mean" (from words in the club's own content). `pg_trgm` is added by the migration; it's a standard extension Neon supports.
- **Rate limit:** 120 searches a minute per visitor, counted per server instance. A Cloudflare rate-limiting rule in front of the site adds the edge limit doc 04 asks for once clubs are on their own domains (step 4).

## 2026-10-19 — Site search (parts 2–4: results page, header panel, answers)

- **Results page** at `/search?q=…` (Figma 2.6–2.9, 2.12), every view in the address. No members' area panel (Dan: no members-only content in v1). "Can't find it?" doesn't promise a same-day reply, which may not be true for every club. Labels use the brand text colour, not the faint accent (as news and events). The 404 page has its "Search the site" box.
- **Header panel** (Figma 2.1–2.5): a search button in every desktop header style, and "/" anywhere. **Phones search from the menu drawer** ("Search the site" at its top opens the full-screen sheet), because the Figma phone header has no search button, and adding one squeezed long club names until they broke mid-word. Tablets (768px and up, below the desktop header at 1024px) do get the search button in their header (Dan, 2026-10-19): there's room for it there.
- **Quick access** (before typing): the booking button and menu shortcuts, then live values each club has: course status, its main prices page ("from £…", the lowest price there), the first opening-hours row, and the next two events ("This week at the club", or "Coming up"). Contact the club fills any gap. No "next free tee time" (Dan: booking is the club's own system). "Popular right now" waits for part 5.
- **Smart answers** (spec §4) come only from structured fields every club has, never from wording: course status (Course Status), opening hours (Club Settings footer), prices (Rate Table blocks: rows named in the search, e.g. "twilight", else the main prices page; this season's lists when they give their months), one person (by name, or by the job word of their role: "secretary" yes, "membership" no; two matches is a list, not an answer), and the next event or competition. A search that fits two kinds of question gets no answer. Every card says where it came from and when it was updated. Email addresses are only on the results page, never in the panel's data.
- **Rate limit** trusts Vercel's own address headers; `cf-connecting-ip` only with `TRUSTED_PROXY=cloudflare` (security audit, 2026-10-19).

## 2026-10-20 — Text and logos follow the background (auto-contrast)

Dan, 2026-10-20: the site must stay legible whatever colours a club picks, and the logo must suit what's actually behind it. Details in doc 08, Rules 4 and 5.

- **Every text colour is chosen by an AA contrast check (4.5:1)** against the surface it sits on: the page, the brand colour, the accent, or a shaded photo. It uses the designed colour if it passes, then the club's other text colour, then white or black (Dan chose this over refusing to save). The save check that refused low-contrast palettes is gone. The two Figma palettes pass everywhere, so they look exactly as before.
- **Photos are measured on upload** (brightest areas and average colour, with `sharp`, which Payload already uses). Text over a photo gets at least the shading that brings it to 4.5:1 over the photo's brightest areas, so very bright photos look darker than before. Photos uploaded earlier are measured from their public file the first time a page shows them (stored straight to the record, no upload hooks). The release job is untouched and still can't reach media. New `media.tone_bright` and `media.tone_average` columns (migration `20261020_092237_media_tone`, add-only).
- **Logos are chosen by measured colour**, at 3:1 on the real background: the slot meant for it, then the other slot, then the logo shown in white or black. The transparent header swaps logos when it turns solid on scroll.
- **Check:** axe contrast over every block and template page for three test clubs, one with a pale brand colour (`tests/visual/contrast.spec.ts`, CI job block-regression), plus 2,000 random palettes in the unit tests.

## 2026-10-20: Branding palettes, header, menus and dashboard

Recorded afterwards from PRs #106, #108, #109 and #112–#116.

- **Ready-made palettes and suggested shades** (#108). Branding opens with eight one-click palettes (Parkland, Coastal links, Royal navy, Claret and gold, Heathland, Rose garden, Moorland, Slate and copper) and suggested shades under each colour box. Typing a club's own colour code still works. The computer's colour picker from 17 October was removed. The colours live in `src/theme/curatedColours.ts`.
- **Classic header: logo on the left** (#106), with the menu, search and a smaller (48px) booking button on the right. On 1024–1279px screens the button reads "Book". Pages without a hero no longer show a visible page title, but a hidden heading stays for screen readers and search engines. Only one menu item is shown as active: one that links straight to the page wins, otherwise the first section that lists it.
- **Drop-down panels** (#109, Figma spec 17). The panel opens under its menu item with the section name, "Overview →", and the pages in up to 3 columns of 6. Club Settings → Header and menu → "Drop-down style" is **Panel** (default) or **Panel + picture** (the section page's hero photo, or the brand colour). A section with fewer than 2 child pages is a plain link. Editors are warned at more than 18 links. The panel opens and closes in place, and only glides when moving straight from one open section to the next (#115).
- **Smart header** (#112). On computers the header measures whether the logo, menu, search and button fit on one row. If they don't, it shows the phone-style header with the menu button instead. This runs before the page is drawn, so nothing flashes. Menu labels never wrap. The menu limit went from 6 to 10 items. If a content security policy is added later, this inline script must be allowed.
- **Transparent header (style B) at every width** (#116). It stays over the photo down to phones and turns solid on scroll. With an announcement bar it starts below the bar.
- **Dashboard quick wins** (#113, from Dan's dashboard review). The sidebar is grouped: Website, Club information, Messages, Settings, and Platform (super-admin only). Footer settings are split into labelled sections. Fields that don't apply to the chosen design style are hidden.
- **Menu items, redesigned** (#114). "What it does" is now one of three choices: one page or link, a drop-down of 1–3 pages (each page is a column heading with up to 8 of its child pages, then "All … pages"), or a drop-down of typed links. "Link groups" became one "Links" list, because the website never showed group headings. A "What visitors will see" box previews the drop-down. Link text can be left blank and the page's name is used. The migration only adds data; the old fields stay hidden as a fallback.
- **Known gap:** the footer column "Links" custom check replaces Payload's own maximum-rows check.

## 2026-10-20: Step 4, clubs on their own web addresses

- **Club sites point straight at Vercel, not through Cloudflare** (Dan, 2026-10-20). Vercel advises against a reverse proxy in front of it (slower, harder caching, certificate problems), and Vercel Pro includes a firewall. Cloudflare stays for the platform's DNS, photos (R2), backups and Turnstile. This replaces "CDN / WAF" in doc 04's stack table for club sites.
- **Each club has a list of web addresses** (Clubs → Web addresses, super-admin only). The first is the main one; the others forward to it with a permanent redirect. The database refuses the same address on two clubs (unique index on `tenants_domains.hostname`). Addresses are saved bare and in lower case. The platform's own addresses (`localhost`, `*.vercel.app`, the admin address) are refused.
- **How a request finds its club:** `src/proxy.ts` looks at the address. A club's address is rewritten to `/sites/<address>/…` with an `x-club-host` header set by the proxy; any such header a visitor sends is removed. The page then finds the club only from its list of addresses (`src/site/resolveSite.ts`). An address no club has gets a plain "Page not found" that names no club. `/sites/…` can't be opened directly.
- **On a club's address, only its website exists.** `/admin`, `/api`, `/preview`, `/health` and `/sites` return "Page not found". The admin and API stay on the platform's own address.
- **Pages start at "/"** on a club's address (`/membership`, not `/preview/<club>/membership`). Staging keeps `/preview/<club>` behind the Vercel login, unchanged.
- **The admin's live preview** keeps using the platform's address (`/preview/<club>/<page>?live=1`), so it works on production too, but only for that club's signed-in editors and the super-admin. Everyone else gets "Page not found" there on production.
- **The Contact form takes the club from the address it was sent to**, never from the form. (On staging it still uses the club named in the page.)
- **Search engines:** every club page now has a proper title ("Membership | Club name"). On a club's own address it also has a canonical link and sharing details (the hero photo or logo). `robots.txt` and `sitemap.xml` are per club. "index, follow" applies only to club addresses on production; staging and the platform's own address ask search engines to stay away.
- **Connecting a domain is manual for now:** `docs/operations/connect-club-domain.md`. Automatic setup through Vercel's API, and a fallback address per club on the platform's domain, come later (the second needs the platform name).
- **Tests:** `tests/e2e/site-domains.spec.ts` (each test club on its own `*.localhost` address: separation, forwarding, unknown addresses, forged headers, search, sitemap, Contact form), `tests/int/domains.int.spec.ts` and `tests/unit/hosts.spec.ts`.

## 2026-10-20: Editor invitations by email (plan part C)

- **"Invite editor" and "New set-your-password link" email the link** to the editor wherever email is set up (`RESEND_API_KEY`) and the admin's address is known (`ADMIN_URL`). The email names the club, says the link works once for 72 hours, and explains the two steps: choose a password, then set up two-factor login with an authenticator app.
- **The link is still shown to copy**, as a fallback if the email goes to spam. The screen says whether it was emailed, and if not, why not.
- **Links use `ADMIN_URL` whenever it's set**, never the address the request came in on. Without `ADMIN_URL` nothing is emailed, and the on-screen link uses the super-admin's own address as before.
- **At most one of these emails per account every 15 minutes**, counted per server instance (only a signed-in super-admin can send them). It shares Resend's free 100 a day with Contact alerts and password resets.
- Staging and previews send every email to `EMAIL_OVERRIDE_TO`, never to the person invited.

## 2026-10-20: Nightly clean-up keeps the privacy policy's promises (plan part D)

- **Enquiries are deleted 12 months after they're marked handled, or 12 months after they arrived if nobody ever marked them** (Dan, option a). The privacy policy now says exactly that, plus that encrypted backup copies go within 35 days, matching the data processing agreement.
- **"Marked handled on"** is a new date on each enquiry, set by the server when an editor marks it handled and cleared if it's reopened; nobody can type it. Enquiries handled before it existed use their last change instead (so no existing data had to be rewritten).
- **Unused uploads are removed:** files in the platform's own random-folder format that no photo or document points at, once they're a day old. Anything else in the bucket is left alone. At most 200 files a night; more than that is logged as an error for a person to check. **Production only**, because staging's storage is shared with pull-request previews, whose files belong to other databases.
- **How it runs:** a Payload job queue task (`cleanUp`), started at 03:30 UTC daily by Vercel's scheduler (`vercel.json` → `/cron/clean-up`). That address only answers with Vercel's `CRON_SECRET`; without it, it doesn't exist. Finished jobs are deleted. Vercel only runs schedules on production.
- **Running jobs by hand** (Payload's `/api/payload-jobs/run`) is limited to a super-admin with their code entered. Payload's default would allow any signed-in account.
- **Dan to do:** add `CRON_SECRET` (any long random value) to Vercel's production environment. Until then the clean-up doesn't run.

## 2026-10-20: Error alerts and uptime (plan part B, build step 6)

- **Sentry, server-side only** (`@sentry/nextjs` 11.4.0, the newest release more than two weeks old). Errors in the website or admin are reported; nothing runs in visitors' browsers, so club sites load no extra script and need no consent. Browser-only errors aren't caught; that can be added later if needed.
- **Off unless `SENTRY_DSN` is set.** Reports carry no cookies, headers, form contents, query strings, accounts or IP addresses; email addresses are blanked; no tracing or breadcrumbs.
- **EU data storage (Frankfurt)**, chosen when the Sentry organisation is created (available on the free plan). Added to Schedule 3 of the data processing agreement (version `2026-10-20-draft`, so clubs accept again) and to the privacy policy.
- **Uptime: Sentry's one free uptime monitor on production `/health`**, instead of Better Stack, whose free tier is "for personal projects". A paid uptime plan that can check each club's home page is needed before several clubs are live.
- **Correction (2026-10-20, after checking):** production's `.vercel.app` address is behind Vercel's login, so the uptime monitor waits until the platform has its own domain; until then the release job's `/health` check is the only one. Sentry doesn't email about uptime unless an alert is created for the monitor. Turnstile's free plan allows 10 addresses per widget, so each club's domain is added to the widget when it's connected (`docs/operations/connect-club-domain.md`, step 4); one widget lasts for 8 clubs (open question in doc 03).
- Setup steps for Dan: `docs/operations/monitoring.md`.

## 2026-10-20: Club home screen (plan part E, first item)

- **A home screen above the dashboard's sections** (`src/admin/ClubHome.tsx`). A club's editor sees:
  - **Get your website ready, x of 6 done:** add your logo, choose your colours, footer email and postal address, set up your menu, publish your home page, accept the data processing agreement. Each step links to the right screen, and the card disappears once all six are done. Checked from the club's real data (`src/admin/clubSetup.ts`), never from wording.
  - **Messages:** the five newest unhandled Contact page messages, and a link to all of them.
  - **Everyday jobs:** update the course status, add a news story, add an event, edit the home page.
  - **Course status:** as shown on the website, with "Not updated today" after 24 hours.
- **The super-admin** sees the same for the club picked in the club selector, plus every club's setup progress.
- Every query names the club; the editor's page is checked for club B data in the browser tests.
- **Still to do from the review:** a Club Settings preview (refresh on save), a page-tree view, and previews for News and Events.

## 2026-10-21: Club Settings preview (plan part E, second item)

- **Club Settings have the same live preview as pages** (the eye button): the club's home page beside the form, with Phone, Tablet and Desktop sizes. It **reloads each time the settings are saved** (Dan chose refresh-on-save over drafts, 2026-10-20). Settings have no drafts, so the preview shows what visitors see straight after saving.
- Uses the same preview address and rules as pages (`/preview/<club>?live=1` on the admin's own address), so on production it works only for that club's signed-in editors and the super-admin.

## 2026-10-21: Page tree (plan part E, third item)

- **Above the Pages list, the club's pages as a tree** (`src/admin/PageTree.tsx`): each page under its parent page, in the order drop-downs use (home first, then position number, then A–Z), with its address and status: Published; Published, with unpublished changes; or Draft (visitors can't see it). Pages left out of drop-downs are marked. It can be folded away.
- **Read-only.** Pages are moved by opening them and changing "Parent page" (drag-and-drop ordering in Payload is still experimental).
- Built only from the club's own pages; a parent that isn't one of them puts the page at the top level. The super-admin sees it for the club picked in the club selector.

## 2026-10-21: News and Events previews (plan part E, last item)

- **News and Events get the live preview** (the eye button), reloaded on each save. News and events have a Draft/Published status rather than page-style drafts, so there's nothing to autosave.
- **News:** the article as visitors will see it, at its own address. **Events:** events have no page of their own, so the preview is the Events page with the event being edited shown first.
- **Drafts show only to that club's signed-in editors and the super-admin** inside the preview (`?live=1`, the same rule as pages). Visitors adding `?live=1` still see only published articles and upcoming published events. The event to show comes from the address only if it's a proper record ID, and only from the club's own events.
- The preview needs the article's address or the event's ID, so it appears once the item has been saved once.

## 2026-10-21: Content security policy

Approved by Dan, 2026-10-21 (doc 04 §8; "not yet" in the 16 October security headers entry).

- **Every page view gets a fresh one-time code** (`src/proxy.ts`, `src/security/csp.ts`). Only scripts carrying it run, plus the scripts those load (`'strict-dynamic'`): Cloudflare Turnstile, and Google Analytics after cookie consent. Next.js stamps the code on its own scripts; the header-fit script reads it (`src/site/components/InlineScript.tsx`). A code or policy sent by a visitor is discarded.
- **Allowed:** pictures and video from the site and the club photo domain; frames for OpenStreetMap, Turnstile and the admin's live preview; connections to the site, Turnstile and Google Analytics; fonts from the site only; forms only to the site; no plugins. The admin may also upload straight to storage. **Inline styles stay allowed**: club colours are set on elements, and a code can't cover style attributes.
- **Club sites (own domains and `/preview`): enforced. The admin: report-only** until a clean week of reports, then enforced by setting `ADMIN_ENFORCED` in `src/security/csp.ts` (review due 2026-10-28).
- **Reports** of anything blocked go to `/csp-report`: the server log, and Sentry once set up. Only the page path and the blocked item's origin are kept, at most 60 a minute per server instance.
- **Vercel's toolbar** is allowed on staging and previews only, never on production (Dan).
- **Gravatar turned off in the admin** (`admin.avatar: 'default'`). The policy found that Payload loaded each account's picture from Gravatar, sending a code made from the editor's email address to a third party on every admin page.
- **Tests:** `tests/e2e/security-policy.spec.ts` (every club page type, search, map, analytics after consent, the main admin screens, codes unique per view, forged codes ignored) and `tests/unit/csp.spec.ts`. Turnstile isn't in the automated tests (no keys there); it was checked by hand with Cloudflare's test keys.

## 2026-10-21: Marketing site (plan approved)

Approved by Dan, 2026-10-21. Plan: `docs/plans/marketing-site-plan.md`. Brief: `docs/marketing-site/HANDOFF.md`.

- **Runs inside the platform** (hand-off Q1): the same Next.js and Payload app, in its own route group, edited in Payload by the super-admin only. Same CI gates as everything else.
- **Live demos use sample content written in code**, fed into the real club block components with each demo club's colours and fonts. No demo clubs in the production database, and nothing a visitor can change. The "edit and live" demo changes the block in the visitor's browser only.
- **Addresses:** the marketing site on the company domain (and `www.`); the admin on its own address (`app.` on the company domain), so the public pages and editors' logins never share an address. On staging, the marketing site is the staging address's home page, with the admin at `/admin` as now.
- **One home for the company name**, email and domain: a single file in the code, used by the marketing site, the privacy policy and the agreement (today's "Clubhouse" placeholder moves there). Prices and other stated values live in Payload (`marketingSettings`).
- **Homepage and demo requests are kept for 12 months** after the last contact, then deleted by the nightly clean-up job.
- **The committee summary (A4 PDF) is removed.** Not built.
- **Bookings stays out of scope for v1:** the marketing Bookings page is an in-page preview with made-up times, labelled Coming next.

## 2026-10-21: Marketing site addresses (plan phase 1.1)

- **`MARKETING_HOSTS`** lists the company website's addresses, main one first (e.g. `brandname.golf,www.brandname.golf`). The others forward to the main one. Not a secret. Empty until the company domain exists.
- **On the company domain:** only the marketing site. The admin, API, previews, `/health` and club pages don't exist there (404), and a club can never be given one of these addresses.
- **On the platform's own address** (the admin's address, staging, previews, local): the admin, API, previews and platform services stay as they are; every other path is the marketing site. Once `MARKETING_HOSTS` is set, those paths forward to the company domain, so the admin's address never shows public pages. Until then (staging, previews) they're shown in place.
- **A club's domain never reaches the marketing site.** Its every path is that club's.
- **Search engines:** the marketing site may be indexed only on the company domain on production (`X-Robots-Tag: noindex` everywhere else, plus a "stay away" `robots.txt`).
- **Pages are rendered for each visit**, like club sites, because the one-time script code needs it (the hand-off said "static by default"). Content can still be cached behind the page.
- **Content security policy:** the marketing site gets its own, enforced, without the club-only extras (map, Google Analytics, Turnstile). Each comes back only when a marketing page needs it.
- **The company name, email and domain live in `src/brand.ts`.** The club privacy policy now names the provider from there ("Brandname" until the name is chosen; it said "Clubhouse"), so its "last updated" date moved to 21 October.

## 2026-10-21: Marketing site content (plan phase 1.2)

- **Three new things in Payload, under "Company website" in the sidebar, for the super-admin only:** Pages (`marketing-pages`), Photos (`marketing-media`) and Settings (`marketing-settings`). Club editors can't read, change or see them, in the admin or the API. They're platform-level in `src/tenancy.ts`, with no club.
- **Pages** have drafts (saved as you type) and a flat address each (`home` is `/`). Only published versions reach visitors (`src/marketing/content.ts`).
- **Sections** are the five marketing blocks: Section header, Text, Photo, Feature cards and Call to action band. Word limits from the Figma block rules are enforced: headlines 8 words, subheads 30. No size, font or colour choices. The band's buttons are always "Book a demo" and "Get your free homepage". Feature cards say "Coming next" for anything not live.
- **Photos need a description** (unlike club photos). They're stored under `marketing-media/` in the same bucket. The nightly clean-up only looks in the club folders, so it never removes these.
- **Settings** hold the stated values: price (£149), VAT wording ("+ VAT"), minimum term (12 months), notice (90 days), optional second-course price, optional restore window, and the Founder Card. An empty optional value means its claim isn't shown.
- **Every settings screen must define its own access**, now checked by `tests/unit/access-guard.spec.ts` (the first global). Document locking stays off for it.
- **Moved to phase 5:** the homepage and demo request collections, so their fields match the Figma forms when those are built.
- **Live preview** for marketing pages comes in phase 2, with the styled blocks.

## 2026-10-21: Marketing site look (plan phase 1.3), built from Figma

Built from the Figma page "Marketing site" (170:28407): the variables, the CMS blocks section (210:7925), the block rules (212:8319), the interaction rules (220:8582) and the mobile frames (273:8954, 274:9185, 297:9754). Checked side by side with Figma at 1440 and 390 wide, and the key measurements are pinned in `tests/e2e/marketing-look.spec.ts`.

- **Tokens:** every Figma marketing variable as `--mk-*`, including `accent-haze` (primary button hover) and `accent-peach` (Beta badge). Scoped to the marketing `<body class="mk">`; a test proves none reach a club site.
- **Type:** the Figma text styles. Figma letter spacing is a percentage of the font size, so a 60px heading is −1.08px. Phones use Mobile Display (44/48) and Mobile Heading (32/36), with body text at 16px.
- **Fonts:** Newsreader and Hanken Grotesk, self-hosted from Fontsource 5.3.0 (SIL Open Font License).
- **Layout:** a 1200px container. Desktop sections are 128px apart, with 96px above a CTA band and 64px from header to content. Phones have 20px sides and 64px sections, and a page intro starts 40px down. **Tablet isn't designed**: 32px sides and 96px sections are derived.
- **Blocks, with their fields from the Figma component descriptions** (second migration, `marketing_blocks_from_figma`, adds columns only):
  - **Section Header:** eyebrow, title (line breaks kept), body and alignment (left or centre). Page size for the first one, Section size elsewhere.
  - **CTA Band:** title and body, plus editable buttons that default to "Book a demo" (`/book-a-demo`) and "Get your free homepage" (`/switching`). Links must be a page on the site or a safe web address. Centred on desktop; left-aligned with full-width 44px buttons on phones.
  - **Media:** Plain or Window frame. Window has the Browser Chrome bar with an editable address. Width comes from the layout (720px, or 480px for portrait), with an optional caption.
  - **Rich Text:** 40px above H2, 32px above H3, 20px between paragraphs, the Figma bullet, and a dawn-ruled quote.
  - **Features:** Rows (the default: hairline above, icon beside text, two columns) or Cards (boxed, 24px apart; 2 a row, 3 for 3 or 6, two rows of two for 4, four a row for 8). An icon from the shared set, optional link, and the "Coming next" Availability Badge (text and icon).
- **Buttons:** Marketing/Button primary and secondary, with hover (haze or hover surface, arrow nudges 3px), press (0.97) and focus (dawn ring) states. The arrow is hidden on phones, as in the mobile frames.
- **Icons:** the club sites' icons from the same Figma set are reused. Lock, calendar, players, flag and sun are the Figma SVG files, drawn in the current colour.
- **404 (not designed):** a Section Header and a CTA Band in plain words, as the hand-off says.

## 2026-10-21: Error messages always reach the person

- **Found while building the marketing blocks:** Payload shows an error's message only when the error has a name, and takes the name from the class name. The production build can shorten that to nothing. Unrelated code changes did exactly that, so messages like "Passwords must be at least 12 characters." became "An unknown error occurred."
- **Fix:** `publicError()` in `src/errors.ts` creates the same error with its name set. All 11 places that made one directly now use it.
- **Test:** `tests/unit/public-errors.spec.ts` checks the message survives, and fails if any code creates an `APIError` directly again.

## 2026-10-21: Marketing controls (plan phase 2.1)

Built from the Figma "Marketing · Controls" section (219:8340) and its neighbours. Each component's Figma description sets its behaviour.

- **Button:** adds Ghost (nav-level, secondary text) and Disabled (40%). A link when it has an address, otherwise a real button.
- **Nav Link, Text Link** (the underline draws in from the left; visited links keep their colour) and **Icon Button** (always labelled; 36px to see, 44px to tap; pressed 0.95).
- **Switch:** `role="switch"`; the knob springs and stretches when pressed; 44px hit area.
- **Pill Tabs:** a tablist where the active pill slides; arrow keys, Home and End.
- **Segmented control, Tenant Chips:** radio groups with arrow keys. The tenant swatch is the club's colour.
- **Filter Chips, Time Slots:** native radios. Taken slots are disabled and struck through, not just greyed.
- **Field:** the error is tied to the input (`aria-describedby`), with a rose border and message.
- **FAQ Item:** a disclosure button with `aria-expanded`; opens over 180ms, instantly with reduced motion.
- **New token:** `accent-rose` #d97f78 (errors).
- **One change from Figma for accessibility:** the selected Tenant Chip's style label uses secondary text, because tertiary fails 4.5:1 there (open-questions D1).
- **Review page:** `/dev/components` shows every control live. It's for the super-admin signed in with their code, on the platform's own address only, and returns a 404 everywhere else.

## 2026-10-21: Marketing nav, footer, founder card and live preview (plan phase 2.2)

- **Nav** from Figma Marketing/Nav (175:1875) and Nav Mobile (272:8990):
  - The links are the component's labels: Website builder · Tee times (with the Coming next clock; goes to `/bookings`) · Switching · Pricing · Trust. The hand-off's "expected" list differed; it also says to take labels from the component.
  - The actions are Club log in (to `ADMIN_URL/admin`), Free homepage (`/switching`) and Book a demo.
  - Transparent at the top; glass with a hairline after 8px of scroll.
  - On phones, the menu is a full-height sheet: focus stays inside it, and Esc closes it.
  - **The Search button is left out**: there's no marketing site search for it to open (open question N9).
- **Footer** from Footer (175:1876) and Footer Mobile (272:8991): the site map in three columns plus the legal links. The status dot is left out until real monitoring feeds it (hand-off §7). Contact is the company email.
- **Proof Stat** (264:8700): a component for the home page's researched stats (phase 4).
- **Founder Card** (264:8707; stacked under 600px, 272:9022):
  - Text and links come from the marketing settings. The defaults are the Figma wording; the migration only sets those defaults.
  - Without a calendar link, "Book a call" goes to the Book a demo page. Without a phone number, "Call" isn't shown.
  - Your initial shows until a photo is added.
- **Phone buttons are 36px tall**, as in the mobile nav and cards. Only the CTA band's phone buttons are 44px (mobile CTA frame).
- **Live preview:** marketing pages have the admin's preview panel. It shows the latest draft at `/dev/preview/…`, on the platform's own address, for the signed-in super-admin only.

## 2026-10-21: Live demo engine and Tenant Morph (plan phase 3)

- **Demo clubs** (Figma Marketing/Tenant Morph, 176:2177):
  - Ashgrove Park (Heritage, `ashgrovepark.golf`) and Kingsmere (Booking-led, `kingsmere.golf`) use the default palette.
  - Carreg Bay Links (Coastal, `carregbay.golf`) uses the Figma "Demo · Coastal links" palette.
  - All three use the Heritage font set. Their content lives in `src/marketing/demo/clubs.ts`, never in the database (decision B).
- **Real blocks, not pictures:**
  - `DemoFrame` is the Browser Chrome bar plus the actual club block component (e.g. `Hero`), given sample content through the same `BlockContext` the club sites use.
  - On desktop the block is laid out at the club template's 1366px design width and scaled to the frame; on phones it shows the club's own phone layout.
  - The club's colours and fonts are set on the frame only. Tests prove they don't reach the page around it.
- **Accessibility:** the club block inside a frame is a picture of a club site, so it's `inert` (no keyboard stops) and hidden from screen readers. The frame's label ("Demo club: Ashgrove Park's home page") is read instead.
- **Pictures** are the demo club's illustrations, drawn in code (`src/demo/sceneSVG.ts`). The Figma hero photos aren't used because their licences aren't confirmed (hand-off §11).
- **The Booking-led demo shows the club's booking button**, which works today, not Figma's tee-time search bar, which is coming next (hand-off §6: "shows no unbuilt booking feature").
- **Tenant Morph:**
  - On desktop the hero switches club as you scroll past (about a viewport each).
  - With reduced motion or on phones it stays on Ashgrove Park until a chip is chosen.
  - The chips work by keyboard and keep focus when the club changes.

## 2026-10-21: Marketing home page (plan phase 4)

Built from Figma "Home — Desktop" (176:2178) and "Home — Mobile" (273:8954). Each section is a bespoke marketing block, editable in the CMS (hand-off §5). One migration adds their tables only.

- **Home hero:** headline, body, two buttons and a proof line, with the Tenant Morph below.
  - The proof line's price comes from the settings (`{price}`), and the editor refuses typed prices.
  - On phones the morph shows no browser bar, as in the mobile frame.
- **Proof stats and Good vs poor:** the researched stats, with the hand-off's exact sources, and the two panels with footnotes.
- **Edit and live:** the real Hero block, laid out about 900px wide and scaled into the card.
  - Visitors can type the headline and eyebrow and flip the switch, and the hero follows. Nothing is saved.
  - Figma calls it a static pair; the hand-off asks for it to be interactive.
- **A week at the club:**
  - Four moments with previews of live blocks, in the demo club's style.
  - On desktop they go upcoming → active → past as you scroll; phones get a swipeable row that keyboard users can scroll; reduced motion shows the final state.
  - The previews are pictures of blocks, so they're inert and hidden from screen readers; the moment's title and text say what they show.
- **Your content comes with you:** the example is shown on the demo club's address and labelled "Demo club".
- **Founder card:** full width, from the settings.
- **Starter content:**
  - "Add the Figma pages (as drafts)", above Company website → Pages, adds the home page from the Figma copy (`src/marketing/starter/pages.ts`).
  - It never touches a page whose address is already used.
  - It's for the super-admin with their code entered, from the admin only.
- **Differences from Figma** are listed as D2–D5 in `docs/marketing-site/open-questions.md`.

## 2026-10-21: Marketing Pricing page (plan phase 5.1)

Built from Figma "Pricing — Desktop" (185:3821) and "Pricing — Mobile" (274:9185). Logged here with phase 5.2; the page itself is in PR #138.

- **Every number comes from Settings.** Copy uses `{price}`, `{vat}`, `{term}` and `{notice}`, in Section Header and CTA band bodies and in the calculator. The editor refuses a typed price.
- **The calculator** prices the website only. Modules that aren't live (tee-time bookings, members area, facilities booking) are dimmed rows with the Coming next badge and "Price confirmed at launch". The second course appears only once its price is set (Q3).
- **Phones:** one calculator card, price first. Centred headers go left on phones on every page, as in all of Figma's phone frames.
- **Questions** sit in their own section, with a compact header beside them on desktop.

## 2026-10-21: Switching page and the free homepage form (plan phase 5.2)

Built from Figma "Switching — Desktop" (186:6494) and "Switching — Mobile" (300:9636).

- **The Homepage Request Form** (club name, current website, email) saves to **Company website → Homepage requests**, which only the super-admin can see. Nobody can create one through the admin or the API; only the form can.
- **Spam protection**, the same as the club Contact form:
  - a hidden spam trap;
  - a signed time check, made only after the fields are checked, so a person who presses the button at once is told what to fill in;
  - Cloudflare's "are you a person?" check (Turnstile), made for this form only;
  - at most 20 requests an hour.
  The marketing site's security policy now allows Turnstile.
- **"We'll send your homepage by {date}":** two UK working days, skipping weekends and England & Wales bank holidays. The bank holidays are a saved copy of the GOV.UK list (to the end of 2028). A test fails a year before it runs out.
- **Emails:**
  - The request goes to the inbox set in Company website → Settings → Requests, with replies going to the club.
  - The club gets a plain confirmation with the date. It leaves out the website they typed, so the form can't be used to send links to strangers.
  - Without an inbox set, the request is still saved.
- **Kept 12 months after the last contact** (decision F): the nightly clean-up deletes requests untouched for 12 months.
- **The example under the form** is the demo club's real homepage hero, in place of Figma's deprecated URL Reskin (hand-off §6).
- **Old page addresses (N7):** Figma's "redirect your old page addresses" lines are softened until N7 is answered.

## 2026-10-21: Book a demo page (plan phase 5.3)

Built from Figma "Book a demo — Desktop" (187:7336) and "Book a demo — Mobile" (275:9525).

- **Until a calendar is connected (Q4), the page offers email.** The booking panel says "Pick a time by email" with a button that opens an email to the company address. This is the plan's agreed fallback.
- **The Demo Booking component is built** (Details → Pick a time → Booked) and on the review page (`/dev/components`) with sample times. Nothing is booked there. It shows only weekdays with free times; arrow keys move through the days; the times are radios. Connecting a calendar means giving it real free times and a way to book. "Add to calendar" and "Reschedule" wait for the calendar, which provides both.
- **Never says how long the call lasts** (hand-off §6); a test checks the page.
- **No CTA band**: the page is the call to action. The founder card has the page's own line, and has no "Book a call" button that would only reload this page.
