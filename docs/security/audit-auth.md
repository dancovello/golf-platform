# Security audit: sign-in and two-factor

**Date:** 22 October 2026 · **Commit reviewed:** `b45c7cf` (top of the stacked PRs #145–#155, branch `docs/pentest-scope-review-list`) · **By:** Claude, as an outside application security reviewer seeing the code for the first time · **Job 8** of the security programme.

## Summary for Dan

**Nothing urgent.** I found no way for one club to see or change another club's data through sign-in, accounts or two-factor, and no way for a club editor to become a super-admin, move club, or for a super-admin to reach data without their code.

| Severity | Count | Findings |
|---|---|---|
| Critical | 0 | |
| High | 0 | |
| Medium | 1 | A1: an editor can change their own sign-in email, and nobody is told |
| Low | 4 | A2 password change doesn't ask for the old password · A3 two admin screens rely on someone else's check · A4 the lockout message reveals which emails have accounts · A5 Payload's cross-site check is off |

Each finding has a test that proves it (`tests/int/audit-auth.int.spec.ts`). The tests are marked `it.fails`, so they pass in CI today and **flip to failing when the fix lands**, which reminds whoever fixes it to change `it.fails` to `it`.

Fixes for A1 and A3 are in a separate **draft** PR for you to approve. A2, A4 and A5 need a decision from you first (see each one).

## What I read

- `src/auth/`: `fullyAuthenticated.ts`, `superAdminTwoFactor.ts`, `resetTwoFactor.ts`, `sessionLimit.ts`, `totpSecretEncryption.ts`
- `src/accounts/`: `createSuperAdmin.ts`, `endpoints.ts`, `passwordLinks.ts`, `inviteEmail.ts`, `resetEmail.ts`
- `src/collections/Users.ts`, `src/access/accountCreation.ts`, `src/access/roles.ts`
- `src/payload.config.ts` (the payload-totp, multi-tenant and plugin-order setup)
- `src/admin/SuperAdminTwoFactorProvider.tsx`, `SuperAdminSetupRedirect.tsx`, `TenantSelectionAfterTwoFactor.tsx`, `guardTenantSelection.ts`
- Because the two-factor rule depends on them: payload-totp 3.0.6's own source (its sign-in check, cookie, access wrapper, code endpoints, wrong-code counter), Payload 3.90.2's login token check, refresh, unlock and password-change code, and the multi-tenant plugin's access wrapper and club-list endpoint
- Code outside the area that makes its own "is this a super-admin?" decision: `src/proxy.ts`, `src/admin/ClubHome.tsx`, `src/admin/PageTree.tsx`, `src/admin/clubSetup.ts`, `src/site/livePreviewAccess.ts`, `src/marketing/superAdmin.ts`, the demo-club and marketing-starter routes, `src/media/uploadGuards.ts`, `scripts/create-super-admin.ts`, `scripts/reset-two-factor.ts`
- The existing tests: `two-factor`, `password-only`, `accounts`, `password-links`, `access` (integration) and `two-factor.spec.ts` (browser)

Checklist used: `docs/operations/security-checks.md` item 2 (accounts), plus the authentication and authorisation phases of the `infosec-review` skill.

## Findings

### A1 (medium): an editor can change their own sign-in email, and nobody is told

**Where:** `src/collections/Users.ts:50-54` (the `update` rule lets an editor edit their own account) together with Payload's built-in `email` field, which has no rule of its own. The "password was set" email (`src/auth/sessionLimit.ts:84-90`) only covers passwords.

**What's wrong:** a club editor can change the email address they sign in with, from their account page or the API, without typing their password again. The old address gets no email.

**How an attacker would use it:** someone gets a few minutes with a signed-in editor's browser (a shared clubhouse computer left signed in is realistic). They change the account's email to their own. From then on "Forgot password?" sends reset links to them, and the "your password was set" warning goes to them too, so the real editor is never told. A session that would have ended after 8 hours becomes permanent control of that club's website. It stays inside the one club: it doesn't reach other clubs.

**Proof:** `audit-auth.int.spec.ts`, "Finding A1": the editor's email changes to `attacker@example.net`, and no email goes to the old address.

**Proposed fix (draft PR):** only a super-admin can change an account's email. Editors who change address ask you, which is rare. This also matches "keep it simple". The alternative (let editors change it but email the old address and ask for the current password) is more code for little gain.

### A2 (low): a password can be changed without the current password

**Where:** Payload's standard account update, allowed by `src/collections/Users.ts:50-54`.

**What's wrong:** the account page's "Change password" doesn't ask for the current password.

**How an attacker would use it:** same borrowed-browser scenario as A1. They set a new password and the real editor is locked out. This is less serious than A1 because Payload then signs out every other session (so the editor notices at once) and, once A1 is fixed, the "your password was set" email reaches the real editor, who can ask you for a new link.

**Proof:** `audit-auth.int.spec.ts`, "Finding A2".

**Needs your decision:** asking for the current password means replacing Payload's built-in password box with our own. I'd suggest **not** doing this for v1 once A1 is fixed, and revisiting it before booking or member logins exist.

### A3 (low): two admin screens skip access rules and don't check the code themselves

**Where:** `src/admin/ClubHome.tsx:137-143` and `src/admin/PageTree.tsx:57-61`. They read data with access rules switched off (`src/admin/clubSetup.ts`, `src/admin/pageTreeData.ts`) and decide what to show using "is this a super-admin?" (`isSuperAdmin`), not "is this a super-admin **who has entered their code**?" (`isSuperAdminWithCode`).

**What's wrong:** if these screens ever render for someone who has typed their password but not their code, they show:
- for a super-admin: every club's name and setup progress
- for an editor with two-factor: their own club's newest enquiries (names and references) and its page tree

**How an attacker would use it:** today, **they can't**. The two-factor redirect in the admin layout (payload-totp's provider and ours) runs before these screens and wins. I checked that the redirect can't be skipped: the `x-pathname` header it relies on is always overwritten by `src/proxy.ts:95`, and none of Payload's admin "server functions" render the dashboard or the page tree. But the protection lives in one place, a long way from the code that skips access rules. A future change to the redirect, a Payload upgrade, or a new way of rendering the dashboard would expose the data. Every other route that makes its own decision (live preview, demo club, marketing review pages, invite and reset endpoints) already checks the code.

**Proof:** `audit-auth.int.spec.ts`, "Finding A3": both screens return content for someone without their code.

**Proposed fix (draft PR):** both screens return nothing unless `isFullyAuthenticated(user)`, and the super-admin parts use `isSuperAdminWithCode`. Two lines each.

### A4 (low): the sign-in lockout reveals which email addresses have accounts

**Where:** Payload's login (`maxLoginAttempts: 5` in `src/collections/Users.ts:140`).

**What's wrong:** after 5 wrong passwords, an existing account answers "This user is locked…", while an address with no account keeps answering "The email or password provided is incorrect". So a stranger can find out whether an address (yours, or a club secretary's) has an account. The same 5 tries also let anyone lock any account, yours included, for 10 minutes at a time. Vercel's firewall limits how fast one address can try, but not someone using many addresses.

**How an attacker would use it:** to confirm which email to phish or guess passwords for, and to keep an account locked out as a nuisance. It doesn't reveal which club the account belongs to.

**Proof:** `audit-auth.int.spec.ts`, "Finding A4".

**Needs your decision:** Payload has no setting to change this message. A small error rewrite on the login route would hide it. Worth doing before the pen test, because testers will report it, but it's not urgent.

### A5 (low): Payload's own cross-site request check is off

**Where:** `src/payload.config.ts` sets neither `csrf` nor `serverURL`, so Payload's list of trusted addresses is empty. Payload then accepts the login cookie from a request started by **any** website (`payload/dist/auth/extractJWT.js`).

**What's wrong:** the only thing stopping another website from making a signed-in request on an editor's behalf is the cookie's `SameSite=Lax` setting (`src/collections/Users.ts:120-123`). That works in all current browsers against other websites. It doesn't help against a site on the **same** domain, for example a club site on a subdomain of the admin's domain. Today nothing on such a site can run an editor's script (no per-club custom code), and club domains are set only by you, so this is defence in depth.

**How an attacker would use it:** only if they could run script on a page sharing the admin's domain. They can't today.

**Proof:** `audit-auth.int.spec.ts`, "Finding A5".

**Needs your decision:** setting `csrf` to the admin's address (`ADMIN_URL`) is one line. But every place the admin is reached from needs to be on the list (staging, previews, local, browser tests), so it needs a careful test run on staging. I'd do it as its own small PR after the pen-test scope is settled.

## Checked and fine

The top risk first: **one club reaching another through accounts or sign-in.**

| Check | Result | Evidence |
|---|---|---|
| Editor makes themselves super-admin | Impossible. The field ignores changes, account creation refuses it, and a database trigger blocks any change to account type | `Users.ts:205`, `accountCreation.ts:29-34`, migration `20261011_072736_initial.ts:100-114`; tests in `accounts.int.spec.ts` |
| Editor moves to another club, or a super-admin moves an editor | Impossible, same three layers | Same; new guard test in `audit-auth.int.spec.ts` |
| Editor creates any account, including through Payload's "create first user" | Refused | `accountCreation.ts`, `access.int.spec.ts` |
| Editor sees super-admins or other clubs' editors | No | `Users.ts:31-48`, `accounts.int.spec.ts` |
| Super-admin with password but no code reaches data | No. Every collection and settings rule is wrapped (`superAdminTwoFactor.ts:45-66`), including the plugins' own, because it runs last. Payload's own late-added collections are either closed to everyone (jobs, key-value store), have no API at all (migrations), or narrow to your own records (preferences). Document locking is off, so its collection doesn't exist | `superAdminTwoFactor.ts`, `access.int.spec.ts:22-41`, `two-factor.int.spec.ts` |
| Super-admin who never set up two-factor reaches data | No: same wrapper, plus the redirect to the set-up screen on the server and in the browser | `SuperAdminTwoFactorProvider.tsx`, `SuperAdminSetupRedirect.tsx`, `two-factor.int.spec.ts:73-91` |
| Custom endpoints and routes before the code | All check `isSuperAdminWithCode`: invite, password link, reset two-factor, demo club, marketing starter, marketing review pages, job runs. The club list (`/api/tenants/populate-tenant-options`) and upload links go through the wrapped access rules. Live preview checks `isFullyAuthenticated` | `accounts/endpoints.ts:12-16`, `resetTwoFactor.ts:28`, `privacy/jobs.ts`, `livePreviewAccess.ts:17` |
| How "code entered" is decided | Only payload-totp's sign-in check sets it, and only after re-checking the normal login token **and** that both belong to the same account. The code cookie is signed with the app secret and can't be forged or swapped with the login token | `payload-totp/dist/strategy.js`, `fullyAuthenticated.ts` |
| Switching two-factor off | Refused for super-admins (`/api/remove-totp`). Editors need a correct code. Nobody can clear a secret by saving their account (the field is locked) | `superAdminTwoFactor.ts:35-43`; new guard test |
| Resetting someone's two-factor | Super-admin with code only, editors only. Super-admins only by script | `resetTwoFactor.ts:24-43`, `scripts/reset-two-factor.ts` |
| Two-factor secrets at rest | AES-256-GCM, key only in the environment, fails closed on anything planted unencrypted | `totpSecretEncryption.ts`, `two-factor.int.spec.ts:104-147` |
| Wrong-code limit | 5 wrong codes lock for 10 minutes, counted in their own table so parallel guesses can't race past it | `payload-totp/dist/utilities/codeAttempts.js` |
| Unlocking someone else's account (which would also clear their wrong-code count) | Refused for everyone through the API | New guard test; see note H4 |
| Invite and password links | Random, single use, 72 hours. Only for editors. Emailed links always use `ADMIN_URL`, never the request's address | `passwordLinks.ts`, `resetEmail.ts:13-23`, `password-links.int.spec.ts` |
| "Forgot password?" | Off unless email and `ADMIN_URL` are set. Same answer for real and unknown addresses. One email per 15 minutes | `Users.ts:94-112`, `password-links.int.spec.ts` |
| Password change signs out other sessions | Yes, Payload does this for both the account page and reset links | `payload/dist/collections/operations/utilities/update.js:300-304`, `auth/operations/resetPassword.js:91` |
| Editor sessions end after 8 hours | Yes. Payload's refresh runs the check, and the session list it relies on can't be edited through the API | `sessionLimit.ts:33-56`, Payload's `sessions` field (`update: () => false`) |
| Internal sign-in fields (password hash, reset token, lock counters) | Can't be written or read through the API | Payload's `baseFields` |
| Cookies | `httpOnly`, `SameSite=Lax`, `Secure` on Vercel. The code cookie copies these | `Users.ts:120-123`, `payload-totp/dist/setCookie.js` |

## Hardening notes (not vulnerabilities, no test needed)

- **H1, guessing codes when the password is known.** 5 guesses per 10 minutes with no escalation is about 720 guesses a day. Each guess has about a 3-in-a-million chance (the current, previous and next code are all accepted), so roughly 0.2% a day. Each lock also locks you out, so you would notice. A code can also be reused within its ~90-second window. Worth asking the pen testers to look at. A cheap improvement: email you when a super-admin account hits the code lockout.
- **H2, super-admin sessions never re-ask for the code** while the admin stays open (by design: only editors have the 8-hour limit). Consider a 12-hour limit for super-admins too.
- **H3, first sign-in sets up two-factor.** A brand-new super-admin, or one after `pnpm reset-two-factor`, is protected by the password alone until the authenticator app is set up, and whoever signs in first sets it up. Set it up straight after running either script.
- **H4, "unlock" is refused for a fragile reason.** The Users collection has no `unlock` rule. It is refused only because `usersAccessResultOverride` in `src/payload.config.ts:118-121` returns "no" for a rule that doesn't exist. If that fallback ever changed to "yes", any editor could unlock your account and reset your wrong-code count. The new guard test catches that. Adding an explicit `unlock: superAdminOnly` would make it obvious.
- **H5, integration tests fake the "code entered" marker** (`tests/int/helpers/seed.ts:113-126` sets it by hand), so they test the access rules but not payload-totp's real cookie check. The browser test "a password alone reaches only the code screen" does test the real thing for an editor. It would be worth adding the same browser check for a super-admin with password only.

## Not checked

- Payload's admin "server functions" were reviewed by reading the code, not by sending crafted requests to a running server.
- I didn't send any traffic to staging or production, and didn't review Vercel Firewall rules (dashboard only).
- payload-totp's code-checking library (`otpauth`) and Payload's password hashing were taken as correct.

## Tests

`corepack pnpm test tests/int/audit-auth.int.spec.ts` (on a separate local database, `golf_test_auth`): 8 expected failures (the findings), 4 passing guard and control tests. I also ran each finding test as a plain `it` to confirm it fails for the reason described, not by accident. Existing `two-factor` and `password-only` tests: 18 passed.
