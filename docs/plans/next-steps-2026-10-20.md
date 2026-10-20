# Next steps plan (proposed 2026-10-20)

**Status: proposed, waiting for Dan's approval.** Nothing here is built yet. Each part is one branch and one PR, in the order below, unless Dan changes it.

| Part | What | Size | Needs Dan |
|---|---|---|---|
| A | Step 4: club domains (tonight) | Large: 2–3 PRs | Two decisions, a domain, a few dashboard steps |
| B | Step 6: error alerts and uptime monitoring | Small | Two free sign-ups |
| C | Editor invitations by email | Small | Nothing beyond `ADMIN_URL` |
| D | Keep the privacy policy's promises (clean-up jobs) | Small to medium | One decision |
| E | Dashboard: club home screen first | Medium | One decision |

---

## A. Step 4: club domains

**Goal:** each club's site works on its own address (e.g. `www.heathcotegolf.co.uk`), and the `/preview/<club>` addresses stay on staging only.

### Decisions needed before we start tonight

1. **The platform's own domain.** Several things need one:
   - a fallback address for each club (e.g. `heathcote.<platform domain>`) while the club's own domain is being connected
   - the photo address (`media.<platform domain>`, which decisions.md requires for production)
   - the email sending address

   The platform name is still a placeholder. Options:
   - **(a)** buy the real domain once you've chosen the name. Best, if the name is close.
   - **(b)** buy a cheap neutral working domain now, and swap it later. Swapping means re-pointing a few records.
   - **(c)** build tonight against a test domain and connect real domains later. The code doesn't depend on which domain we use.

   *Recommendation:* **(c) tonight**, then (a) as soon as the name is chosen. Nothing tonight needs money.
2. **Cloudflare in front of club sites, or not.** Doc 04 puts Cloudflare (caching, firewall) in front of every club site. Vercel's own guidance says it doesn't recommend a reverse proxy like Cloudflare in front of Vercel: it adds a delay, makes caching harder, and causes certificate and "invalid configuration" problems. Since doc 04 was written, Vercel Pro also includes a firewall (WAF) and rate limiting.
   - *Recommendation:* club sites point **straight at Vercel**, and we use Vercel's firewall for rate limits. Cloudflare stays for:
     - the platform's own DNS
     - photos (R2 behind `media.<platform domain>`)
     - backups
     - the contact form's spam check (Turnstile)

     This changes a decided item in doc 04 / CLAUDE.md ("CDN / WAF / DNS: Cloudflare"), so **it's your call**. Worth a word with your devops friend.

### What gets built

1. **Each club gets a list of web addresses**, on the club record (super-admin only): the main address plus extra ones such as the version without `www`. Each address can belong to only one club, enforced by the database. The extra addresses redirect to the main one.
2. **Finding the club from the address.** Every visitor request looks up the club by the address it came in on. An unknown address gets a plain "site not found" page that names no club. The club comes only from the address, never from anything the visitor sends.
3. **Clean page addresses.** On a club's own domain, pages are `/membership`, not `/preview/heathcote/membership`. The code already has one switch for this (`siteBase` in `src/site/preview.ts`). Links, search, the 404 page, live preview and the contact form all follow it.
4. **Staging keeps `/preview/<club>`** behind the Vercel login, so nothing about how you test changes.
5. **Search-engine basics for each club:**
   - the correct "this is the real address" tag on every page
   - `robots.txt` and `sitemap.xml` for each club
   - share images
   - "index, follow" on live club domains only, and never on staging (the privacy decision of 15 October)
6. **Isolation tests:** a request on club A's address can never show club B's pages, news, search results, photos or 404 links. An unknown address shows no club at all. These join the merge-blocking suite.
7. **Connecting a club's domain.** For the first clubs this is a short checklist in a new runbook, `docs/operations/connect-club-domain.md`:
   - add the address in Vercel → Domains
   - the club (or whoever runs their domain) adds the one record Vercel shows (an A record or a CNAME)
   - add the address to the club record

   Doing this automatically through Vercel's API can come later. That needs a Vercel access token stored as a secret, so it's a later decision.

### What Dan does (one checklist, after the code is merged)

- Vercel → Domains: add the test domain, or later the platform domain, as shown in the runbook.
- Cloudflare → R2: connect `media.<platform domain>` to the production photo bucket. This needs the platform domain.
- Neon: upgrade to Launch, then turn on 7-day history, daily snapshots and branch protection on production. This was agreed for before any club data goes in. Expect about £5–£20 a month.

### Not in step 4

Automatic domain setup through Vercel's API. A club changing its own domain from its dashboard. The per-club Cloudflare rate-limiting rule from 19 October; Vercel's firewall does that job if decision 2 goes that way.

---

## B. Step 6: error alerts and uptime monitoring (advice)

Both have free plans that fit us. I checked the main limits on 2026-10-20, but some sources disagree, so I'll confirm on the sign-up pages before you create anything.

- **Error alerts: Sentry** (already decided). The free "Developer" plan covers one user and about 5,000 errors a month, which is plenty for a few clubs.
  - Choose **EU data storage** when the account is created. It can't be changed later. I'll confirm the free plan offers it.
  - What I build: `@sentry/nextjs`, set to strip personal details (no form contents, no email addresses, no IP addresses), with an email alert on any new error.
  - Sentry gets added to the data processing agreement's supplier list and to the privacy policy. That changes the agreement's version, so clubs are asked to accept again.
  - New dependency: `@sentry/nextjs` (official).
- **Uptime: Better Stack free plan.** About 10 monitors, checking every 3 minutes, with email alerts. It runs outside our app, so it still tells you if everything is down.
  - Monitors: production `/health`, staging `/health`, and each club's home page as clubs go live.
  - *Why not UptimeRobot:* its free plan was limited to non-commercial use from late 2024. One source says that was reversed in 2026, but I couldn't confirm it.
- **What you'd do:** sign up for both (two sign-ups, no card needed), then paste two values into Vercel: the Sentry project key, and the Better Stack alert email if wanted. I'll give you one checklist.

---

## C. Editor invitations by email

**Today:** the super-admin presses "Invite editor", copies a "set your password" link (valid 72 hours) and sends it themselves.

**Change:**
1. When email is set up, "Invite editor" also **emails the link** to the new editor. The email says which club it's for, that the link works for 72 hours, and that they'll set up two-factor login with an authenticator app.
2. The copy-the-link box stays as a fallback, in case the email goes to spam.
3. "Make a new link" on an existing editor can email it too.
4. **The link is always built from `ADMIN_URL`**, like password reset. Today invite links use the address the request came in on; using `ADMIN_URL` closes that gap.
5. Staging and previews keep sending every email to the one override address, never to real people.
6. At most one invite email per account every 15 minutes, sharing Resend's free 100 a day with contact alerts and password resets.
7. Tests: the email is sent with the right link and club; nothing is sent without email set up; the link never uses the request's address; an editor of club A can't trigger anything.

**Needs Dan:** only `ADMIN_URL` on staging (already on your list). **New dependencies:** none. **Migration:** none.

---

## D. Keep the privacy policy's promises

The policy says enquiries are kept for **"12 months after our last reply"**, but nothing deletes them. The 11 October decision also left uploads that fail the content check sitting in storage.

**Change:**
1. **Enquiries record when they were handled.** A new "handled on" date is set by the server when an editor marks one handled. Old enquiries already marked handled get the date they were last changed. This migration fills in data, so it gets a careful review and the migration guard will flag it for you.
2. **A nightly clean-up job** (Payload Jobs Queue, started by a Vercel daily schedule, which Pro includes) permanently deletes enquiries 12 months after they were handled.
3. **Decision for Dan:** what happens to enquiries **never marked handled**?
   - **(a)** delete them 12 months after they arrived. *Recommended:* nothing kept forever by accident.
   - **(b)** keep them until handled.

   The policy wording changes to match.
4. **The same job removes uploads that failed the content check** and are older than a day, with no record pointing at them.
5. **Backups:** deleted enquiries stay in encrypted backups for up to 30 days. The policy gets one line saying so.
6. Each club's job only ever touches that club's records. Tests cover the 12-month rule, both clubs, and that a handled enquiry 11 months old is kept.

**Migration:** adds one column and fills it in for old enquiries (reviewed, data-preserving). **New dependencies:** none.

---

## E. Dashboard: what we can do now

From your 20 October review. These are in order of value to a club secretary.

1. **Club home screen** (the first screen after sign-in):
   - **Setup checklist** built from the club's real data: logo and colours done, footer contact details, menu, home page published, agreement accepted, course status set. Each item links to the right screen. It disappears once everything is ticked.
   - **New enquiries:** the latest 5, with a link to the full list.
   - **Quick actions:** add a news story, add an event, update course status, edit the home page.
   - **Course status at a glance**, with "not updated today" when it's stale.
   - The super-admin sees the same screen for the club picked in the club selector, plus a list of clubs with their setup progress.
2. **Club Settings preview.** **Decision for Dan:** refresh-on-save (simple: the preview reloads the home page after each save) or drafts (changes stay private until published, which is more work and a bigger change). *Recommended:* refresh-on-save now.
3. **Page tree view:** pages shown under their parent pages, so the site's shape is visible at a glance.
4. **News and Events preview:** the same side-by-side preview that pages have.

Start with 1. Parts 2–4 each follow as their own PR.

---

Sources checked for A and B (2026-10-20): Vercel docs ([custom domains](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [multi-tenant limits](https://vercel.com/docs/platforms/multi-tenant-platforms/limits), [proxies in front of Vercel](https://vercel.com/kb/guide/can-i-use-a-proxy-on-top-of-my-vercel-deployment)); third-party summaries of Sentry, Better Stack and UptimeRobot free plans, to confirm on each sign-up page.
