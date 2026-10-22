# Review: every place that skips access rules

**Date:** 22 October 2026 · **Commit:** this branch, on `main` at `badd76e` · **Job 2** from the 21 Oct grilling

Payload's access rules are what keep a club editor inside their own club. Server code can skip them, either with `overrideAccess: true` or by leaving `overrideAccess` out of a Local API call (Payload skips the rules by default then). When that happens, the code itself has to keep each club to its own data.

**What I found:** 80 places in 55 functions. The brief counted 69; it has grown with the marketing site and the demo club, and 5 places skipped the rules without saying so. All 80 are now listed in `src/security/override-allowlist.ts`, with the club each one is limited to and why. `tests/unit/override-allowlist.spec.ts` fails the build if a new one appears without an entry.

## How they're limited

| Group | Functions | Limited to | Why the rules are skipped |
|---|---|---|---|
| Public club website | 30 (`src/site/…`, `src/search/…`) | The club found from the web address, in every where clause | Visitors aren't signed in, so there's no user to check |
| Admin screens | 6 | The editor's own club, or the club the super-admin picked | Summaries across several collections |
| Accounts and two-factor | 5 | One account by ID, behind a super-admin check | No access rule allows these changes |
| Demo club | 4 | The demo club only, staging only | Builds and deletes it |
| Marketing site | 5 | No clubs (platform-level) | Super-admin-only collections, shown publicly |
| Nightly clean-up | 2 | Every club, by design | Background job, no user |
| Save checks and hooks | 3 | The record being saved | Run inside a save that already checked access |

## Looks risky? (worst first)

None of these lets one club reach another club's data today. They're places where safety depends on the code being careful, rather than on the rules.

1. **`src/site/events.ts`, `find`: fixed in this change.** The helper took any query, so a future caller could forget the club. It now always adds the club itself. Test: "asking club A's archive to include club B's event shows nothing from club B" (`tests/int/events.int.spec.ts`).
2. **5 calls skipped the rules without saying so** (`createSuperAdmin`, `inviteEditor`, two in `Tenants.ts`, `previewURL`). Each was safe, but nothing showed it. All now say `overrideAccess: true`, and the scanner counts calls that leave it out.
3. **`src/collections/Pages.ts`, `validParent`: low.** It follows a chain of parent pages by ID without filtering by club. It only reads `parent` to detect a loop, and returns no data. A parent from another club is refused by `sameClubCheck` before this matters. It could also filter by club; I left it, to keep this change to checks.
4. **Admin screens (`clubHomeData`, `loadPageTree`, `agreementParty`): low.** They could run as the signed-in user, so the rules would back up the club filter. Each needs an admin browser test changed with it; suggested as a follow-up.
5. **Demo club delete: low.** It deletes everything in the club with the slug `heathcote-demo`. Staging only, super-admin only, and it refuses if the club has any accounts.
6. **Payload's own `payload-migrations` collection: low.** Its access rules allow everything to everyone. It has no web address and no admin screen, so only server code can reach it. `tests/int/config-access.int.spec.ts` now fails if that ever changes.
7. **For job 3:** payload-totp's `/api/remove-totp` lets an account switch off its own two-factor whenever two-factor isn't forced. Today it's forced for everyone, so it refuses. Once editors are password-only, it must still refuse for super-admins.

## Could any use the normal rules instead?

**Mostly no.** For the public site, the rules wouldn't add safety. An anonymous visitor has no club, so the rules can't limit one; the where clause on the club is what does it, and the isolation tests check it. The admin screens in point 4 are the real candidates.
