# Security audit: public forms

- **Date:** 22 October 2026
- **Commit reviewed:** `b45c7cf` (top of the stacked PRs #145–#155, branch `docs/pentest-scope-review-list`)
- **Reviewer:** Claude Code, acting as an outside application security reviewer (job 8 of the security programme)
- **Scope:** the club Contact form (`src/site/contact/`, `src/collections/Enquiries.ts`) and the marketing site's homepage/demo request form
- **Method:** the "public forms" items of `docs/operations/security-checks.md`, with the infosec-review method (evidence, file and line for each finding). I read the code first and the tests second, then wrote a test for each finding.

## Summary

**Nothing critical or high.** One club can't see, change or send messages into another club's enquiries through the form, and visitors can't inject anything into the club's emails. The weak spots are all about **availability**: making a club's form, or the platform's emails, stop working for a while.

| # | Finding | Severity |
|---|---|---|
| 1 | One visitor can use up a club's whole hourly allowance and block its Contact form | Medium |
| 2 | One club's messages can use up the email allowance for every club, including password resets | Medium |
| 3 | The per-club hourly limit can be overshot by sending many messages at once | Low |
| 4 | Some email addresses pass the form but crash on save, so the visitor's message is lost | Low |

**Marketing site request form:** not built yet. `src/marketing` has "Book a demo" buttons linking to `/book-a-demo`, but there is no page, form, server action or `homepageRequests`/`demoRequests` collection behind them. Phase 2 of `docs/plans/marketing-site-plan.md` plans those collections. **That form needs its own review when it's built**, and findings 1, 2 and 4 apply to it too.

Each finding has a test in `tests/int/audit-public-forms.int.spec.ts`. The tests are marked `it.fails`: they describe what should happen and fail today, which proves the problem without blocking CI. When a fix lands, its test starts passing and Vitest flags it, so the fix's pull request changes `it.fails` to `it`.

## Files read

- `src/site/contact/`: `actions.ts`, `submit.ts`, `validate.ts`, `formToken.ts`, `turnstile.ts`, `alert.ts`, `load.ts`, `reference.ts`, `state.ts`, `ContactPage.tsx`, `ContactForm.tsx` (rendering of the form and results)
- `src/collections/Enquiries.ts`, `src/collections/enquiryPurposes.ts`
- `src/proxy.ts`, `src/site/resolveSite.ts`, `src/site/preview.ts`, `src/site/cache.ts` (how the club is chosen for a request)
- `src/security/rateLimit.ts`, `src/security/rateLimitInventory.ts`, `docs/operations/rate-limits.md`
- `src/email/adapter.ts`, `@payloadcms/email-resend` (how addresses reach Resend), Payload's email field check
- `src/tenancy.ts`, `src/security/isolation-manifest.ts`, `src/privacy/cleanUp.ts`, `src/site/privacy/policy.ts`
- `docs/architecture/decisions.md` (contact form, Turnstile, Resend, marketing site), `docs/plans/marketing-site-plan.md`
- Next.js's server action handling (`node_modules/next/dist/server/app-render/action-handler.js`, `manifests-singleton.js`)
- Existing tests: `tests/int/contact.int.spec.ts`, `tests/unit/contact.spec.ts`, `tests/e2e/site-contact.spec.ts`, `tests/e2e/site-domains.spec.ts`

## Findings

### 1. One visitor can use up a club's whole hourly allowance (medium)

**What's wrong.** Each club takes at most 20 messages an hour (`src/site/contact/submit.ts:24`, checked at `:128–138`). That protects the club's inbox, but the app has no limit **per visitor**. The only per-visitor limit is Vercel Firewall rule 3 (`docs/operations/rate-limits.md`, table row 3), which matches POSTs whose address **ends with `/contact`**.

The Send button is a Next.js server action. Next.js runs a server action from whatever page address it's posted to: it's identified by a header, not by the address, and Next.js passes it to the right page if needed (`selectWorkerForForwarding`). So posting the same request to `/`, `/news` or any other page on the club's domain skips rule 3.

The form's time token also stays valid for 24 hours and is kept after each successful check (`submit.ts:112`, `formToken.ts:10`), so a script waits the 3 seconds once and then reuses it.

**How an attacker would use it.** They load the club's Contact page once, then send 20 messages to the club's home page address, with each one passing Cloudflare's check (solving services sell these cheaply). For the rest of the hour every real visitor gets "We're receiving a lot of messages right now". Repeat every hour and the club's Contact form is effectively off, and the club's inbox fills with junk. It only affects the club being targeted. On production, Turnstile makes this cost money and effort, which is why it's medium rather than high.

**Where.** `src/site/contact/submit.ts:24,128–138`; `src/site/contact/actions.ts:18–37` (no per-visitor check); `docs/operations/rate-limits.md` rule 3.

**Proof.** Test "a second visitor can still send after one visitor has sent many in a row": one visitor sends 20 messages reusing one token, then a different visitor is refused.

**Suggested fix (needs your approval).** Add a per-visitor limit inside the app, using the shared rate-limit table that search already uses (`allowRequest` and `visitorKey` in `src/security/rateLimit.ts`): for example 5 messages per 10 minutes per visitor, checked in `actions.ts` before anything is saved. Visitors stay stored only as a daily-changing hash, as now. Add it to `rateLimitInventory.ts`. Optionally widen Firewall rule 3 to match the `Next-Action` header instead of the path. Small.

### 2. One club's messages can use up every club's email allowance (medium)

**What's wrong.** Each saved message emails the club (`src/site/contact/alert.ts:91`). The platform's Resend plan sends 100 emails a day for **everything together**: every club's Contact alerts and every editor's password-reset and invitation emails (`docs/architecture/decisions.md`, "Resend, not Postmark" and the 15-minute email limit). One club's form can create up to 480 alerts a day (20 an hour), and nothing caps alerts per club per day.

**How an attacker would use it.** They send about 100 messages to any one club's form over a few hours (finding 1 makes this easy). Resend then refuses every email for the rest of the day. Other clubs stop getting alerts about real enquiries (the messages are still saved in the admin, but nobody is told), and editors at every club can't reset passwords. **This is the one place in this area where one club affects others.**

**Where.** `src/site/contact/alert.ts:23–110` (no daily cap); `src/site/contact/submit.ts:24` (480 a day per club).

**Proof.** Test "stops emailing one club before it has used a quarter of the daily allowance": 26 messages at one club send 26 emails.

**Suggested fix (needs your approval).** Two parts, both small:
- A daily cap on alerts per club (for example 25), counted in the shared rate-limit table. Past the cap the message is still saved and shows in the admin, with "Emailed to the club" left blank, as when sending fails today. Optionally send one "you have more messages waiting" email.
- Put password-reset and invitation emails first: keep a share of the daily allowance free for them, or move up to Resend's paid plan before the first real club (about $20 a month; this is your decision, so it's listed as an open question below).

### 3. The per-club hourly limit can be overshot (low)

**What's wrong.** `submit.ts` counts the last hour's messages (`:128`) and then saves the new one (`:145`) as two separate steps. Messages arriving at the same moment all see room for one more.

**How an attacker would use it.** By firing many sends at once they get more than 20 into a club in an hour. In the test, 35 sent at once were all saved. It makes findings 1 and 2 worse, but each send still needs its own Turnstile pass, so in practice the extra is small.

**Where.** `src/site/contact/submit.ts:128–145`.

**Proof.** Test "never saves more than 20 in an hour, even when sent all at once".

**Suggested fix (needs your approval).** Count with the shared table's one-step "add one and return the new count" (`allowRequest` with a per-club key, `src/security/rateLimit.ts:71`) instead of counting saved rows. Small.

### 4. Some email addresses pass the form but crash on save (low)

**What's wrong.** The form checks the email address with its own rule (`src/site/contact/validate.ts:59`), which is looser than Payload's rule on the Enquiries email field. An address like `josé@example.com`, `a_b@sub_d.example.com` or `a,b@example.com` passes the form's check and Cloudflare's, then the save throws a validation error. The visitor sees an error page instead of "check your email address", and their message is lost.

**How an attacker would use it.** There's little to gain, so this is mostly a reliability bug. It matters for security in one way: Payload's stricter rule is what stops addresses containing commas or angle brackets from reaching the club email's Reply-To (`alert.ts:94`), where they could add extra reply addresses. That protection works today, but by accident. The fix should make the form's own rule at least as strict, so it no longer depends on that.

**Where.** `src/site/contact/validate.ts:59,83–87`; `src/collections/Enquiries.ts` (`email` field).

**Proof.** Test "shows a field error, not an error page, for an address it cannot save".

**Suggested fix (needs your approval).** Use the same rule as Payload in `validate.ts` (or call Payload's own email check), so these addresses get the normal "Enter an email address like name@example.com" message. Add a unit test listing addresses with commas, angle brackets, quotes and line breaks. Small.

## Checked and fine

- **Messages can't be sent into another club.** On a club's domain the club comes only from the address the visitor used (`actions.ts:23–28`). The proxy deletes any `x-club-host` header a visitor sends and sets its own (`src/proxy.ts:85,116`). The club name in the form is ignored there. New tests confirm this: a form edited to name club B, sent on club A's domain, saves into club A, and club B's form token is refused on club A's domain (`formToken.ts:33`).
- **The staging preview** does take the club from the page (`actions.ts:30`), so anyone who can open staging could post a message to any test club. That's by design (`decisions.md`, club domains), it's behind the Vercel login, and it's switched off on production (`src/site/preview.ts`).
- **Emails reach the right club.** The alert reads the club from the saved enquiry and the inbox from that club's own settings (`alert.ts:41–62`). The visitor can't choose the recipient.
- **No email header injection.** The subject and sender name strip line breaks and angle brackets (`alert.ts:12–17`); the existing test sends `Dan\r\nBcc: …` and checks it. The body is plain text only, so nothing the visitor types becomes a link or markup (mail apps may still make a typed web address clickable; that's normal for any contact form). Reply-To: see finding 4.
- **Reading enquiries.** Visitors can't read them, nobody can create them through the admin or API (`Enquiries.ts:38`), and what the visitor sent can't be edited. Enquiries are club-owned in `src/tenancy.ts` and covered by the isolation suite and the admin isolation test (`isolation-manifest.ts:52`). The separate tenancy audit covers the plugin itself in depth.
- **Stored content is shown safely.** The success screen and admin show visitor text as text (React and Payload escape it). Reference numbers are random and checked for clashes within the club only.
- **Turnstile** must be on in production (`turnstile.ts:24–29`), test keys are refused on production, and the check must be for this form (`:52`). It doesn't check `hostname`; Cloudflare's widget domain list does that instead. Make sure that list holds only the platform's and clubs' domains (see open questions).
- **Personal data.** Stored: name, email, optional phone, the topic's optional fields (membership type, date, group size), the message, and a newsletter tick. No IP address, browser details or Turnstile data are stored. Retention matches the privacy policy (`src/site/privacy/policy.ts:18`, `src/privacy/cleanUp.ts:37–72`): 12 months after being marked handled, or after arriving if never handled. Fields a topic doesn't show are never saved.

## Not checked

- **Vercel Firewall settings and Cloudflare's Turnstile domain list.** These are in dashboards I can't see. Please confirm rule 3 exists and the Turnstile widget's domain list is limited to our addresses.
- **Load testing against staging or production.** Not allowed in this audit; the findings were proven against the local database only.
- **The marketing request form** (not built).

## Tests and checks run

- `tests/int/audit-public-forms.int.spec.ts`: 2 passed (club separation), 4 expected failures (findings 1–4). Before marking them `it.fails`, I ran each as a normal test to confirm it fails for the stated reason, not some other error.
- `corepack pnpm typecheck`: passed. ESLint and Prettier on the new test file: passed.
- `corepack pnpm test` (full suite, on its own local database `golf_test_forms` so it didn't collide with the other audit sessions): 59 files, 598 passed, 4 expected failures, none failed.

## Open questions for Dan

1. **Resend's free plan (100 emails a day) is shared by every club.** Do you want to move to the paid plan before the first real club, or keep a daily cap per club (finding 2)? Both are sensible; the cap is needed either way.
2. **Fix order.** I'd suggest findings 1 and 2 together in one small PR (both use the shared rate-limit table), then 3 and 4.
