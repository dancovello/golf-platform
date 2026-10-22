# Security audit: tenancy (how a request finds its club)

**Date:** 22 October 2026 · **Code reviewed:** commit `b45c7cf` (top of the security stack, branch `docs/pentest-scope-review-list`) · **By:** Claude, as a senior application security reviewer new to this codebase · **Job 8** of the security programme.

## Summary

**Nothing critical, high or medium.** I found no way for one club to see or change another club's data through this area. Two **low** findings and four notes.

| # | Finding | Severity | Where |
|---|---|---|---|
| T1 | The cache is cleared a moment **before** a save is committed to the database, so a visitor arriving in that moment puts the old version back in the cache | Low | `src/site/cacheHooks.ts:30-55` |
| T2 | On production, the admin's live preview loads a club's whole site **before** checking who is asking. Anyone can tell which club short names exist, and make the server do work for free | Low | `src/site/resolveSite.ts:97-104` |
| I1 | The visitor's web address isn't checked for shape before it is looked up | Note | `src/proxy.ts:112-120`, `src/site/resolveSite.ts:72-75` |
| I2 | The address lookup isn't double-checked against the database the way the short-name lookup is | Note | `src/site/resolveSite.ts:43-60`, `src/site/loadClub.ts:148-156` |
| I3 | The proxy doesn't run on `/_next/…` addresses, so headers it normally removes survive there | Note | `src/proxy.ts:164-167` |
| I4 | Outside this area: the live preview link is built from the `x-forwarded-host` header | Note | `src/site/livePreview.ts:15` |

Each low finding has a test that proves it: `tests/int/audit-tenancy.int.spec.ts`. They are marked `it.fails`, so they don't block CI while the findings are open. When a fix lands, its test starts passing, Vitest flags that, and the fix PR changes `it.fails` to `it`.

## Scope

What I read, line by line:

- `src/tenancy.ts`: which collections belong to a club
- `src/proxy.ts`: runs before every request; decides which club (if any) a request is for
- `src/site/hosts.ts`: tidies web addresses; tells the platform's and the company's own addresses apart from clubs'
- `src/site/resolveSite.ts`: turns the address (or `/preview/<club>`) into a club
- `src/site/preview.ts`: the staging preview switch
- `src/site/cache.ts`, `src/site/loadClub.ts`: the cached address lookups and club data
- Because the files above depend on them: `src/site/cacheHooks.ts`, `src/site/livePreviewAccess.ts`, `src/collections/Tenants.ts`, the routes under `src/app/(frontend)/sites/` and `src/app/(frontend)/preview/`, `src/site/routes/views.tsx` (where drafts are decided), `src/site/contact/actions.ts` (the only other reader of the club header), the domains migration, and the Next.js and Payload code these rely on (`unstable_cache` key building, when Payload's save hooks run).
- The tests: `tests/unit/hosts.spec.ts`, `tests/int/domains.int.spec.ts`, `tests/int/cache-isolation.int.spec.ts`, `tests/e2e/site-domains.spec.ts`.

The method was the project's `infosec-review` skill (phase 2, access control and tenant isolation) and the club-separation part of `docs/operations/security-checks.md` (item 1).

## How it works, in one paragraph

A visitor's request arrives with the web address they typed (the `Host` header). The proxy tidies it. If it's the company's address, they get the marketing site. If it's a club's address, the proxy rewrites the request to `/sites/<address>/…` and attaches a private `x-club-host` header. It first deletes any copy of that header the visitor sent. The page then checks that the header and the path agree, and looks the address up in the clubs' list of web addresses (each address can belong to only one club, enforced by the database). Everything after that is loaded by that club's ID. The platform's own address has the admin, the API and `/preview/<club>`. The preview is open to anyone on staging (behind the Vercel login). On production only the admin's live preview works there, for the super-admin or that club's own editors.

## Findings

### T1 (low): the cache is cleared before the save is committed

**What's wrong.** When anything of a club is saved, a hook clears that club's cached data (and, for a club's own record, the address lookups). Payload runs these hooks **inside** the database transaction, before it commits (`node_modules/payload/dist/collections/operations/updateByID.js`: hooks run, then `commitTransaction` at line 226). For that moment the cache is empty but the database still shows the old version to everyone else. A visitor who arrives in that gap reads the old version, and it goes back into the cache. It then stays there until it expires:

- **Address lookups:** up to 5 minutes. If an address is moved from one club to another (for example, fixing an address that was added to the wrong club), visitors to it keep seeing the **old club's** site for up to 5 minutes after the save.
- **Page content:** up to an hour. A correction, or unpublishing something posted by mistake, may not reach visitors for an hour, even though the editor saw "Published".

**How an attacker would use it.** They can't cause it, and the gap lasts milliseconds. But a busy page, or anyone requesting it in a tight loop, will very likely land in the gap. Anyone who wanted an embarrassing page to stay visible after the club took it down could do exactly that. Everything shown was public a moment earlier, so no private data leaks. That's why this is low.

**Where.** `src/site/cacheHooks.ts:30-55` (the hooks), `src/site/cache.ts:117-123` (`clearCache`).

**Proof.** `tests/int/audit-tenancy.int.spec.ts`, "audit T1": two tests. One moves `old-club-a.localhost` from club A to club B. The other publishes a corrected page title. A visitor arrives between the hook and the commit. Afterwards the address still gives club A, and the page still shows the old title. (Run without `it.fails`: "expected 'test-club-a' to be 'test-club-b'" and "expected 'Membership (Club A)' to be 'Membership (corrected)'".)

**Proposed fix.** Clear the cache a second time once the save is committed. In the app, saves happen inside a request, so the hook can schedule a second clear with Next.js's `after()`, which runs once the response is finished (after the commit). Keep the immediate clear too. Outside a request (scripts, tests), `after()` isn't available, and the existing time limits still apply. Small.

### T2 (low): the live preview loads a club before checking who's asking

**What's wrong.** On production, `/preview/<club>?live=1` on the admin's address is meant only for the super-admin and that club's editors. `siteFromPreview` first loads the club: its ID, then its whole shared site (settings, menus, logos, footer). Only then does it check who is signed in (`src/site/resolveSite.ts:101-103`). The visitor is then correctly refused. But:

- a **real** short name makes the server do several database queries, and a **made-up** one makes it do one. The difference in response time tells an outsider, or an editor of another club, which short names exist. That includes clubs still being onboarded, before their site is public. CLAUDE.md's non-negotiable 2 says an editor must not be able to find out that other clubs exist.
- anyone, signed in or not, can make the server query the database and add entries to the shared data cache with any made-up name (`clubIDBySlug` caches "not found" for 5 minutes, per name).

**How an attacker would use it.** Send `https://<admin address>/preview/royal-anywhere?live=1` for a list of likely club names and time the answers. Or send many made-up names to add load and fill the cache. Both are slow and noisy, and every live club's name is public anyway once its site is up. That's why this is low.

**Where.** `src/site/resolveSite.ts:97-104`. The same function serves the preview's not-found page and search.

**Proof.** `tests/int/audit-tenancy.int.spec.ts`, "audit T2": for an anonymous visitor, a real club's name loads `clubIDBySlug` **and** `loadClubSite`, and a made-up name loads only `clubIDBySlug`. Both are refused, correctly. A passing test confirms that.

**Proposed fix.** On production, check the signed-in user first: refuse straight away unless they are the super-admin or a fully signed-in club editor. Look the club up only after that. Also refuse names that aren't in short-name format before any lookup. Small.

### Notes (no change needed now)

- **I1, the address isn't checked for shape before lookup.** The proxy passes whatever the visitor sent as their web address (tidied) to the database lookup, which caches the answer. I sent the proxy odd addresses (`club-b.co.uk%2f`, `club-a.co.uk/../club-b.co.uk`, upper case, trailing dots, ports, empty). None reached another club. Vercel and Cloudflare only send the app addresses that are connected to it, so made-up addresses can't arrive from the internet today. A cheap extra safeguard is to check the address against the same pattern used when saving a club's addresses (`HOST` in `src/site/hosts.ts`) before looking it up.
- **I2, the address lookup isn't double-checked.** `loadClubBySlug` double-checks a cached short-name lookup against the club it loads. `findClubByHost` doesn't. And the double-check is weaker than it looks, because the club it compares against is cached too. This only matters for changes made around the website (scripts, restoring a backup). `docs/plans/club-data-cache-spike.md` already covers those: set `SITE_DATA_CACHE=off` for an hour after a restore. Accepted as designed.
- **I3, the proxy skips `/_next/…`.** The proxy's matcher (`src/proxy.ts:166`) leaves out Next.js's own files, so headers it normally deletes (`x-club-host`, `x-nonce`) aren't deleted there. Nothing under `/_next/` reads them today. And faking `x-club-host` can only pick a club's *public* site, which anyone can visit anyway. **Rule for the future:** nothing outside `/sites/…` should trust `x-club-host`.
- **I4, outside this area.** `src/site/livePreview.ts:15` builds the admin's live preview link from `x-forwarded-host`. On Vercel that header is set by Vercel, not the visitor, so I don't think it can be abused. It belongs to the admin and preview review rather than this one.

## Checked and fine

- **Picking a club by address:** only from the `Host` header, through the proxy. Visitor-sent `x-club-host`, `x-club-origin`, `x-nonce` and policy headers are deleted (`src/proxy.ts:84-91`). Probed directly: a spoofed `x-club-host` on the admin's address never reaches the page.
- **Path tricks on a club's domain:** `/sites/<other club>`, `/%2e%2e/…`, `/x/%2e%2e/%2e%2e/sites/<other club>`, `/%73ites/…`, `%2F`-encoded slashes. The ones that decode to `/sites/…` are refused (404). The rest stay inside the club's own pages. Even a successful rewrite to another club's path would fail the second check in `siteFromDomain`, which compares the path with the proxy's header (`src/site/resolveSite.ts:74`).
- **`/sites/…` and `/marketing/…` on the platform's own address:** 404.
- **One address, one club:** a unique database index (`src/migrations/20261020_164723_club_domains.ts:15`). Addresses are saved lower case and bare, and checked against the platform's and company's own addresses (`src/collections/Tenants.ts:18-26, 115-151`). Only the super-admin can change them (field access, lines 124-127). Hidden canary clubs can't have one.
- **Short names:** unique in the database and checked for format.
- **Drafts:** shown only with `?live=1` **and** a signed-in super-admin or that club's own editor (`src/site/livePreviewAccess.ts`, `src/site/routes/views.tsx:56-57, 138-141, 159-160, 184-185`). Drafts never go through the cache.
- **Cache keys:** every cached club loader is keyed and tagged by the club's ID, and refuses anything else. Next.js adds all the arguments to the key (`unstable_cache`: `${fixedKey}-${JSON.stringify(args)}`). Clearing one club's tag never touches another's. The address lookups return only an ID or short name.
- **Forward to a club's main address:** built from the club's own saved address and the proxy-set path, so it can't become an open redirect.
- **Contact form:** on a club's domain the club comes from the proxy's header, never from the form. On production the preview form is off.
- **Platform and company addresses:** `localhost`, `*.vercel.app`, the admin address and the company addresses can never be a club's.

## Not checked

- Payload's access rules for each collection, the REST and GraphQL APIs, and the admin. Those are other jobs in the programme.
- Real-world routing at Vercel and Cloudflare (whether a made-up `Host` can reach the app). I reasoned about it but didn't send traffic to staging. The pen test (`docs/security/pentest-scope.md`) should confirm it.
- Whether Next.js decodes `%73ites` into `sites` when matching routes. The second check in `siteFromDomain` makes it harmless either way, so I didn't run a server to find out.

## Tests run

- `tests/int/audit-tenancy.int.spec.ts` with `it.fails` removed: the 4 finding tests fail for the reasons above. 1 test passes.
- With `it.fails`, together with `cache-isolation`, `domains` and `hosts`: 4 files passed, 19 tests passed, 4 expected failures.
- `corepack pnpm typecheck` ✅ and `eslint` on the new test ✅.
- The tests ran against a separate local database (`golf_test_audittenancy`), so they didn't clash with another session's test run.
