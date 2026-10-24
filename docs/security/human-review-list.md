# Human review list: before go-live

**Prepared:** 22 October 2026 · **For:** Dan's developer friends · **In order of priority.** Reading times are for careful security reading (about 150 lines in 10 minutes), not skimming.

**What matters most:** one club seeing or changing another club's data. The app keeps clubs apart in its own code (Payload access rules), not with separate databases. So the places where code **skips** those rules, or decides **which club** a request is for, are where a mistake would hurt.

## 1. Which club a request is for (about 30 minutes)

| File | Look for |
|---|---|
| `src/proxy.ts` | Which address serves which site. Headers a visitor sends must be dropped before ours are set (`x-club-host`, `x-nonce`). Club domains must not reach the admin, API or other clubs' routes. |
| `src/site/resolveSite.ts` | The club is found only from the web address or the preview path, never from anything else the visitor sends. |
| `src/tenancy.ts` | Every club-owned collection is listed. Something missing here isn't scoped to a club. |

## 2. Access rules and accounts (about 60 minutes)

| File | Look for |
|---|---|
| `src/access/roles.ts`, `src/access/accountCreation.ts` | Super-admin versus editor, and no way to create accounts except trusted scripts. |
| `src/collections/Users.ts` | Who can read and change accounts. An editor can never change their own role or club, and never sees super-admins. |
| `src/collections/Tenants.ts` | Editors read only their own club. Canary clubs can't get a web address. |
| `src/auth/fullyAuthenticated.ts`, `src/auth/superAdminTwoFactor.ts` | Super-admins without their two-factor code get nothing. The plugin wraps **every** access rule. |
| `src/auth/sessionLimit.ts` | Editors' 8-hour session limit, and the password-changed email. |
| `src/accounts/endpoints.ts`, `src/accounts/passwordLinks.ts`, `src/auth/resetTwoFactor.ts` | Custom endpoints check the user themselves; Payload's access wrapper doesn't cover them. |
| `src/site/livePreviewAccess.ts` | Only a club's own editor, or the super-admin, sees drafts. |

## 3. Every place that skips the access rules (about 2 hours)

`src/security/override-allowlist.ts` lists all of them (91, in 59 functions, at the time of writing), each with which club it's limited to and why. **For each entry, open the code and check the club filter is really there**, and that the club ID comes from a trusted place (resolveSite, the signed-in editor, or the record being saved). The biggest files:

| File | Uses |
|---|---|
| `src/site/loadClub.ts` | Club site data, menus, pages |
| `src/site/blocks/resolve.ts`, `src/site/blocks/media.ts` | Everything a page's blocks show |
| `src/site/news.ts`, `src/site/events.ts` | News and events |
| `src/site/contact/submit.ts`, `src/site/contact/alert.ts` | Contact form: saving and emailing |
| `src/admin/clubSetup.ts`, `src/admin/pageTreeData.ts` | Admin home and page tree |
| `src/site/sameClub.ts` | The check that refuses links to another club's content |
| `src/demo/demoClub.ts`, `src/canary/*` | Staging demo club; production canary |

## 4. Raw SQL (about 30 minutes)

| File | Look for |
|---|---|
| `src/search/query.ts`, `src/search/fresh.ts`, `src/search/hooks.ts`, `src/search/answers.ts` | Every query names one club (`tenant_id = ${…}`). Values only ever inside `sql\`…\`` (parameters), never joined as text. `tests/unit/raw-sql.spec.ts` checks the second; the first needs eyes. |
| `src/security/rateLimit.ts` | The shared rate-limit counter. No IP address is stored. |

## 5. The cache layer (about 25 minutes)

| File | Look for |
|---|---|
| `src/site/cache.ts` | Every cached loader takes the club ID first; it's in the key and the only tag. Drafts never go through it. |
| `src/site/cacheHooks.ts` | Saving or deleting clears only that club. A record moved between clubs clears both. |

## 6. Uploads (about 15 minutes)

| File | Look for |
|---|---|
| `src/media/uploadGuards.ts` | Signed links only for allowed file types, in a fresh random folder, never overwriting an existing file, and never for another club's record. |

**Total: about 4½–5 hours**, best split across two or three people by section.

**Supporting evidence** (no need to review in depth):
- `docs/security/override-review.md`;
- `docs/security/red-team-1.md`;
- the tests named in `src/security/isolation-manifest.ts`.

## Sign-off

| File or section | Reviewer | Date | Notes |
|---|---|---|---|
| 1. Which club a request is for | | | |
| 2. Access rules and accounts | | | |
| 3. Access-rule skips (allowlist) | | | |
| 4. Raw SQL | | | |
| 5. Cache layer | | | |
| 6. Uploads | | | |
