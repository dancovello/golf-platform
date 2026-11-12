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
- **Uploads go straight from the browser to R2** (Vercel refuses request bodies over 4.5 MB), using a 10-minute signed link that can't overwrite an existing file. Links are only issued for the allowed types (JPEG, PNG, WebP, AVIF, MP4, WebM, and SVG for club files; 50 MB), and the file is stored and served as that type (`src/media/uploadGuards.ts`; Payload itself doesn't check its own list at this step). Payload then downloads the file once and checks its real contents, refusing the record if they don't match.
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
- **Rate limit:** 120 searches a minute per visitor. *Updated 22 Oct: counted in the database shared by every server, with a Vercel Firewall rule as the edge layer (club sites don't go through Cloudflare). See `docs/operations/rate-limits.md`.*

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
- **Check:** axe contrast over every block and template page for three test clubs, one with a pale brand colour (`tests/visual/contrast.spec.ts`; no longer run in CI since 9 Nov, run it by hand with `pnpm exec playwright test --project=visual`), plus 2,000 random palettes in the unit tests.

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
- **Fonts:** Silka (Light, Regular, Medium, SemiBold) for headings and text, self-hosted as WOFF2 under the Hopp Studio licence. Replaced Newsreader and Hanken Grotesk on 28 Oct.
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

## 2026-10-21: Website builder page (plan phase 6.1)

Built from Figma "Website builder — Desktop" (183:3008). Figma has no phone frame for it; phones use the same patterns as the other pages.

- **Block Flipper:** the real Hero block in its three styles (Heritage, Resort, Booking-led) for one demo club, flipped with the arrows, the arrow keys or a swipe.
  - Club blocks change layout with the screen's width, not their box's, so Tablet and Mobile show the hero in a small embedded page (`/frame/hero/<style>`) that really is 768 or 390 wide, scaled to fit.
  - That page has its own bare layout (no marketing nav), is never indexed, and nothing in it can be focused.
- **Token Dial:** picking a colour re-skins the Booking-led demo club's hero using the club sites' own colour rules (`src/theme/colour.ts`).
  - The readout says what the product really does: the colour is never changed, and the text on it uses whichever of the club's light and dark text colours reads at WCAG AA.
  - Figma's "#F2E28C → #7A6A12, deepened" doesn't happen in the product, so it isn't shown (Q5, D12).
- **Course guide:** the real Hole Grid (style C) with the demo club's Championship course card, the same numbers as the staging demo club (now shared in `src/demo/courseCard.ts`).
- **Course status:** the course report and a news post, drawn by the same preview cards as the home page's "A week at the club".
- **Built in:** eight feature cards. Two of Figma's were reworded and one replaced so every card is true today (D13, D14).
- **No product film** (Q8).

## 2026-10-21: Bookings page, a Coming next preview (plan phase 6.2)

Built from Figma "Bookings — Desktop" (184:3614). Booking is out of scope for v1, so the page is a labelled preview: "Coming next · designs from our build. Not live yet. Prices and times are examples."

- **Tee Sheet Simulator:** pick an open slot and it's held for ten minutes with a live countdown; confirm and it turns Full; release and it frees up. Full, members-only and competition slots can't be held. Nothing is booked. Screen readers hear "held", "booked" and "released", not every second of the countdown.
- **Club Settings Panel:** the card guarantee adds or removes the Card details step and unlocks the no-show fee. The copy is in the future tense ("will be settings your club controls").
- **Facilities Carousel:** range, simulators and spa, with tabs or a swipe. Its booking button says facility booking is coming next.
- **The tee sheet and date chips are drawn in the demo club's colours and fonts**, like the club components they preview. They're marketing code, not club blocks, because the club booking blocks aren't built yet.
- **Left out:** the Works With strip (deprecated in Figma; it may only name providers a live club links to, and there are none yet).

## 2026-10-22: Safety checks that catch a cross-club leak (job 2)

All of these run in the `tenant-isolation` CI job and block merging.

- **Access-skip allowlist** (`src/security/override-allowlist.ts`): every place server code skips Payload's access rules, with the club it's limited to and why. That includes Local API calls that leave `overrideAccess` out, which Payload treats as a skip. A new one fails the build until it's listed. Review: `docs/security/override-review.md`.
- **Raw SQL** must use Drizzle's `sql` tag, never text joined together (`tests/unit/raw-sql.spec.ts`).
- **Every collection in the running config** has reviewed access, including the ones Payload and plugins add (`tests/int/config-access.int.spec.ts`). Payload's `payload-migrations` collection allows everything, so it must never get a web address.
- **Isolation manifest** (`src/security/isolation-manifest.ts`): every collection, non-standard endpoint, web route and server action names the test that proves isolation for it. Adding a route, endpoint or collection without one fails the build.
- **New isolation tests:** page history and drafts, the job queue, photo file addresses, paste-from-URL (off), switching off two-factor, and platform files (health, robots.txt).

## 2026-10-22: Rate limits shared across servers (job 4)

- **Search and the security-report address counted in each server's memory**, so the real limit grew with the number of Vercel servers. They now count in one database table, `rate_limits` (reviewed migration `20261022_091355_rate_limits`), with a single upsert per request (`src/security/rateLimit.ts`).
- **No IP addresses are stored:** the key is an HMAC (with `PAYLOAD_SECRET`) of the address and the date, so it changes daily. The nightly clean-up deletes counts over a day old.
- **The edge layer is Vercel Firewall**, not Cloudflare (club sites point straight at Vercel, decided 20 Oct). Dan adds the rules in `docs/operations/rate-limits.md`. `TRUSTED_PROXY` stays unset.
- **The contact form's per-club limit is unchanged:** it already counts saved enquiries in the database.
- **Inventory:** `src/security/rateLimitInventory.ts`; a test fails if a route, endpoint or server action has no entry.


## 2026-10-22: The repository goes back to private (job 6)

- **History:** private from 10 Oct (above), made **public on 15 Oct** so GitHub Actions minutes were free, and now **private again** (Dan, after the 21 Oct grilling). It was public for about a week. Nothing secret was in it: gitleaks scans every pull request, and secrets live in Vercel and GitHub.
- **CI minutes:** about 7,400 a month at today's pace, against GitHub Pro's 3,000 for private repositories. CI now skips the slow checks for docs-only pull requests, and runs the browser checks on drafts only once they're marked ready. That gives an estimated 5,750 a month. Merging the small checks into fewer jobs (as PR #65 proposed) and skipping browser checks on merges to `main` would bring it to about 3,200; both need Dan's OK (`docs/operations/ci-minutes.md`).
- **Guard:** the release workflow's first step fails if the repository is public, so staging and production releases stop until it's private again.

## 2026-10-22: AI security review on every pull request (job 7)

- **Anthropic's `claude-code-security-review` action** runs on every non-draft pull request into `main`, pinned to commit `0c6a49f`, with Claude Opus 5.5 and a project brief that puts tenant isolation first (`.github/security-review/`).
- **A HIGH finding fails the required `security-review` check.** So does a review that fails to run: the action alone would report zero findings then. Only Dan can dismiss a finding, with the `security-finding-dismissed` label plus a comment of his starting "Security finding dismissed:".
- **Cost:** about $1 a review and 5–12 CI minutes, so roughly $150 and 750–1,800 minutes a month at October's pace. The model is one line to change (Sonnet 5.5 halves the cost). Details were in `docs/operations/ai-security-review.md`, now `docs/operations/security-review.md`.
- **Secret:** `ANTHROPIC_API_KEY` in GitHub Actions secrets only.
- **Replaced on 26 Oct**, see below. The key was never added, so it never ran.


## 2026-10-22: Club editors sign in with a password; super-admins keep two-factor (job 3)

**Supersedes** "Two-factor login is required for every account" (2026-10-11, step 2 decisions and devops review). Dan decided this after the 21 Oct grilling, so editors aren't put off by an authenticator app and can use "Forgot password?". **Must be checked by Dan's devops contact before it merges** (it reverses something he approved).

- **Super-admins:** two-factor exactly as before. Without their code they reach nothing but their own account. Without two-factor set up, the admin sends them to the set-up screen, and they can't switch it off.
- **Club editors:** a password is enough. Editors who already set two-factor up keep it and still need their code; they may switch it off. How it's done: `docs/plans/password-only-editors-spike.md`.
- **Compensating controls:**
  - passwords of 12+ characters;
  - locked for 10 minutes after 5 wrong attempts (unchanged);
  - **editor sessions end 8 hours after login**: each login token lasts an hour and is renewed while the admin is open, but not after 8 hours (`src/auth/sessionLimit.ts`);
  - **an email to the account whenever its password is set or changed**, where email is set up.
- **"Forgot password?"** turns on where `RESEND_API_KEY` and `ADMIN_URL` are both set (unchanged code). It answers the same whether or not the address has an account. At most one email per account every 15 minutes.
- **Isolation:** the whole isolation suite (integration and browser) now runs with password-only editors, because that's the new normal. Tests also prove that a super-admin with a password but no code reaches nothing, and that escalation attempts still fail.
- **Data processing agreement:** Schedule 2's security wording now describes this. Version `2026-10-22-draft`, so clubs accept again. The club privacy policy doesn't mention two-factor, so it's unchanged.
- **Invite and reset emails** no longer tell editors they'll need an authenticator app.

## 2026-10-22: Club sites' data is cached, cleared when a club publishes (job 5)

- **The data behind club pages is cached in Next.js's data cache** (`unstable_cache`, `src/site/cache.ts`). The pages themselves are still made per view, because each needs a fresh one-time code for the security policy. Why not `'use cache'`: `docs/plans/club-data-cache-spike.md`.
- **Never across clubs:**
  - every cached loader takes the club's ID first, and the ID is in its key and its only tag;
  - the two address lookups (slug and web address to club) are keyed by the address;
  - drafts and the live preview never use the cache.

  Tests: `tests/int/cache-isolation.int.spec.ts` (part of the isolation suite) and `tests/e2e/site-cache.spec.ts`. The isolation manifest lists every cached loader.
- **Cleared at once** for one club when anything it owns is saved or deleted (`src/site/cacheHooks.ts`). Anything that depends on today's date is kept at most 5 minutes, and everything at most an hour, which covers changes made around the website (scripts, restores).
- **Emergency switch:** `SITE_DATA_CACHE=off`.

## 2026-10-22: Stronger isolation testing, red team, live canary (job 9)

- **Randomised isolation tests:** random reads and writes as each role (both editors, anonymous, super-admin) across every club-owned collection. After every step they check that nothing read belongs to another club and nothing of the other club changed. 500 steps on every change (database layer, plus 500 random REST requests). 10,000 nightly (`.github/workflows/isolation-nightly.yml`, about 2 minutes, which opens an issue on failure). Seeded and replayable.
- **Red team, session 1** (`docs/security/red-team-1.md`): 14 kinds of attempt, each a test; none got across.
- **Live canary** (`docs/operations/canary.md`): two hidden clubs on production, which can never be given a web address. An hourly Vercel cron signs in as canary A's editor over the real web address and tries to reach canary B; any success raises a Sentry alert. **Built, but switching it on is Dan's call** (it creates production data).
- **Row-level security in Postgres: not now** (`docs/plans/postgres-row-level-security-spike.md`).
- **Browser tests** always start a fresh server with an empty data cache.

## 2026-10-22: Website functions run in London

- **`vercel.json` sets `"regions": ["lhr1"]`** (London), for production, staging and previews. Until now they ran in Vercel's default, Washington, D.C., while the database is in London (Neon, `aws-eu-west-2`). Every database query crossed the Atlantic, and club pages make 16–30 queries a view (`docs/operations/performance.md`).
- **Nothing else depended on the old region** (checked 22 Oct):
  - Cron: the nightly clean-up's time is in UTC, wherever it runs.
  - Sentry: sends to its EU (Germany) region.
  - Resend: sends from Ireland (`eu-west-1`).
  - Photo storage: Cloudflare R2, Western Europe.
- **Answers** the question left open in "2026-10-15 — Data processing agreement in the admin" ("before the first real club") and marketing open question N6.
- **Still to do, with Dan's go-ahead:** the agreement's sub-processor table (`src/agreement/text.ts`, Schedule 3) still says Vercel is "USA (Washington, D.C.), or London if the hosting region is changed". Changing that wording needs a new `AGREEMENT_VERSION`, so every club accepts it again. While the agreement is a draft with no clubs, it can wait for the solicitor's review. The club privacy policy doesn't name regions, so it needs no change.
- **"Stored in London"** (marketing Trust page) is still held: photos, documents and backups are in Western Europe, not the UK (claims register).

## 2026-10-24: Homepage Request Form gets the Contact form's limits

Dan asked for the public forms audit's fixes on the company website's Homepage Request Form too (the audit said they applied to it once built).

- **5 sends per visitor in 10 minutes**, checked in the app (a server action runs from any page address).
- **20 requests an hour**, now counted in one step, so a burst can't overshoot.
- **Emails:** at most 10 requests emailed a day. Every email from the public forms (Contact alerts, request alerts and confirmations) now comes out of one shared allowance of 70 a day (`WEBSITE_FORM_EMAILS`), keeping 30 of Resend's 100 free daily emails for password resets and invitations. Past either limit the request is saved, with its "sent" dates blank.
- **Email addresses** use Payload's own rule, shared with the Contact form (`src/email/address.ts`).

## 2026-10-26: the security check is free (Semgrep), not the paid AI review

- **Dan, 26 Oct:** no paid API for this. The `security-review` check now runs **Semgrep Community Edition** (free, open source, no account or key), pinned to 1.180.0, with Semgrep's free TypeScript, JavaScript, Node, React, Next.js and security-audit rules. It replaces the 22 Oct AI review (about $150 a month), which never ran because its key was never added.
- **Same check name and the same rules for Dan:** only what the pull request adds counts; an ERROR finding fails the check; a scan that fails to run fails the check; only Dan can dismiss a finding (label plus written comment, after the latest push).
- **What it can't do:** it matches known patterns and doesn't understand club isolation. That stays with the required tenant-isolation suites, the access-rule guards and `migration-guard`, plus the independent review before launch. Details: `docs/operations/security-review.md`.
- **About a minute** of CI time a run, against 5–12 for the AI review.


## 2026-10-27: Staging releases while the repository is public

- **Why:** the repository is public again until 1 Nov (Dan). The 22 Oct guard stopped every staging release from 24 Oct (#147 to #193), so staging stayed on the 23 Oct release.
- **Change:** the "repository must be private" check now runs only for production releases. Staging releases run whether the repository is public or private, as they did from 15 to 22 Oct. Secrets stay in GitHub and Vercel and are masked in logs; gitleaks still scans every pull request.
- **Production:** still stops while the repository is public. Production releases are on hold anyway until Dan reviews the marketing pages.

## 2026-11-02: Events with a date but no start time

- **Why:** open days and similar events often have a date and no start time, but every event needed one, so the Cottrell open days had to stay out of What's on.
- **Change:** a "No set start time" tick on an event (one migration adding a column that defaults to off). Only the date is shown on event cards, the featured panel, search and the quick answers. A saved event is stored at the start of its UK day.
- **Stays up all day:** a normal event leaves the website once it has started; one with no set time stays until its day ends (UK time), in the events feed, the archive and site search. It is listed first on its day.
- **Wording:** just the date (for example "Sat 14 Jun"), not "All day", because an open day is not necessarily all day.

## 2026-11-02: Ladies' figures on the scorecard

- **Why:** the first real club (Cottrell) showed that UK scorecards carry a women's course rating and slope per tee, a ladies' stroke index, and sometimes a different ladies' par. A tee held one rating and slope, and a hole one stroke index.
- **Change:** four optional course fields: women's rating and slope on each tee, ladies' par and ladies' stroke index on each hole. The existing rating and slope are now labelled "(men)". One migration that only adds empty columns.
- **Kept simple:** ladies' par is one figure per hole ("only if different"), not a par for every tee colour. Par only differs on the ladies' tees in practice. Nothing shows unless the club fills it in, so existing scorecards look the same.
- **Wording:** "Ladies'" on the public scorecard (what UK clubs print); "women" for the ratings (the handicap system's term).

## 2026-11-02: Public prospect demos at /demo/<club>-<ending>

- **Dan, 2 Nov:** clubs should be able to see a demo (a homepage or a full site) from a link in an email, with no account.
- **Where:** the company's own domain (and the platform's own address), at `/demo/<short name>-<random ending>`. The ending is 16 random characters (about 79 bits; first made 8, raised after the automated security review), so other clubs' demos can't be guessed.
- **How long:** 30 days. The page strip reads "Demo - expires in X days". After that the link says it has expired. Nothing is deleted, and the date can be extended.
- **Rules:** never indexed (page and header), no sitemap entry, contact form sends nothing, no editor accounts, no web address, never the canary clubs.
- **Going live:** switch the demo off (clears the link), then add the club's web address. The live site is indexable on its own domain, since demo pages and live pages are different routes. This is a go-live checklist step (`docs/operations/prospect-demos.md`).
- **The `/preview/…` rule is unchanged:** it still exists on staging only.
- **Still to build:** a "promote" tool that copies an approved club from staging to production, keeping edits (the second PR). Until then, demos exist only where the club was built.

## 2026-11-02: Clubs built straight onto production; no promote tool

- **Dan, 2 Nov:** a staging-to-production "promote" tool isn't needed. The club's content file is the master copy, so a club that signs up is built again on production, and a demo is switched off to go live.
- **Change:** `pnpm import-club-production <folder> [demo]`. It builds a new club only and refuses if the short name is already on production, so it can't overwrite edited work. It needs a typed `production` and Dan's approval, uses the website's limited `golf_app` account (never the owner), and removes a half-built club if the run fails. `demo` switches the public demo link on in the same step.
- **Trade-off:** production's database address and photo keys sit in a private file on Dan's Mac (outside the project, never committed). A GitHub-run button would keep them in GitHub; not built.
- **Rule kept:** edits made in an admin are never overwritten by a re-run, because production runs never replace.

## 2026-11-02: Page tree removed

- **Dan, 2 Nov:** the tree above the Pages list isn't wanted. `PageTree`, its data loader and their tests are gone; the Pages list is the normal Payload list again. Nothing in the database changes.
- **Deleting a club now works from the Clubs list (Dan, 2 Nov: "unable to delete a club").** The database still refuses to delete a club that owns anything, so a `beforeDelete` hook on Clubs (`src/collections/Tenants.ts`) first removes the club's pages, news, events, photos and the rest (the list in `src/tenancy.ts`), in the same transaction. It **refuses if the club has editor accounts or an accepted agreement**: those are real records and must be removed deliberately. Super-admin only, as before. Tests: `tests/int/delete-club.int.spec.ts`.

- **SVG uploads (Nov 2026):** club files (not the company website's) accept SVG, because logos and icons are often SVG. An SVG can carry code, so `src/media/checkSvg.ts` checks it before the record is saved, for server and browser uploads alike. It refuses (never quietly edits) any file with scripts, event handlers, embedded pages, or links to other addresses; only links within the drawing (`#gradient`) are allowed. Maximum 1 MB. The file stored is exactly the file checked. SVGs are chosen from the library only for a club's logos (`ClubSettings`); photo fields still take photos only.

## 3 Nov 2026: the demo and homepage request form emails nothing to the person who sent it

- Dan's decision: the email field is only so he knows where to send his follow-up. The form no longer sends the person a confirmation. The alert to the company inbox stays, with the person's address as its reply-to.
- "Request your homepage" stays as a page (it reverses the 21 Oct "no free homepage" wording; docs 19 and 20 are updated to match when the v2 pages land).
- `confirmationSentAt` stays on the request record for older requests (no data deleted, no migration), and shows in the admin only when set.


## 2026-11-03: The live preview points at the block being edited

- **Dan, 3 Nov:** hard to tell which block you're editing when many are open. Now, when you click or type in a block in the page editor, the live preview scrolls to that block (just under the site's header) and outlines it in blue. Typing in another field, such as the title, clears the outline.
- **How:** the editor (`src/admin/BlockHighlighter.tsx`) tells the preview which block with a message to its own address only; the preview (`src/site/components/BlockHighlight.tsx`) finds the block by an invisible marker placed *after* each block, in the preview only (`RenderBlocks live`). Markers go after, not around, so the preview's layout is the live site's (the hero-over-header styles rely on the first block being the first element). The public site is unchanged.
- **Limits:** it follows the page's blocks, not rows inside a block (cards, questions): those point at their block. Blocks that draw nothing aren't outlined.

## 2026-11-03: Wireframes in the "Add block" list

- **Dan, 3 Nov:** the block list showed plain placeholders. Each of the 20 page blocks now has a simple wireframe (grey shapes for photos and text, the brand green for buttons and highlights), drawn in `src/blocks/previews.ts` and given to Payload as each block's list picture (`admin.images.thumbnail`). No image files to host and nothing extra to load. `tests/unit/block-previews.spec.ts` fails if a new block is added without one.

## 2026-11-03: "View page" button on the page screen

- **Dan, 3 Nov:** a View page button on the page edit screen. It is Payload's own external-link button beside Save, labelled "View page" (`admin.preview` on Pages, `viewPageURL` in `src/site/livePreview.ts`). It opens in a new tab: the club's real address once the page is published and the club has a web address (production only), otherwise the club's preview of the page, drafts included, which only that club's signed-in editors and the super-admin can open.

## 2026-11-03: Categories: one editable list per club

- **Dan, 3 Nov:** editors couldn't add a news category (the six were fixed in the code), and categories shouldn't be tied to news, as events may want them later. There is now a general **Categories** section (Website group in the admin): one shared list per club, which editors add to, rename and remove. Club-owned like everything else, with the usual isolation tests.
- **Used by news first.** An article's category and a "Latest news" block's category are now links to that list, not the old fixed choice. Events keep their own fixed list for now; moving them over later means adding a category field and a small migration, not a new section.
- **Starter list.** Every new club gets Course news, Competitions, Clubhouse, Membership, Academy and Club news (`src/collections/defaultCategories.ts`, created by the club's creation hook). The migration gave every existing club the same six and pointed each article and news block at the matching one, before dropping the old columns. The guard's approved list records it; **it needs Dan's `approved-destructive-migration` label** because it drops those columns.
- **Web addresses.** Each category has a short address (`course`, `competitions`…) made from its name when it is created. Renaming doesn't change it, so existing `/news?category=course` links keep working.
- **Order** on the website is the order they were added. There is no reordering yet (kept simple on purpose).
- **Safety.** A category that articles still use can't be removed (the message says to move them first). An article or news block can only use the club's own categories (checked on save, like photos and pages). Removing a whole club removes its categories after its news.
- **Scripts.** The demo club, the canary clubs and the club importer look categories up by address; content files can say `"category": "@category:competitions"` (a plain `"competitions"` still works for news).
- **Not updated automatically:** the search index's small category label on a news result refreshes when that article is next saved, not when a category is renamed.

## 2026-11-03: Company domain a1engine.co

- **Dan, 3 Nov:** bought `a1engine.co` through Vercel, so Vercel also manages its DNS and issues the certificates. No records need sending to anyone.
- **Addresses (Vercel → Domains, Production):** `a1engine.co` is the main company address, `www.a1engine.co` forwards to it, and `app.a1engine.co` is the admin. Production sets `MARKETING_HOSTS=a1engine.co,www.a1engine.co` and `ADMIN_URL=https://app.a1engine.co`. Staging and previews keep their own addresses.
- **In the code:** `BRAND.domain` in `src/brand.ts` is now `a1engine.co`. The company email is `daniel@a1engine.co`, on Dan's existing Google Workspace account with `a1engine.co` added as a domain (Google's mail, spam-protection and signing records are in Vercel's DNS).
- **Still to do:** verify `a1engine.co` as the sending domain in Resend and set `EMAIL_FROM_ADDRESS`; check whether the marketing forms need `a1engine.co` on the Turnstile widget (the free widget lists 10 addresses); point the uptime monitor at `app.a1engine.co/health`. Nothing is public until the held main → production release.

## 2026-11-03: The first production release since 23 Oct stopped at the privacy gate

- **What happened:** Dan merged the release PR (#253, `main` into `production`). The Release workflow stopped at its first step, "The repository must be private (production only)", because the repository was public (it had been public again since 27 Oct). The backup, dry run, database changes and deploy were skipped, so production was not changed. The 28 Oct release (#207) stopped the same way.
- **Fix:** Dan made the repository private on 3 Nov, so production releases can run. The rule itself is unchanged (22 and 27 Oct): production releases only while the repository is private. Staging may release either way.
- **A re-run does not help.** "Re-run failed jobs" and "Re-run all jobs" replay the original event, including the repository details recorded at that moment, so the gate still saw "public" after the repository was made private. After making the repository private, release with a **new** merge into `production` (a release PR with at least one change in it).
- **Where this leaves it:** `production` and `main` had the same content after #253 merged, so a release PR had nothing in it. This note is that change. The pending database changes, including `20261103_124458_categories`, are applied by the release that follows.
- **GitHub Actions minutes:** while private, runs draw on the 3,000 free minutes a month (`docs/operations/ci-minutes.md`). Dan chose not to pay for extra.

## 2026-11-04: Sentry switched on (error alerts and uptime)

- **Account:** Dan set up the Sentry organisation `a1-engine-27` on the free Developer plan, stored in Germany (`de.sentry.io`), project `golf-platform`. His earlier account was deleted; Sentry's trial email was right that a new account falls back to the free plan after 14 days. The free plan's monthly error allowance is unclear (Sentry's pricing page says 5k, its docs show 50k), and at our size either is plenty.
- **On in Vercel:** `SENTRY_DSN` for Staging and Production, one key for both. Reports carry Vercel's environment name, so production can be filtered from the rest (staging may show as `preview`; not yet checked). Dan redeployed both on 4 Nov. Nothing in the code changed.
- **We did not use Sentry's own "get started" setup or plugin to change the code.** It turns on tracing, logs and similar extras by default, which would break the privacy promises above (errors only, scrubbed, server-side). The Sentry connection was used only to create the project and the alerts.
- **Alerts:** "Email me about every new issue" was added; Sentry's two default alerts remain. Tested with two fake errors from a local script (tagged `test`, then resolved); the email arrived.
- **Uptime:** Sentry's one free monitor now watches `https://app.a1engine.co/health` every 5 minutes (down after 3 failures), connected to the new alert. This closes the "point the uptime monitor at `app.a1engine.co/health`" item in the 3 Nov domain entry. The email on an outage has not been tested.
- **Not yet proven:** an error from the live site itself reaching Sentry. The first real one will show it; a protected test route could be planned if wanted sooner.

## 2026-11-05: Video block: pop-up window, grid or carousel, full width (Bearwood review B-03, B-08, B-09, B-18, B-20)

- **Style A (Featured)** still plays in place, now the full width of the block's container (it stopped at 960px, about two thirds of the page on a wide screen).
- **Style B is now a gallery:** pressing a picture opens the video in a pop-up window (a native dialog: Esc, the cross or a press outside closes it, focus returns to the picture, and closing stops the video). Nothing loads from YouTube or Vimeo until a picture is pressed, as before. The pop-up uses the same player address and the same `frame-src` rule, so there is no CSP change.
- **Layout choice (style B):** "Automatic" (default; existing blocks): up to 3 videos are a grid from 768px wide, more than 3 are a carousel (3 in view, 2 on tablets); on phones two or more always swipe. "Always a grid" (one column on phones) and "Always a carousel" are the other two.
- **The "Watch on YouTube / Vimeo" link is removed** from every video. The address is still worked out by `parseVideoURL` (its `watchURL`) but not shown.
- **Not done here:** custom branded player controls (B-21, needs research and a security review), and Featured layout variants and a button (B-04).
- **Migration** `20261105_230301_video_layout`: one new column (with its draft copy), default "auto". Additive.

## 2026-11-05: Video style A: layouts, description and button (Bearwood review B-04)

- **Three layouts for the featured video**, chosen per block ("Layout (style A)"): *Standard* (as before: heading above, video below), *Full width* (heading, description and button centred above a full-width video) and *Half and half* (the video runs to the edge of the page on the left or right, the text beside it, centred on the video; like Two-Column "Split"). Existing blocks stay Standard.
- **A description and one optional button** (to a page, a built-in page or a web address) on the featured video. "A document" as a destination comes with the document-link change (PR for B-17) and can be switched on here once that has merged.
- **Phones:** half and half stacks (video, then text). Nothing about how the video loads changed: it still plays in place and nothing is requested from YouTube or Vimeo before it is pressed.
- **Migration** `20261105_231351_video_featured_layouts`: new columns (layout, video side, description, button) and their draft copies. Additive.

## 9 Nov 2026: CI trimmed to save GitHub Actions minutes
- **Removed the block picture check** (CI job `block-regression`, the "Update block pictures" workflow, the approved pictures). It failed on every deliberate style change and cost about a quarter of each run (6–16 minutes). The text-contrast check (`tests/visual/contrast.spec.ts`) stays in the repo but no longer runs in CI.
- **Migration dry run** now runs only when a pull request changes `src/migrations/`. Releases still run it in full.
- **Dependabot** is monthly, at most 2 open pull requests. **Isolation fuzz run** is weekly (Mondays) instead of nightly; every pull request still runs the isolation suite.
- Dan removes `block-regression` from the required checks on `main` (GitHub → Settings → Branches).
- **Browser tests (same day):** `browser-tests` runs on pull requests only, not on merges to `main`; the `marketing-*` specs are skipped when a pull request touches nothing the marketing site shares with the club sites (`ci.yml`, `marketing_paths`).

## 2026-11-05: A document as a link destination, and buttons on the text block (Bearwood review B-17)

- **"A document" is a new "Goes to" choice** on every link and button inside a page block (hero, card grid, two-column, rate table, team, membership and the text block's new buttons). It opens the file in a new tab. It is **not** offered on the site header, footer, announcement bar, events or contact templates: those read links separately and still take a page, a built-in page or a web address.
- **Same club only.** A document link is looked up within the club like every other reference: the page's same-club check lists it, the website looks it up with the club's tenant, and a document from another club (or one that was deleted) simply drops the link. Deleting a document empties the link (the database sets it to blank).
- **Text block buttons:** up to four, each with its own text and destination, under the text. The first is solid (accent on a brand-colour background), the rest outline.
- **Migration** `20261109_143637_document_links`: additive only (new "document" choice on each link's type list, a nullable document column beside each link, and one new table, with its draft copy, for the text block's buttons).

## 2026-11-05: Documents use the club's Categories list (Bearwood review B-25)

- **One list for news and documents (Dan's choice).** A document's category is now picked from the club's Categories (Website → Categories), the same list news uses, instead of a fixed set of six. The picker is not filtered, so a document can be filed under "Club news" if an editor chooses to.
- **Starter list:** new clubs start with the six news categories plus the six document ones (Course & scorecards, Policies, Forms, Minutes, Visitors, Other). The old "course" document category became `course-scorecards`, because "Course news" already owns the address `course`.
- **Migration `20261109_150000_document_categories`** adds the six document categories to every existing club (skipping an address the club already has, e.g. its own "policies"), points every document at its category and makes the column required. Tried on a throwaway database with documents in every old category and one club with its own "policies": all converted, none crossed clubs, and the rollback restores the old values. **The old `category` column is left in place** (nothing reads it, it has a default) so nothing is deleted; dropping it is a separate change needing the `approved-destructive-migration` label.
- **Policies still need a "last reviewed" date**, now checked against the category named "policies" (by address), so a club that renames it keeps the rule and one that deletes it loses it.
- **News pills:** because the list is shared, the news archive only shows a category pill when it has live news (plus the one being viewed). Without that, every club's news page would gain Policies, Forms and the rest as dead-end tabs.
- **The Document List** groups and tabs by the club's categories, in the order they were added.

## 2026-11-09: Payload 3.93.0 (security release) and a workaround for a plugin bug
- **Payload 3.93.0 and all its packages** (db-postgres, email-resend, live-preview-react, next, plugin-multi-tenant, richtext-lexical, storage-s3, translations, ui). Payload flags this release as containing vital security updates (among them enforcing read access on block content in queries and constraining global-view redirects to a user's own clubs).
- **Bug found by our own isolation tests:** in plugin-multi-tenant 3.93.0 the Club Settings redirect misreads the names of the accounts' club list, so every club editor looked as if they had no clubs and was bounced to the admin home page (super-admins were fine). Nothing leaked; editors simply couldn't open Club Settings.
- **Workaround:** `src/admin/fixGlobalViewRedirect.ts` passes the redirect the two field names it actually reads. Harmless once the plugin is fixed; delete it then. Covered by a unit test and by the existing "Club Settings opens club A's own settings" browser test.

## 2026-11-09: Launch decisions on prices, leaving and cookies (Dan)

- **VAT:** Dan is not VAT registered, so no "+ VAT" wording. The site shows the monthly cost only.
- **Setup fee and courses:** the setup fee is Dan's own per-club arrangement and stays off the site. The one/two courses selector in the pricing calculator is to be removed, because course count is reflected in that fee.
- **Leaving:** no content export. A club that stops paying loses its site; this is a subscription service. Marketing wording must say this plainly and must not promise Markdown, CSV or original-file exports.
- **Cookie notice:** appears after the golf ball intro, never over it.
- **Settled:** suppliers' data terms accepted by Dan; privacy policy approved by his solicitor; demo call timings set; real logo is in the golf ball.
- The full to-do list is `docs/plans/launch-checklist-2026-11-09.md`.

## 2026-11-09: Hourly database check, not every 5 minutes (Dan's choice)
- **Why:** the Sentry uptime monitor (`/health`, every 5 minutes) only proves the app answers. A database outage would have gone unreported while no one was visiting.
- **Choice:** `/cron/database-check` runs hourly from Vercel's scheduler and sends one fatal Sentry report when the database doesn't answer within 15 seconds. Putting the database into `/health` instead would mean a query every 5 minutes, which stops Neon's database from ever sleeping: about $19 (roughly £15) a month extra on production at the smallest size, from Neon's Launch price of $0.106 per CU-hour. That can move to the 5-minute check nearer launch, when visitors keep the database awake anyway.
- **`/health` is unchanged**, so the release workflow's health check behaves as before.

## 2026-11-09 (later): Launch wording built

- **Cookie notice after the intro:** the shared banner (`src/site/privacy/CookieConsent.tsx`) now waits while `<html data-intro>` is set and appears when the golf ball intro ends or gives up. Club sites have no intro, so their banner is unchanged.
- **No VAT wording, no course selector.** The `{vat}` token now fills with nothing (saved text that still has it loses it). The VAT wording, second-course price and courses text settings are hidden and unused; they were not dropped, because dropping a column is a destructive migration. Migration `20261109_201550_launch_wording` only changes the pricing small-print default and makes the VAT field optional.
- **Setup fee:** kept, with no number, worded as depending on the size and needs of the club. A new FAQ answer, "What does the setup fee cover?".
- **Leaving:** FAQ is now "What happens if we cancel?", worded like any subscription. No export is promised.
- **Pages already saved in a database keep their old text** (starter pages only apply when first added) until edited in the admin or updated by a script with Dan's go-ahead. The old footnote "Prices exclude VAT" and FAQ "What happens if we leave?" are the ones to change.

## 2026-11-09: Data processing agreement finalised (Dan)

- **Provider:** Daniel Covello, a sole trader (not a registered company), trading as A1 Engine, 41 Clarence Embankment, Cardiff; contact daniel@a1engine.co. There is no company number.
- **Approved:** Dan says the wording is approved and the liability clause is agreed, so the "Draft" notice is off (`AGREEMENT_APPROVED = true`) and the version is `2026-11-09`. Any club that accepted the old draft version is asked to accept again.
- **Sub-processors:** Vercel is London (functions region `lhr1`). Neon: Standard Contractual Clauses with the UK Addendum, and Sentry: Data Privacy Framework with the SCCs and UK Addendum as a fallback, both as their own DPAs describe them. Resend's row points to Resend's DPA, because its transfer safeguard was not confirmed.

## 2026-11-09: Releases run while the repository is public (Dan)

- **Why:** the Actions minutes ran out while the repository was private. Nightly backups failed from 6 to 9 Nov, and once the repository was public again the production release (#303) stopped at the "must be private" check.
- **Decision:** the repository stays public for now, and the release workflow's check is now a warning, not a stop. Supersedes the "Guard" line of 22 Oct.
- **Next:** CI will be trimmed so the free minutes last a whole month before the repository goes private again (audit fix plan, `docs/plans/audit-fix-plan-2026-11-09.md`).

## 2026-11-10: The demo booking form gets the other forms' spam checks (audit fix step 2)

- **Why:** the booking form was the only public form without bot checks, so a script could fill every open slot and send Google Calendar invitations to made-up addresses.
- **What:** the same three checks as the Homepage Request Form: a hidden "website" box, the page's signed time check (a booking within 3 seconds of the page opening is a robot; valid 24 hours), and Cloudflare's check (action `booking`). A robot caught by the first two is told "booked", but nothing is saved or sent. Cloudflare failing or unreachable books nothing. The existing limits and slot checks run after.
- **Code:** `src/marketing/booking/proof.ts`, `submit.ts`, `actions.ts`; the form is `src/marketing/site/booking/DemoBooking.tsx`. `submitDemoBooking` now requires the proof, so nothing can call it without the checks.

## 2026-11-10: A nightly second copy of photos and documents; database backups kept 7 days (audit fix step 5)

- **Dan's decisions:** database backups are kept 7 days, not 30. The live photo bucket is about 930 MB, inside Cloudflare's 10 GB free allowance, so the copy costs nothing for now.
- **Copy:** nightly (03:00 UTC) from `golf-platform-media-production` to `golf-platform-backups/media/production/`. A file that has gone from the live bucket is moved to `media/removed/` and deleted by a lifecycle rule after 7 days. Stops and opens an issue if more than 200 files look removed or the live bucket looks empty. Code: `scripts/lib/mediaMirror.ts`, `scripts/media-backup.ts`.
- **Two tokens, one job each:** the existing backups token (read and write on the backup bucket only) and a new read-only token on the live bucket.
- **Not relied on:** R2 object versioning (not confirmed) and server-side copy between buckets (the job downloads and uploads).

## 2026-11-10: Sign-in limit in code, daily two-factor cap, trusted preview address (audit fix step 9)

- **Per-address limit:** 20 sign-in, forgot-password or reset attempts per address in 10 minutes (`SIGN_IN_LIMIT`), in the app's shared database, on top of the account lockout and the Vercel Firewall rule. Not counted where there is no address (scripts, tests): on Vercel every request has one.
- **Two-factor:** at most 30 code attempts a day per account (`TWO_FACTOR_CODE_LIMIT`), on top of the plugin's 5 guesses per 10 minutes (audit-auth H1).
- **Live preview:** the preview address is built only from one of the admin's own trusted addresses (`src/auth/trustedOrigins.ts`), so a made-up Host header can't point it elsewhere (finding m6).
- **Pooled database:** on Vercel, a Neon `DATABASE_URL` without `-pooler` is logged and sent to Sentry as one warning at startup (finding M11). It can't be read from Vercel, so the code checks it.
- **Pinned:** `three` and `@types/three` are exact versions (finding m8).

## 2026-11-10: Super-admin sessions end after 12 hours; incident plan (audit fix step 10)

- **12 hours:** a super-admin's session is no longer renewed 12 hours after sign-in (editors keep 8), so an admin left open asks for the password and two-factor code again (audit-auth H2, finding M13). Code: `src/auth/sessionLimit.ts`.
- **Incident plan:** `docs/operations/incident-plan.md`, one page: how you find out, the first ten minutes, being locked out, telling clubs (including a personal data breach), afterwards.
- **Open (Dan):** an offline emergency second super-admin account. Not created.

## 2026-11-10: Hourly check of every club's own address; missed email alerts visible (audit fix step 7)

- **Why not Sentry monitors:** the free plan has one uptime monitor, used by the production admin. A paid plan, or a second service, would cost money for no gain over a job we already know how to run.
- **What:** `/cron/club-sites` (hourly, production only): loads each club's home page; each club that doesn't answer gets its own Sentry issue (fingerprint per address), which emails Dan. Clubs join the check as soon as they have a web address. It skips access rules to read club addresses only (listed in `src/security/override-allowlist.ts`).
- **Missed email alerts:** the Enquiries list shows "Emailed to the club"; blank means the alert didn't go out (the message is always saved).

## 2026-11-10: The audit log (audit fix step 12a, finding M6)

- **What:** a platform-level collection `audit-log` (`src/collections/AuditLog.ts`, new table, migration `20261110_185248_audit_log`) and one writer, `recordAudit` (`src/audit/record.ts`). Super-admin reads it in the admin (Platform → Audit log); nobody adds, changes or deletes an entry through the admin or API, not even the super-admin.
- **Recorded (12a):** password sign-in, two-factor code accepted / set up / switched off / reset, accounts created / removed / email changed / password changed or set from a link, password links and invitations, clubs created / changed (name, short name, web addresses, demo) / deleted, the demo club built, marketing starter pages added. 12b adds deleted club content.
- **Not recorded, on purpose:** failed sign-ins (an attacker could flood the table; the account lockout and the per-address limit already cover them), page text, photos, passwords, codes, IP addresses, and ordinary saves.
- **Who:** account ID, email and type; "system" for scripts and scheduled jobs. The club is stored as plain text (ID and name), not a link, so deleting a club or account never touches the log.
- **Can't break the action:** a failed write is logged and sent to Sentry; it never throws and doesn't join the action's database transaction.
- **Kept 12 months** (Dan, 10 Nov): deleted by the nightly clean-up (`deleteOldAuditEntries`). It holds editors' email addresses, so it counts as personal data (security records, legitimate interests).
- **Emergency account alert:** if `EMERGENCY_ADMIN_EMAIL` is set in Vercel Production and that account signs in, Sentry emails at once (fatal). Nothing happens while it is unset; set it when the account is created (`docs/operations/incident-plan.md`).

## 2026-11-10: The admin's security policy is enforced (audit fix step 8)

- **What:** `ADMIN_ENFORCED = true` (`src/security/csp.ts`): the admin now blocks what its policy doesn't allow, as club sites and the company site already did.
- **Why the reports were misleading:** the admin was report-only since 21 Oct, and Sentry collected about 300 "would block" reports. While a policy is report-only, Next.js doesn't put the one-time code on the page's own scripts, so every script was reported. Production's login page had 0 of 20 script tags with a code; the same build enforced had 20 of 20. Enforced, no violation on 13 admin list and settings screens, the edit and create screens or the login screens, and all 98 admin browser tests pass.
- **Watch:** the "Security policy would block / blocked" Sentry issue should stop growing within a day. If something real is blocked, it appears there. Going back is one line (`ADMIN_ENFORCED`), but while report-only every script is reported again.
- **Still open from the same audit finding (headers audit, finding 1 step 2):** club previews are served from the admin's own address; moving them to their own address needs the platform domain.

## 2026-11-10: The nightly clean-up works in batches (audit fix step 14, finding M8)

- **Before:** the unused-files check loaded every photo and document record into memory, then listed the whole storage bucket, inside a 60-second limit. That works for a few clubs and times out as they grow.
- **Now:** it reads the bucket one page at a time (1,000 files) and checks only that page's folders against the database with one query, so memory and time stay flat however many clubs and files there are. The route's limit is 120 seconds, and the scan stops at 90 seconds with a warning (log and Sentry) instead of being cut off; whatever it didn't reach is checked on another night.
- **Unchanged safety rules:** files must be a day old, only the platform's own random-folder format is touched, nothing is removed past the nightly limit of 200 (it fails loudly instead), and only on production.

## 2026-11-10: "Did you mean" uses a cached word list (audit fix step 13, finding M9)

- **Measured first** (benchmark club: 900 items, 1.9 MB of text, local Postgres): a normal search about 10 to 15 ms in the database; the suggestion query about 147 ms on every search that found nothing, growing with the club's text.
- **Fix:** each club's list of searchable words is built once and cached for at most 5 minutes (`clubSearchWords`, `src/search/query.ts`, listed in the isolation manifest; cleared when the club's content changes). The suggestion then compares against that list: about 5 to 9 ms. The list is capped at 40,000 words.
- **Not changed:** the index is still rebuilt on the first search after an edit (decisions of 19 Oct: nothing rebuilds while editors type). Not measured at scale; measure a real big club before changing it.


## 2026-11-10: The hourly club address check scales to many clubs at once

A second audit (10 Nov) pointed out that the hourly check of every club's own address (5 at a time, 10 seconds each, 60 second limit) would run out of time at about 30 clubs all down, which is exactly when the alert matters. It now checks 20 at a time with an 8 second wait each (about 100 clubs all down in 40 seconds) and may run for 120 seconds. It stops starting new batches after 90 seconds, and if any clubs were not checked it says so in its own Sentry issue ("Club site check ran out of time") and fails, so a widespread outage can never look like a quiet hour. The code moved to `src/monitoring/clubSites.ts` so the batching and time limit are tested directly.

## 2026-11-10: The release checks that the new version can use its database (audit step 3)

`/health` answered "ok" without touching the database, so a release that couldn't reach its data counted as healthy. New `/health/database` runs `SELECT 1 FROM tenants LIMIT 1` as the website's own `golf_app` account (so a lost permission or an unfinished database change fails too), with a 15 second limit for a sleeping database, and answers 200 `{"status":"ok"}` or 503 `{"status":"database unavailable"}` with no reason given. The release workflow now checks it. **The 5-minute uptime monitor stays on `/health`:** calling the database every 5 minutes would keep Neon awake (about £15 a month, decided against on 9 Nov); the hourly database check still covers that gap. The route asks the database once per server per 10 seconds however many calls arrive, so it can't be used to flood the database or keep it awake.

## 2026-11-10: Production releases switch on only after the new version passes its check (audit step 4)

Before: the release deployed straight onto the live address, then checked, and a failure only opened an issue. Now (`scripts/release-deploy.ts`, decision logic in `scripts/lib/safeRelease.ts`, called from the `deploy` job): production builds the new version with `--skip-domain` (no live address), checks `/health/database` on its own private address, and only then runs `vercel promote`; the live address (`https://app.a1engine.co`) is checked again and, if that fails, the version that was live is put back with `vercel rollback` and the release fails with an issue. If the live version can't be identified beforehand, the switch still happens but a failed live check asks for a manual rollback. **Staging is unchanged** (build, then check): Vercel's docs only describe `--skip-domain` with `--prod`, so whether it holds back a staging (custom environment) address is unproven; staging releases are the place to learn that, not a reason to risk them. The decision logic is tested with fakes for every failure path (`tests/unit/safe-release.spec.ts`) and the script was run against a fake Vercel command; **the first production release is the first real run**, and it only matters on the failure path. The migration guard now prints the two-release rule for any database change that drops, renames or retypes something (add first; remove in a later release), on top of its existing need for Dan's label. A database change that already ran is not undone by switching versions back: the restore runbook is the last resort.

## 2026-11-11: Releases talk to Vercel's web API for the switch-on, and prove access first (fix for the 10 Nov failure)

The first production release to use the staged switch-on (#334, run 42993025986) built and health-checked the new version, then failed at `vercel promote` with "User not found (404)"; the earlier `vercel inspect` (finding the live version for a rollback) failed the same way and was silently ignored. Cause, from the CLI's own code (v63.1.2): `promote` and `inspect` first call `GET /v2/user` ("which user am I?"), which answers 404 for the release's token (not a personal user token), whereas `vercel deploy` skips that lookup when `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are set, which is why every earlier release worked. Visitors were never affected (nothing had been switched on); Dan promoted the checked deployment by hand in Vercel. The fix: (1) `scripts/lib/vercelApi.ts` makes the same requests the tool makes afterwards (`GET /v13/deployments/<address>` for the live version; `POST /v10/projects/<project>/promote/<deployment>` to switch on, also used for the rollback), with the token and team id, and never the user lookup; the switch-on now waits until the live address really serves the new version; (2) a failed lookup is now reported in the run summary, and a refused switch-on says the new version is built and checked, still not live, and how to promote it by hand; (3) a read-only `vercel-access` job runs first in every release, before the backup and the database change, so a broken token or setting fails the release before anything changes (this time the database change had already run); (4) `.github/workflows/vercel-access.yml` runs the same check by hand (after changing a Vercel token), optionally also sending the switch-on request for the version already live, which changes nothing. Tested with a fake Vercel API, including the exact 404; **the first release with this is still the first real run of the switch-on request**, which the by-hand check (with the option ticked) can prove before then.

## 2026-11-12: Course tour, part 1: what a hole can hold

The Course tour (one page per hole; brief in `docs/plans/course-tour-build-prompt.md`, designs on the Figma page "Course Tour (hole pages)") needs more on each hole than the Hole by hole and Scorecard blocks do. Dan's answers of 12 Nov are built in here.

- **New on each hole**, all optional, grouped under "Course tour details (optional)" so a club that only wants a scorecard never opens it: up to 11 more photos (the existing "Photo" stays the main one, so nothing changes for Hole by hole), a hole plan picture, "About the hole" (1,200 characters, a blank line between paragraphs), three "How to play it" notes (off the tee, the approach, on the green; 500 characters each), and up to 8 "Watch out for" tags of 24 characters.
- **New on the course:** "Who the playing tips are from" (80 characters), one line for all holes.
- **Tees:** a fifth colour, black, with the same limit of four tees per course (a club picks which four). Each tee can be given its own name of up to 25 characters; left empty, the colour word is used as before. A tee with no yardage for a hole is not shown for that hole (Dan, 12 Nov), which is how the site already behaved.
- **A photo on every hole is advice, not a rule** (Dan, 12 Nov): imported clubs often have none, so the fields stay optional and the hole page must still look right without one. When a club has no hole photos we ask them for some.
- **Left out because only one of the three designs had them** (decided with the designs): a signature-hole flag, key distances, hole shape, a course map with the hole highlighted, a photo per note, a "club to hit" label.
- The database change only adds (new columns, a new tee colour, and two link tables for the extra photos and the tags). Every photo a hole points at is checked to be the club's own, as the main photo already was.
