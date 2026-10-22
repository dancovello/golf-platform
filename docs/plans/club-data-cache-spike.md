# Spike: caching club pages (job 5, 22 Oct 2026)

**The constraint:** every club page view gets a fresh one-time code for the content security policy (`src/proxy.ts`, `src/security/csp.ts`). So the HTML can't be cached: only the data behind it.

## The two options in Next.js 16

| | `'use cache'` + `cacheTag` | `unstable_cache` + tags |
|---|---|---|
| Needs | `cacheComponents: true` for the **whole app**. Every route's `dynamic = 'force-dynamic'` is replaced, pages become partly prerendered, and runtime data (headers, cookies) has to move behind `<Suspense>` | Nothing else changes |
| Payload admin | Payload 3.90 supports it (sets `PAYLOAD_CACHE_COMPONENTS_ENABLED`), but the admin and our providers would render under a new model | Untouched |
| The one-time code | Pages would have a static shell plus dynamic holes. The code must stay in the dynamic part, which is a new thing to get right | Unchanged: pages stay fully dynamic, as tested today |
| Status | Next.js's recommended way | Marked "replaced by `use cache`" in Next 16, but supported, and the docs' "caching without Cache Components" guide still uses it |

**Choice: `unstable_cache`, for now.** It caches exactly the data, leaves the page and the security policy as they are, and doesn't change the admin. Moving to `'use cache'` later is a contained change: one file, `src/site/cache.ts`, wraps every cached loader. That move is worth doing as its own piece of work, once Cache Components has been tried on a branch with the admin and the security-policy tests.

**Checked:**
- `tests/e2e/security-policy.spec.ts` passes with the cache on, including "each page view gets its own code, and a visitor can't choose it".
- 205 of 206 browser tests pass. The one failure was a marketing-site accessibility check that passed twice when re-run on its own.

## How it's done

`src/site/cache.ts` has two helpers, and each cached loader is wrapped where it's defined, so the callers don't change:

- **`clubCached(name, loader)`:** the first argument must be a club ID (a UUID, or it throws). The ID is in the key and is the entry's only tag.
- **`addressCached(name, loader)`:** the two lookups that find a club from its address (slug or web address). They're keyed by the address.

| Loader | Keyed by | Kept at most |
|---|---|---|
| `clubByHost` (web address to club) | address | 5 min |
| `clubIDBySlug` | address | 5 min |
| `loadClubSite` (menus, header, footer, notices, branding) | club | 5 min (notices and course status depend on today) |
| `publishedPage` (page by address, with its blocks' data) | club | 5 min (blocks show events and status) |
| `latestNews`, `newsArchive`, `newsPost` | club | 5 min (publish dates) |
| `upcomingEvents`, `featuredEvent`, `eventsArchive` | club | 5 min (start times) |

- **Clearing:** saving or deleting anything a club owns clears that club's tag at once (`src/site/cacheHooks.ts`). Saving a draft over a draft doesn't clear it. A record moved between clubs clears both. Changing a club's record clears the address lookups too.
- **Drafts and the live preview** never use the cached loaders.
- **Site search** isn't cached; it has its own index.
- **Nothing is kept longer than an hour.** Changes made outside the website (scripts, restoring a backup) can't clear the cache, so this is the limit for those. After a restore, pages may show the old data for up to an hour, or until each club next publishes. A redeploy doesn't clear the data cache. To avoid it, set `SITE_DATA_CACHE=off` for an hour after a restore: it bypasses the old entries rather than deleting them.
- **Emergency switch:** `SITE_DATA_CACHE=off` in Vercel turns caching off without a code change.

## Speed

On a developer's computer the database is about 1 ms away, so the cache saves only about 3–5 ms a page:

| Page | Cache off, p50 / p95 (ms) | Cache on, p50 / p95 (ms) |
|---|---|---|
| Home | 39 / 74 | 36 / 45 |
| Content page | 34 / 39 | 29 / 31 |
| News | 23 / 24 | 20 / 22 |
| Events | 23 / 25 | 21 / 22 |

**The real measure is staging**, where each query crossed the Atlantic until job 1B, and still makes a network round trip after it. Rerun `pnpm measure-speed` (job 1) on staging with this live and add the numbers to `docs/operations/performance.md`.
