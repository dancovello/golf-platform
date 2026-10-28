# Rate limits

**Updated:** 22 October 2026 (job 4 from the 21 Oct grilling) · **Source of truth:** `src/security/rateLimitInventory.ts`

Every public endpoint has a limit, at two layers (doc 04 §8): **the app** and **the edge** (Vercel Firewall). Club sites point straight at Vercel, not through Cloudflare (decided 20 Oct), so the edge layer is Vercel's firewall.

## What changed on 22 Oct

- **Search and the security-report address used to count in each server's memory.** With more than one Vercel server running, the real limit was the limit times the number of servers. They now count in one database table every server shares (`rate_limits`, `src/security/rateLimit.ts`), so a limit is a limit.
- **IPv6 visitors count by network (added 23 Oct).** An IPv6 connection gets a whole /64 network, so every limit counts its first 64 bits, not each address.
- **No IP addresses are stored.** A visitor is a keyed hash of their address and the date, which changes every day and can't be turned back into an address. The nightly clean-up deletes counts older than a day.
- **`TRUSTED_PROXY` stays unset.** It's only for a Cloudflare proxy in front of the site, which we don't have. A test proves a made-up `cf-connecting-ip` is ignored.

## Every endpoint and its limit

**Search** (club domain and staging preview: `/search`, `/search/suggest`)
- 120 a minute per visitor, results page and panel together.
- Enforced in the app (shared database) and by Vercel Firewall rule 1.
- At the limit, the panel gets a 429 ("busy") and the results page asks the visitor to wait.

**Contact form** (server action, `src/site/contact/actions.ts`)
- 5 sends per visitor in 10 minutes (added 23 Oct). Checked in the app, because the form's send works from any page address, so Firewall rule 3 (paths ending `/contact`) alone can be got round.
- 20 messages an hour per club, counted in one step so a burst can't overshoot, plus a hidden spam trap, too-fast sends dropped, and Cloudflare Turnstile.
- Alert emails: at most 25 per club a day, within the website forms' shared 70 emails a day (with the Homepage Request Form), keeping 30 of Resend's 100 free daily emails for password resets and invitations. Past that, messages are saved but not emailed.
- Enforced in the app (shared database) and by Vercel Firewall rule 3.

**Homepage Request Form** (company website, server action, `src/marketing/requests/actions.ts`; added 24 Oct)
- The same protections as the Contact form: 5 sends per visitor in 10 minutes, checked in the app whatever page address it's posted to; 20 requests an hour from everyone together, counted in one step; hidden spam trap, too-fast sends dropped, Cloudflare Turnstile.
- Emails: at most 10 requests emailed a day (each is an alert to the company and a confirmation to the club), and every email counts towards the website forms' shared 70 a day. Past either, the request is saved but not emailed, so the form can't send strangers confirmations in bulk.
- Enforced in the app (shared database).

**Security-report address** (`/csp-report`)
- 60 reports a minute from everyone together. Extra reports are dropped quietly.
- Enforced in the app (shared database).

**Sign in** (`/api/users/login`)
- The account is locked for 10 minutes after 5 wrong passwords.
- Enforced by Payload (stored on the account, so shared) and by Vercel Firewall rule 2 per address.

**Two-factor code** (`/api/verify-totp`, `/api/setup-totp`, `/api/remove-totp`)
- Locked for 10 minutes after 5 wrong codes. `remove-totp` refuses while two-factor is required.
- Enforced by payload-totp (stored in the database) and by Vercel Firewall rule 2.

**Forgot password** (`/api/users/forgot-password`)
- One email per account every 15 minutes. Refused while email reset is off.
- Enforced by Payload and by Vercel Firewall rule 2.

**Password links** (`/api/users/reset-password`, `/api/users/unlock`)
- Need a valid one-time link.
- Enforced by Payload and by Vercel Firewall rule 2.

**Club pages, news, events, sitemaps, marketing pages**
- No per-page limit in the app.
- Vercel's built-in DDoS protection is always on; optional Vercel Firewall rule 4.

**`/health`, `robots.txt`, the "accounts by administrator" page**
- No limit: a small fixed response.
- Vercel's built-in DDoS protection.

**Nightly clean-up** (`/cron/clean-up`)
- Doesn't exist without Vercel's scheduler secret.
- Enforced by a code check.

**Upload links** (`POST /api/storage-s3-generate-signed-url`)
- 100 an hour per signed-in account (added 23 Oct, uploads audit finding 2). Past that: "Too many uploads, try again later."
- Enforced in the app (shared database).

**Admin screens, the API, other uploads, the job queue, demo club, starter pages, review pages**
- Need a signed-in account, and some need the super-admin.
- Enforced by Payload access rules and code checks.

`tests/int/rate-limit-inventory.int.spec.ts` fails if a route, endpoint or server action exists that isn't in the inventory.

## Vercel Firewall rules for Dan to add

**Checked 22 Oct on Vercel's docs** (vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting):
- Rate limiting is on every plan. Pro allows **40 rules per project**, a **fixed window of 10 seconds to 10 minutes**, counted **by IP address** (or JA4 fingerprint).
- Actions: 429 (default), Deny, Challenge or Log.
- **Cost:** every request a rate-limit rule checks is counted. Vercel's changelog says Pro includes the first 1,000,000 a month, then charges a regional rate. Check Vercel → Usage → Firewall after the first week.
- Counts are kept per Vercel region, so a visitor spread across regions could go a little over.

**Where:** Vercel dashboard → the project → **Firewall** → **Configure** → **+ New Rule**. For each rule, set **Then** to **Rate Limit**, the strategy to **Fixed Window** and the key to **IP**. Then **Review Changes** → **Publish**. Rules apply to production; add them to staging the same way if you want to try them first.

| # | Name | If (all must match) | Window | Limit | Action |
|---|---|---|---|---|---|
| 1 | Search | **Request Path** *contains* `/search` | 60 s | 150 | 429 (default) |
| 2 | Sign-in and codes | **Method** *equals* `POST`, and **Request Path** *is any of* `/api/users/login`, `/api/users/forgot-password`, `/api/users/reset-password`, `/api/users/unlock`, `/api/verify-totp`, `/api/setup-totp`, `/api/remove-totp` | 60 s | 10 | 429 (default) |
| 3 | Contact form | **Method** *equals* `POST`, and **Request Path** *ends with* `/contact` | 600 s (10 min) | 10 | 429 (default) |
| 4 *(optional)* | All pages | **Request Path** *starts with* `/` | 60 s | 600 | **Log** only |

**Why these numbers:**
- **Rule 1** sits just above the app's own limit (120), so a normal visitor always gets the app's friendly "busy" message first. A script ignoring it is stopped at the edge, before it costs a database query.
- **Rule 2:** 10 sign-in requests a minute from one address is more than any person needs. Payload's lockout protects each account; this protects against one address trying many accounts.
- **Rule 3:** the contact form posts to the page's own address (a Next.js server action). 10 sends in 10 minutes from one address is plenty for a person, and stops one sender using up a club's 20-an-hour allowance.
- **Rule 4** is **optional**, because every page view would count towards the included million. Add it as **Log** only if you want to see traffic patterns; switch it to 429 only if a club is being hammered.

Tell Claude if a rule's fields look different in the dashboard; Vercel changes its screens from time to time.
