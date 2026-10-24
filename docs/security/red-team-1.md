# Red team, session 1: club B's editor going after club A

**Date:** 22 October 2026 · **On:** the stack up to job 9 (password-only editors, cached club data) · **By:** Claude, as an editor of one club trying to reach the other. Every attempt is a test, whether it worked or not.

The tests are written as "club A's editor going after club B", which is the same thing with the clubs swapped.

| # | Attempt | Result | Test |
|---|---|---|---|
| 1 | **Guess IDs:** ask for the other club's page, settings, editor, club and super-admin by ID | Nothing. Each answers exactly like a made-up ID, and IDs are random UUIDs | `api-isolation.spec.ts`: "club B's records answer exactly like records that don't exist"; fuzz tests |
| 2 | **Change the club-selector cookie** (`payload-tenant`) to the other club's ID | Nothing of the other club. Lists come back **empty**, exactly as with a made-up ID, so there's no hint the club exists. The admin repeats the cookie's own value back, which is the attacker's input, not data | `red-team.spec.ts`: "choosing club B in the club-selector cookie shows nothing of club B" |
| 3 | **Filter through relationships:** `where[tenant.name]`, `where[tenant.slug]`, `where[parent.tenant]`, an `or` with "everything", and sort by club with deep population | Nothing | `red-team.spec.ts`: "filtering through a relationship…" |
| 4 | **Point own content at the other club's:** parent page, photo in a hero block | Refused, and nothing populated | `red-team.spec.ts`: "pointing club A's page at club B's photo or page is refused" |
| 5 | **Site search**, including the header panel | Own club only | `site-domains.spec.ts`, `site-search-panel.spec.ts` |
| 6 | **Sitemaps and robots.txt** | Own club only | `site-domains.spec.ts`: "robots.txt and sitemap.xml are the club's own" |
| 7 | **Photo file addresses** through `/api/media/file` | Answers like a made-up file. Public files on R2 sit in random folders | `api-isolation.spec.ts` |
| 8 | **Live preview** (`?live=1`) on the other club's page while signed in | The published page only, never the other club's draft | `red-team.spec.ts`: "club B's draft stays hidden…" |
| 9 | **Password links:** ask for a reset email for the other club's editor | The same answer as for an unknown address | `red-team.spec.ts`: "a forgotten-password request…" |
| 10 | **Demo-club API** | Super-admin with their code only, and same-site only | `demo-club.spec.ts` |
| 11 | **Enquiry emails:** use one club's contact form to send into another club | Refused: the form's token is tied to its club | `contact.int.spec.ts`: "refuses a form token from another club…" |
| 12 | **Page history, job queue, admin preferences, `/api/access`** | Nothing of the other club | `api-isolation.spec.ts`, `isolation.int.spec.ts` (job 2) |
| 13 | **Cached pages:** the same page address in both clubs; publish in one | Each club gets its own; publishing clears only that club | `cache-isolation.int.spec.ts`, `site-cache.spec.ts` (job 5) |
| 14 | **Random everything:** 10,000 random reads and writes as each role (database layer), 500 random REST requests | Nothing reached the other club | `isolation-fuzz.int.spec.ts`, `api-isolation-fuzz.spec.ts` |

**Found:** no way across. Two things worth knowing:
- **Attempt 2:** a tampered club-selector cookie empties the tampering editor's own lists. That's harmless: editors have no club switcher, so only they can do it to themselves.
- **While testing:** a test server that outlives its database (re-seeded with new IDs) can serve cached club data for up to 5 minutes. That made search fail locally. Browser tests now always start a fresh server with an empty data cache. In real use a restore keeps the same IDs; see `docs/plans/club-data-cache-spike.md`.

**Next session:** worth repeating after any change to access rules, caching or sign-in, and before the pen test.
