# Security audit: access rules

- **Date:** 22 October 2026
- **Commit reviewed:** `b45c7cf` (top of the security stack, branch `docs/pentest-scope-review-list`)
- **Reviewer:** Claude Code, acting as an outside application-security reviewer (job 8 of the security programme)
- **Scope:** who may create, read, change and delete what. `src/access/`, every collection's and settings screen's access rules, and how the plugins wrap them.
- **Method:** `docs/operations/security-checks.md` item 1 (club separation), and the authorisation part (phase 2) of the `infosec-review` skill. I read the code first and checked the tests only afterwards. I proved each finding by running it against a local test database.

## Summary

**Nothing urgent. I found no way for one club to see or change another club's content.** The club boundary held in every test I ran: reading, listing, version history, moving a record to another club, creating a record in another club, linking to another club's photos and pages, and the club picker.

There are four smaller findings:

| # | Finding | Severity | Where |
|---|---|---|---|
| A1 | Club editors can read the company website's unpublished drafts and page history | **Medium** | `src/marketing/access.ts:9-14`, used by `src/marketing/collections/MarketingPages.ts:47-49` |
| A2 | The automatic access checks look at 4 of Payload's 6 operations, so they missed A1 | **Low** | `tests/unit/access-guard.spec.ts:10`, `tests/int/config-access.int.spec.ts:13` |
| A3 | An editor can find out whether any email address has an account, including other clubs' staff | **Low** | `src/collections/Users.ts:50-54` |
| A4 | Anyone holding a signed-in session can change that account's password or email without the current password | **Low** (needs a decision from Dan) | `src/collections/Users.ts:50-54` |

Each finding has a test in `tests/int/audit-access-rules.int.spec.ts`. The tests are marked `it.fails`, so CI stays green until each one is fixed (see the end of this report). I haven't fixed anything.

## Findings

### A1 (medium): club editors can read the company website's drafts

**What's wrong.** The company website's pages (`marketing-pages`) keep a draft and version history. Their access rules (`marketingAccess`) set create, read, update and delete to super-admin only. They don't set **`readVersions`**, the rule for the history. When that rule is missing, Payload lets anyone who is signed in through (`node_modules/payload/dist/auth/executeAccess.js`). payload-totp then wraps the missing rule as "yes for anyone signed in". So every club editor can list and open every draft and every old version of every company-website page.

The project's own decision (`src/marketing/access.ts:4-7`) is that club editors "can't read, change or even see" this content. Non-negotiable 1 in CLAUDE.md says a missing access function counts as a bug.

**How an attacker would use it.** Any club editor, or anyone who has stolen one editor's password, sends `GET /api/marketing-pages/versions` and reads unreleased pricing, claims and page copy before they go live. Restoring an old version is **not** possible: Payload checks the update rule for that, and the update rule refuses. A super-admin who hasn't entered their two-factor code is also refused, because the two-factor wrapper catches it.

**Proof.** `A1` in the test file: a club A editor lists the versions and opens one draft. Both calls succeed (expected 403, got 200).

**Proposed fix (small).** Add `readVersions: superAdminOnly` to `marketingAccess`. Optionally also add `unlock` (unused today, but it would make the default-deny rule explicit).

**Not club data**, which is why this is medium, not high.

### A2 (low): the automatic checks only look at four of the six operations

**What's wrong.** `tests/unit/access-guard.spec.ts` and `tests/int/config-access.int.spec.ts` both check `create`, `read`, `update` and `delete`. Payload has two more: `readVersions` (history and drafts) and `unlock`. That's how A1 got through. The isolation suite covers version history for club collections. Nothing checks it for platform collections.

**How an attacker would use it.** Not directly. The risk is that the next collection with drafts repeats A1 and every guard stays green.

**Proof.** `A2` in the test file goes through every collection that has a version history in the running config. It fails, naming `marketing-pages`.

**Proposed fix (small).** In `access-guard.spec.ts`, require `readVersions` on any collection with `versions`. In `config-access.int.spec.ts`, add `readVersions` to the "never a plain yes" check.

### A3 (low): changing your own email reveals which addresses have accounts

**What's wrong.** An editor may edit their own account (`Users.update` returns "own record"), including the email address. Email addresses must be unique across the whole platform. If the editor tries an address that another account already uses, the save is refused with "invalid: email". If the address is free, the save goes through.

**How an attacker would use it.** A club A editor tries `secretary@royal-example.co.uk`. If it's refused, Royal Example has an account, so it's a customer. The same works for finding the super-admin's sign-in address, which helps a targeted phishing or password-guessing attempt. It needs a signed-in editor, works one guess at a time, and changes the attacker's own email whenever the guess is free (they then change it back). Login and "forgot password" don't leak this. This is the only path I found that does. It goes against non-negotiable 2: club editors must be "unable to discover that other tenants exist".

**Proof.** `A3`: club B's editor's address gets 400, a free address gets 200.

**Proposed fix (small; Dan to choose).**
- **Option 1 (recommended): editors can't change their own email.** Add field-level `update` access on `email` for super-admins only. A club that needs a new address asks Dan, which suits invite-only accounts. This also closes the email half of A4.
- **Option 2:** keep self-service, and give the same answer to taken and free addresses (for example, send a confirmation link to the new address and only switch after it's clicked). This is more work.

### A4 (low): a session alone can change the password or email

**What's wrong.** Payload's standard behaviour: whoever holds a signed-in session can set a new password or email on that account without typing the current password. `Users.update` allows "own record", and nothing asks for the current password.

**How an attacker would use it.** Someone who gets hold of an editor's session briefly (for example an unlocked club office PC, or a stolen cookie) sets a new password. The real editor is locked out until Dan sends a new link. Without two-factor (optional for editors since 22 Oct), the attacker keeps access for good. It's the attacker's own club only: this is not a cross-club issue.

**Proof.** `A4`: an editor's session changes that editor's password (expected a refusal, got 200).

**Proposed fix (medium; needs Dan's decision, because it changes the "change password" screen).** Either ask for the current password before a password or email change (a small custom endpoint plus a field rule that refuses `password` and `email` on plain updates by editors), or accept the risk for v1 and note it. Super-admins are less exposed, because two-factor is required for them.

## Checked and fine

Each item below I read in the code, and where marked, also ran against the local database.

- **The club boundary on club content** (pages, news, events, team, courses, documents, photos, enquiries, agreement, club settings, course status). The multi-tenant plugin (`@payloadcms/plugin-multi-tenant` 3.90.2) adds "only your club" to all six operations for editors (`addCollectionAccess.js`), on top of our own rules. *Ran:* listing club B's page versions as club A's editor gives 0 results.
- **Moving or creating content in another club.** The plugin's tenant check refuses a club the editor doesn't belong to, on every save, including drafts and autosave (`isValidTenantAssignment.js`). *Ran:* moving page A to club B and creating news in club B were both refused.
- **Links to another club's items** (`src/site/sameClub.ts`). Every block's reference list (`refs` in `src/blocks/*/config.ts`) matches its photo, page, document, team and course fields. Rich-text links and photos are checked too. An unexpected link type fails safely: it's looked up in the wrong collection, not found, and refused. The error never says whether the item exists.
- **Photo and document folders** (`src/media/folders.ts`): unique, can't be changed after upload, format-checked. A record can't be pointed at another club's file.
- **Accounts** (`src/collections/Users.ts`). Editors see themselves and their own club's editors, never super-admins. Role and club can't be changed by anyone (field rule plus the database). Accounts are created only by a super-admin or a trusted script (`src/access/accountCreation.ts`). The plugin's account wrapper hands back our frozen rules (`usersAccessResultOverride`), and `unlock` and `readVersions` on accounts are refused for everyone. A colleague's `sessions`, `totpSecret` and `hasTotp` are hidden. *Ran:* club A's editor reading club A's second editor sees no session data.
- **Clubs** (`src/collections/Tenants.ts`): editors read only their own club; changes are super-admin only. The club picker's options endpoint uses the editor's own access. *Ran:* club A's editor lists one club.
- **Two-factor wrapping** (`src/auth/superAdminTwoFactor.ts`, `src/auth/fullyAuthenticated.ts`). It runs after the plugins that add collections, and wraps every collection and settings rule. Payload's own collections are covered by `config-access.int.spec.ts`. The three custom account endpoints check for a super-admin with their code entered. *Ran:* a super-admin without their code is refused the company-website history.
- **Enquiries**: nobody can create them through the API; what the visitor sent can't be edited; `handledAt` is set by the server only.
- **Agreement acceptances**: only a club's own editor can create one; nobody can change or delete one; who accepted and when come from the server.
- **Company website photos and settings** (`marketing-media`, `marketing-settings`): super-admin only for every operation they have (no version history).
- **Payload's own collections** (preferences, jobs, key-value store, two-factor attempts, migrations): already pinned down by `tests/int/config-access.int.spec.ts`. Document locking is off everywhere.
- **GraphQL** is switched off (`src/payload.config.ts:78`).

**Small note, not a finding:** the comment at `src/collections/Pages.ts:82-83` says the plugin doesn't limit version history to the editor's club. In plugin 3.90.2 it does (`version.tenant`). Our extra rule is harmless (both checks apply), but the comment is out of date.

## Not checked

- **Things other jobs cover:** the public website's own data loading (it reads with `overrideAccess` and picks the club from the web address), site search, uploads and signed upload links, sign-in, lockout and rate limits. Those are other jobs in the programme.
- **The admin screens in a real browser:** I tested the access rules directly, which is what both the REST API and the admin screens use. I didn't click through the admin as an editor.
- **Staging or production:** I ran nothing against either.

## How I tested

- I ran everything on a local copy of the test database (`golf_test_access`), because a sibling audit session was using `golf_test` at the same time.
- `corepack pnpm exec vitest run`: **596 passed, 4 expected failures (the four tests above), 0 failed.**
- `corepack pnpm typecheck` passed; eslint and prettier are clean on the new test file.

## The tests, and what to do when fixing

The tests are in `tests/int/audit-access-rules.int.spec.ts`. Each one asserts the **safe** behaviour and is marked `it.fails`, so today it reports as passing. When a fix lands, that test starts to fail. The fix PR changes it from `it.fails` to `it`, which keeps it as a permanent regression test.
