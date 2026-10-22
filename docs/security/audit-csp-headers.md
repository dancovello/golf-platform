# Security audit: content security policy and headers

**Date:** 22 October 2026
**Code reviewed:** commit `b45c7cf` (top of the stacked PRs #145–#155, branch `docs/pentest-scope-review-list`)
**Reviewer:** Claude Code, acting as an application security reviewer new to this codebase (job 8 of the security programme)
**Area:** the content security policy (the rules telling browsers which scripts, pictures and frames a page may use), the other security headers, the report address, and every place a page shows text, links or embeds that a visitor or club editor supplied.

## Summary

Nothing critical or high. The club websites themselves are in good shape: editors can't get a script onto a public page, and the enforced policy would stop one if they did.

The main weakness is **where club previews live, not what the policy says**. Club previews (`/preview/<club>`, including the live preview inside the admin) are served from the **same web address as the admin**. Browsers treat everything on one address as one website. So any script that runs on a club's preview page runs with the full admin access of whoever is looking at it. When that is Dan, that means every club. Today the only script from outside that reaches a preview is Google Analytics, and its ID is chosen by the club's editor.

| # | Finding | Severity |
|---|---|---|
| 1 | Club previews share the admin's web address, and load Google Analytics there | **Medium** |
| 2 | The admin's policy reports problems but blocks nothing | **Medium** |
| 3 | A few platform pages outside `/admin` and `/preview` have no script rules | Low |
| 4 | The report address writes whatever a sender sends into the server log | Low |
| 5 | No Cross-Origin-Opener-Policy header on the admin | Low |

Each finding has a test that fails today and proves it. The tests are marked so they don't block CI (`it.fails` / `test.fail`): `tests/e2e/audit-csp-headers.spec.ts` and `tests/unit/csp-report.spec.ts`. When a fix lands, its test starts passing, the marker makes it show as failing, and the marker should then be removed.

**No fixes are made in this branch.** Each finding below includes a proposed fix for Dan to approve.

## Files read

- `src/security/csp.ts`: builds the policy
- `src/proxy.ts`: picks the policy for each address and makes the per-view one-time code (nonce)
- `next.config.ts`: the headers on every response
- `src/site/components/InlineScript.tsx`, `src/site/components/headerFit.ts`, `src/site/components/SiteHeader.tsx`: the one inline script
- `src/app/(frontend)/csp-report/route.ts`: the report address
- `src/site/blocks/RichTextContent.tsx`, `src/blocks/richText/lexical.ts`, `src/fields/link.ts`, `src/site/components/links.ts`, `src/site/loadClub.ts`: rich text and links
- `src/site/blocks/Faq.tsx`: the only other raw-HTML spot (search-engine data)
- `src/site/blocks/MapFrame.tsx`, `src/site/privacy/CookieConsent.tsx`, `src/site/privacy/policy.ts`: the map frame and Google Analytics
- `src/site/ClubShell.tsx`, `src/theme/colour.ts`, `src/site/blocks/LogoStrip.tsx`: club colours and styles
- `src/site/resolveSite.ts`, `src/site/livePreview.ts`, `src/app/(frontend)/preview/[club]/*`: previews
- `src/admin/*.tsx`: links built in the admin's own screens
- `src/payload.config.ts`: where uploaded files are served from
- Existing tests: `tests/unit/csp.spec.ts`, `tests/e2e/security-policy.spec.ts`, `tests/e2e/security-headers.spec.ts`
- Background: `docs/operations/security-checks.md` (the checklist), `docs/architecture/decisions.md`, `docs/security/pentest-scope.md`

## Findings

### 1. Club previews share the admin's web address, and load Google Analytics there (Medium)

**What's wrong.** `/preview/<club>` pages are served from the platform's own address, the same one as `/admin` and `/api` (`src/proxy.ts:151-161`; `src/site/livePreview.ts:15-19` builds the live preview from the admin's own address). A browser treats all of them as one website. A script running on a preview page can call the admin's API as the person viewing it, with their sign-in.

The enforced policy on preview pages (`src/proxy.ts:154-155`) is the only thing stopping that. It does stop editors' own content: I found no way for an editor to get their own script onto a page (see "Checked and fine"). But it deliberately lets Google Analytics in, and, through `'strict-dynamic'` (`src/security/csp.ts:77`), anything Google's script loads in turn. The cookie banner is drawn on preview pages too (`src/site/ClubShell.tsx:68-70`), and the analytics ID comes from the club's own settings (`src/site/privacy/CookieConsent.tsx:41-56`).

**How an attacker would use it.** Club A's editor puts a Google Analytics ID they control into Club A's settings. Dan opens Club A's live preview in the admin (he can see every club's preview) and accepts analytics cookies once in the banner. That choice is remembered. From then on, Google's script runs on the admin's address every time Dan previews Club A. What that script does is decided by Google and by the settings on the editor's Google account, not by us. Whatever it does, it has Dan's admin access: it could read or change any club's data. The same applies to any future slip in the preview policy: one slip on a preview page reaches the admin.

Severity is **medium**, not high, because it needs Dan to accept the cookie banner on a preview, and because Google's script isn't known to let a property owner run their own code. It is still the one route found from one club's settings to all clubs' data.

**Proof.** `tests/e2e/audit-csp-headers.spec.ts`:
- "a script on a club preview cannot use the super-admin's access": signed in as the super-admin, a script on `/preview/test-club-a` lists every club through the API.
- "Google Analytics never loads on the admin's own address": accepting cookies on `/preview/test-club-cookies` adds Google's script.

**Proposed fix (two steps, smallest first):**
1. **Now (small):** don't draw the cookie banner or load Google Analytics on preview pages (`base !== ''` in `ClubShell`). Previews aren't real visits, so nothing is lost. The existing test "Google Analytics may load once the visitor accepts cookies" would move to the club's own test domain (`club-cookies.localhost`).
2. **Later (medium, needs Dan's decision):** serve previews from their own address (for example `preview.<platform domain>`), with drafts unlocked by a short-lived signed link rather than the admin's sign-in. This removes the shared address altogether. It touches live preview, so it should be its own planned change.

### 2. The admin's policy reports problems but blocks nothing (Medium)

**What's wrong.** `ADMIN_ENFORCED = false` (`src/security/csp.ts:20`), so the admin gets `Content-Security-Policy-Report-Only` (`src/security/csp.ts:128-131`). Browsers report scripts that break the rules but still run them. The basic policy in `next.config.ts:19-21` is enforced on the admin, but it only covers framing, `<base>` and plugins, not scripts.

**How an attacker would use it.** This isn't a way in on its own: I found no place in our own admin screens that puts editor text into the page unescaped. But the admin is where one account (Dan's) reaches every club. It runs Payload, its plugins (including the two-factor plugin) and our own screens. If any of them ever puts editor-supplied text into the page as code, nothing stops the script running. With the policy enforced, that slip would be blocked and reported instead. Together with finding 1, a preview page and the admin are one website, so the admin's protection matters for previews too.

This was a deliberate decision (21 October, review due 28 October). This finding doesn't reopen it. It records that the risk is real until the switch is made.

**Proof.** `tests/e2e/audit-csp-headers.spec.ts`: "the admin's policy is enforced".

**Proposed fix (one line):** on or after 28 October, if the week's reports are clean, set `ADMIN_ENFORCED = true` and update the existing test "the admin is report-only for now". Don't let the date slip without a decision.

### 3. A few platform pages outside `/admin` and `/preview` have no script rules (Low)

**What's wrong.** On the platform's own address, only `/admin…`, `/preview…`, `/admin/create-first-user` and the marketing pages get the full policy (`src/proxy.ts:139-161`). Everything else in `PLATFORM_PATHS` (`src/proxy.ts:26-27`) gets just the basic policy from `next.config.ts:19-21`, which says nothing about scripts. That includes `/accounts-by-administrator`, a full page with its own scripts, and Next.js's error pages under `/api` and `/health`.

**How an attacker would use it.** None of these pages shows editor or visitor text today, so there's nothing to attack yet. But they share the admin's address. If one of them ever shows something from the address bar or the database, there's no policy behind it.

**Proof.** `tests/e2e/audit-csp-headers.spec.ts`: "the 'accounts are made by the administrator' page has a script policy".

**Proposed fix (small):** give every remaining path on the platform's address the admin policy by default (`kind = 'admin'` in place of `null` at `src/proxy.ts:154-159`), or at minimum add `script-src 'none'` to the basic policy for `/api`, `/health` and `/cron`, which never need scripts.

### 4. The report address writes whatever a sender sends into the server log (Low)

**What's wrong.** `/csp-report` accepts posts from anyone (`src/app/(frontend)/csp-report/route.ts:52-81`). The `directive` value is copied into the log line whole (line 70-72), and `blocked` keeps up to 40 characters including line breaks (line 31). The rate limit is one shared allowance of 60 reports a minute for everyone (line 54, `visitor: 'all'`).

**How an attacker would use it.**
- **Fake log lines.** A report containing a line break writes a second, made-up line into the log (for example a fake "blocked … on /admin"). That could mislead whoever reads the logs during the "clean week" before the admin is enforced.
- **Drowning out real reports.** Anyone can send 60 junk reports a minute and use up the shared allowance, so real reports are thrown away. That makes the admin look cleaner than it is, or noisier than it is, while Dan is deciding on finding 2.

**Proof.** `tests/unit/csp-report.spec.ts`: "a sender cannot add fake lines to the server log" and "what a sender writes is kept short".

**Proposed fix (small):** strip line breaks and other control characters from every logged value, cap `directive` at about 60 characters, and accept only known directive names. Also judge the clean week on the reports from Dan's own browser (the `securitypolicyviolation` test already does this in CI), not only the log.

### 5. No Cross-Origin-Opener-Policy header on the admin (Low)

**What's wrong.** `next.config.ts:17-32` sets no `Cross-Origin-Opener-Policy`. Without `same-origin`, a website that opens the admin in a new window keeps a handle on that window.

**How an attacker would use it.** A page Dan visits opens the admin login in a new tab and later quietly swaps it for a look-alike login page ("your session has expired"), or counts the frames on admin pages to learn things about them. It needs Dan to visit the attacker's page first, so it's low.

**Proof.** `tests/e2e/audit-csp-headers.spec.ts`: "the admin cuts its ties to the window that opened it".

**Proposed fix (small):** add `Cross-Origin-Opener-Policy: same-origin` to the admin's responses. Check first that payload-totp and the live preview don't rely on `window.opener` (live preview uses a frame, not a pop-up, so it should be fine).

## Checked and fine

- **The one-time code (nonce).** 16 random bytes from the system's secure generator, new on every page view (`src/security/csp.ts:121-125`). A visitor can't choose it: the proxy deletes any `x-nonce` or policy header they send (`src/proxy.ts:87-91`), and the existing test proves it. Club pages are rendered fresh on every view (`force-dynamic`), so a code isn't reused from a cached page.
- **Script rules on club sites.** `'nonce-…' 'strict-dynamic'`, no `'unsafe-inline'`, no `'unsafe-eval'` outside development, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'self'`. Because there's no `'unsafe-inline'`, a `javascript:` link would be blocked even if one got through.
- **The inline script.** `InlineScript` is used only for the header-fit script, built from our own function's source and a fixed ID (`src/site/components/headerFit.ts:39-40`). No club data goes into it.
- **FAQ search-engine data.** It's the only other raw HTML. It's JSON with every `<` escaped, so no answer can close the script tag (`src/site/blocks/Faq.tsx:13-22`).
- **Rich text.** It's drawn element by element with React, never inserted as HTML. Only paragraphs, H2/H3, lists, quotes, links and the club's own photos are drawn; anything else is skipped (`src/site/blocks/RichTextContent.tsx`).
- **Links.** Only `https://`, `http://`, `mailto:`, `tel:` and single-`/` addresses are allowed. This is checked when saved (`src/fields/link.ts:10`, `src/blocks/richText/lexical.ts:20-35`) **and again when drawn** (`src/site/loadClub.ts:252`, `RichTextContent.tsx:104`). `//evil.com` and `/\evil.com` are refused. External links get `rel="noopener noreferrer"`.
- **Map.** It's a fixed OpenStreetMap address in a frame, loaded only on click, with `no-referrer`.
- **Google Analytics ID.** It's checked against `G-` plus 4–15 letters/digits and URL-encoded (`src/site/privacy/policy.ts:66-70`, `CookieConsent.tsx:55`). It can't break out into code. (The risk in finding 1 is where it runs, not how it's written.)
- **Club colours and fonts.** Colours must be `#rrggbb` (`src/theme/colour.ts:33`) and fonts come from a fixed list. They're set through React's style object, which can't add new HTML.
- **Clickjacking.** `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN` are on every response. On a club's own domain, `/admin` and `/api` don't exist (`src/proxy.ts:113`).
- **Uploaded files.** They're served from the separate photo-storage address (`src/payload.config.ts:132-151`, `disablePayloadAccessControl: true`), not from the admin's address. So an uploaded file can't run as the admin. (File-type checks are covered by the uploads audit.)
- **Two `Content-Security-Policy` headers on club pages** (the basic one from `next.config.ts` and the full one from the proxy). Browsers apply both, and the stricter result wins, so this is safe.
- **Other headers.** `Strict-Transport-Security` (two years; no `includeSubDomains`, which is deliberate), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and no `X-Powered-By`.
- **GraphQL** is switched off (`src/payload.config.ts:78-80`), so there's no GraphQL playground page to worry about.

## Not checked

- **Cloudflare cache rules.** If Cloudflare were set to cache club HTML pages ("cache everything"), every visitor would get the same one-time code, which weakens the policy. The code sends dynamic pages, but I couldn't see the live Cloudflare settings. Worth a look by Dan or the pen tester.
- **Payload's own admin screens and plugins**, beyond our custom components. Finding 2 covers the risk in general.
- **Staging and production headers.** Only the code and the local build were checked. No traffic was sent to live sites.
- **Older browsers** that don't understand `'strict-dynamic'`. They fall back to the listed domains. Not tested.

## Test results

Run locally on 22 October 2026 against a production build (`corepack pnpm build`) and the local test database:

- `corepack pnpm exec playwright test --project=chromium tests/e2e/audit-csp-headers.spec.ts tests/e2e/security-policy.spec.ts tests/e2e/security-headers.spec.ts`: **19 passed**. That includes the 5 new tests, which "pass" because they fail as expected.
- The same 5 tests with the `test.fail` markers removed, to check they fail for the right reason. They all failed on their own assertions:
  1. A script on Club A's preview, signed in as the super-admin, listed **7 clubs** (expected 0).
  2. Google's script was on the page after accepting cookies (1, expected 0).
  3. The admin's enforced policy was only `frame-ancestors 'self'; base-uri 'self'; object-src 'none'`.
  4. Same basic policy on `/accounts-by-administrator`.
  5. No `Cross-Origin-Opener-Policy` header.
- `corepack pnpm exec vitest run tests/unit`: 24 files, **167 passed, 2 expected failures** (the new report-address tests). With the markers removed, both failed on their assertions: the log line contained the sender's line break, and was 5,038 characters long.
- `corepack pnpm typecheck` ✅, ESLint and Prettier on the new test files ✅.
- Not run: the full `corepack pnpm test` integration suite and the full browser suite. Nothing outside the tests and this report changed.

## Next step

No fix pull requests are open yet. CLAUDE.md asks for a plan and Dan's approval first, and each PR costs CI minutes. Suggested order once approved: finding 1 step 1 (no analytics on previews), then 4, 3 and 5 together (one small headers PR), then finding 2 on 28 October. Finding 1 step 2 (separate preview address) needs its own plan.
