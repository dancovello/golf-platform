# Security audit: site search and its SQL

**Date:** 22 October 2026
**Commit reviewed:** `b45c7cf` (top of the stacked security PRs, branch `docs/pentest-scope-review-list`)
**Reviewer:** Claude Code, acting as a senior application security reviewer new to this codebase (job 8 of the security programme)
**Scope:** `src/search/` (`query.ts`, `fresh.ts`, `hooks.ts`, `answers.ts`, `schema.ts`, and `build.ts`, `words.ts`, `intents.ts` which they rely on), the search routes (`src/site/routes/suggest.ts`, `src/site/search/load.ts`, `src/site/search/panelData.ts`, the `/search/suggest` route files), and the shared rate limiter's SQL (`src/security/rateLimit.ts`, `src/security/limitRequest.ts`).
**Method:** read every query by hand, then probed suspicious behaviour against a local copy of the database. Checklist: `docs/operations/security-checks.md` item 3 ("site search: rate limit, can it leak drafts or other clubs' content"), plus the infosec-review skill's injection and authorisation sections.

## Summary

**Nothing urgent.** No club can see or change another club's search data, and there is no SQL injection. Five findings, none critical or high:

| # | Finding | Severity | Where |
|---|---|---|---|
| 1 | "Did you mean" can suggest words from news scheduled for later | **Medium** | `src/search/query.ts:118-136` |
| 2 | A search that finds nothing makes the database read the whole club's text up to 8 times | **Medium** | `src/search/query.ts:118-136` |
| 3 | The search rate limit counts each IPv6 address separately, so one visitor can have billions of limits | **Medium** | `src/security/rateLimit.ts:79`, `:104-111` |
| 4 | Several searches arriving just after an edit each rebuild the club's whole index | Low | `src/search/fresh.ts:20-31`, `:36-37` |
| 5 | A slow rebuild can put back, for a moment, a page that was unpublished meanwhile | Low | `src/search/fresh.ts:36-60` |

Each finding has a test that proves it in `tests/int/audit-search-sql.int.spec.ts`. They are marked `it.fails`, so they pass in CI today and will flag up once the fix lands (the fix PR then changes `it.fails` to `it`). Nothing has been fixed. Fixes are proposed below and wait for Dan's approval.

Findings 2 and 3 multiply each other: finding 2 makes each bad search expensive, and finding 3 removes the cap on how many one person can send.

**Fixed on 23 October 2026** (Dan approved all five). 1: "Did you mean" uses only visible words. 2: the stop-gap: one query for all words, skipped for searches of more than three words (no new table). 3: IPv6 addresses count by their /64 network (`visitorNetwork`, every limit). 4: searches arriving together on one server share one rebuild. 5: a rebuild never writes over an index built at the same or a later change count.

---

## Findings

### 1. "Did you mean" can suggest words from news scheduled for later (Medium)

**Where:** `src/search/query.ts:118-136` (the `suggestion` function).

**What's wrong.** Scheduled news (published, with a publish date in the future) is stored in the index straight away so that it appears on its date without a rebuild. The main search hides it with `visible_from <= now` (`query.ts:69`). The "Did you mean" query reads the words of **every** index row for the club and skips that check. So when a search finds nothing, the suggestion can be a word that only exists in a news article nobody can read yet. Started events (`visible_until`) are skipped by the same gap, but those were public before, so they don't matter.

**How an attacker would use it.** Someone who suspects an announcement (a merger, a price rise, a new professional's name) types near-misses and watches for "Did you mean …". The test shows a draft-dated headline "Merger with Fairhaven agreed": searching `fairhaven` correctly finds nothing, but `fairhavn` answers "Did you mean **fairhaven**". It leaks single words, not whole articles, and only the same club's words, so it is not a cross-club leak. It does break the rule in `docs/architecture/decisions.md` ("scheduled news … can't be found").

**Test:** `finding 1` in `tests/int/audit-search-sql.int.spec.ts` (fails today with `expected 'fairhaven' to be null`).

**Proposed fix (small).** Add the same two visibility lines to the inner query of `suggestion` that `matching` uses:
`AND (visible_from IS NULL OR visible_from <= now) AND (visible_until IS NULL OR visible_until > now)`.

### 2. A search that finds nothing reads the whole club's text up to 8 times (Medium)

**Where:** `src/search/query.ts:118-136`.

**What's wrong.** When nothing matches, "Did you mean" runs one query **per searched word** (up to 8 words). Each query splits the whole text of every page, article and profile in the club into words (`regexp_split_to_table`), removes duplicates, and compares each one with the searched word. No index can help with this. A search for eight made-up words therefore makes the database read the club's whole text eight times, one after another. Searches that do find something don't run this.

**Measured** (local Postgres 18, laptop):

- Worst case an editor could create (300 pages at the 20,000-character limit, about 6 MB of text): **0.42 seconds per word**, so about **3.4 seconds of database time per search**.
- A typical club has far less text, so each search costs much less (not measured; the cost grows in step with the amount of text). The worst case matters because one large club's text sets the cost for everyone sharing the database.

**How an attacker would use it.** It is a cost and availability attack, not a data leak. Every gibberish search (easy: random letters) gets the slowest path. The header panel sends one search per keystroke and the limit is 120 a minute per visitor. On a large club that is up to about 400 seconds of database work a minute from one visitor. All clubs share one Neon database, so a slow-down caused through one club's site is felt on every club's site and the admin. Finding 3 removes the per-visitor cap.

**Test:** `finding 2` (fails today: 8 scans for one search, expected at most 1).

**Proposed fix (medium).** Keep a small per-club word list, built at the same time as the index (one row per distinct word, with a `pg_trgm` index on it). "Did you mean" then becomes one indexed query for all the words together, instead of eight full scans. That is a new table, so a migration (add-only). A quicker stop-gap with no migration: one query for all words together (one scan, not eight), and skip "Did you mean" for searches of more than three words.

### 3. The search rate limit counts each IPv6 address separately (Medium)

**Where:** `src/security/rateLimit.ts:79` (the key) and `:104-111` (`visitorKey`).

**What's wrong.** The limit is per full address. With IPv4 that's roughly one household or office. With IPv6, every home broadband line and every cheap cloud server is given a whole block of addresses (normally a "/64", about 18 billion billion addresses), and the owner can use any of them. So one person can send each search from a fresh address and never reach the limit. Each fresh address also adds a new row to the `rate_limits` table until the nightly clean-up.

**How an attacker would use it.** A script on one cloud server rotates its source address inside its own /64 and sends as many gibberish searches as it likes (finding 2). The Vercel Firewall rule mentioned in `docs/architecture/decisions.md` may already group IPv6 addresses. This review didn't check that, because it is a dashboard setting, not code.

**Test:** `finding 3` (fails today: a second address in the same /64 is allowed straight after the first used up a limit of one).

**Proposed fix (small).** In `visitorKey`, cut IPv6 addresses to their first 64 bits (the network part) before hashing. IPv4 is unchanged. This affects every limit that uses `visitorKey`, which is the point, so the rate-limit audit should know (noted in the shared notes).

### 4. Several searches just after an edit each rebuild the whole index (Low)

**Where:** `src/search/fresh.ts:20-31` (`ensureFreshIndex`) and `:36-37` (`rebuildIndex`).

**What's wrong.** After any edit, the next search rebuilds the club's index. Each search checks "is it out of date?" first, and the rebuild lock (`fresh.ts:41`) is only taken *after* the slow part (reading all the club's pages, news, events, people and photos). So if five searches arrive together after an edit, all five do the full rebuild, then wait for each other to write it.

**How an attacker would use it.** It is mostly a self-inflicted cost on a busy club. An attacker can't trigger an edit, but can time a burst of searches just after one (for example after a course-status update in the morning, when edits are likely). It costs database time, not data. Low because it is limited by how often editors save.

**Test:** `finding 4` (fails today: 5 rebuilds for 5 simultaneous searches, expected 1).

**Proposed fix (small, same change as 5).** Take the per-club lock *before* building, then re-check whether another search has already brought the index up to date, and skip the rebuild if so.

### 5. A slow rebuild can briefly put back a page that was just unpublished (Low)

**Where:** `src/search/fresh.ts:36-60`.

**What's wrong.** Order of events the test recreates:

1. Search 1 starts a rebuild and reads the club's content while page P is published.
2. The editor unpublishes P.
3. Search 2 rebuilds the index without P.
4. Search 1 finishes last and writes its older copy, with P, over the newer one. It also moves the "built at" counter backwards.

The next search notices the counter is behind and rebuilds again, so the stale copy lasts only until then. But search 1's own results, and anything that reads the index in between, include P after the editor unpublished it.

**How an attacker would use it.** Hard to aim: it needs a search running at the very moment of an unpublish, and the page was public seconds earlier. Low. It does break "unpublished content is never found", so it is worth fixing with finding 4.

**Test:** `finding 5` (fails today: the unpublished page is back in the index).

**Proposed fix (small, same change as 4).** Under the lock, never write an index older than the one already there: if `built_changes` in `search_state` is already at or beyond this rebuild's count, skip the write.

---

## Checked and fine

- **Every query names one club.** Every raw SQL statement in scope filters on `tenant_id = $club`, only wraps an inner query that does, or (the rebuild lock) is keyed by the club: `query.ts` (`matching`, `countKinds`, `suggestion`, results, grouped, when-counts), `answers.ts` (`pageFacts`, `personAnswer`), `fresh.ts` (state read, delete, insert, state write), `hooks.ts` (change count). The club ID always comes from the site's resolved domain or preview slug (`suggest.ts:20`, `load.ts:74`), never from the visitor's input. The existing isolation tests (`tests/int/isolation.int.spec.ts:425-500`) cover results. I added a guard that "Did you mean" never offers another club's words.
- **SQL injection: none.** Every value goes through Drizzle's `sql` tag as a separate parameter. `sql.raw` isn't used in scope, and `tests/unit/raw-sql.spec.ts` enforces this repo-wide. The full-text query is built from words limited to letters and numbers (`words.ts:9-15`), then passed as a parameter to `to_tsquery`. I tried quotes, `OR 1=1`, text-search operators (`| ! & ( :*`), unusual Unicode numbers and letters (½ ² ⅻ ١٢٣ 𝟘 ﬁ) and 5,000-character input. None caused an error or changed the query (guard test). The regular expressions built from search words (`words.ts:27`, `answers.ts:149`) only ever contain letters and numbers, so a visitor can't make them slow.
- **Drafts are never indexed.** The index is built only from published pages (`PUBLISHED`), published news and events, and the people, documents and courses that published pages show, each loaded with the club's ID (`build.ts:84-104`, `src/site/blocks/resolve.ts:71,132,271,284`). I added a guard test: a draft edit saved to an already-published page can't be found or suggested. Payload keeps the published version as the live record.
- **The index stays fresh when content changes.** Every collection whose content search uses (pages, news, events, staff, documents, courses, media) adds one to the club's change count in the same database transaction as the save (`hooks.ts`), including moving a record between clubs. Course status and opening hours are read live, not from the index.
- **Visitor-controlled options are allow-listed and capped.** Kind, when and sort come from fixed lists (`load.ts:39-45`, `query.ts:184`). Page numbers are capped at 50 and results per page at 100 (`load.ts:44`, `query.ts:192`). Searches are cut to 100 characters and 8 words (`words.ts`).
- **What leaves the server.** The header panel's data never includes email addresses or page text (`panelData.ts:29-43,55`). Responses are `no-store` and `noindex`. Person answers show only what the Team block already shows on the club's site.
- **The rate limiter's SQL** is a single parameterised upsert per request, so it is safe when several servers count at the same time (existing tests). It stores only a keyed, daily-changing hash of the address. It is checked before any search work on both the panel route (`suggest.ts:19`) and the results page (`load.ts:77`).
- **Preview search** (`/preview/[club]/search/suggest`) returns "not found" in production unless the visitor is a signed-in editor allowed to see that club (`src/site/resolveSite.ts:97-105`).
- **The website's limited database account** (`golf_app`) can use the two search tables, and needs nothing beyond that. Already tested (`search.int.spec.ts:204`).

## Not checked

- The Vercel Firewall rule for search (dashboard setting, not in the repo): whether it groups IPv6 addresses by network (relevant to finding 3).
- Real Neon timings. The timings above are from a laptop. Neon's smallest compute will be slower.
- Caching of the `/search` page itself. It uses request headers, so it is rendered per request, but the cache audit owns that.

## Checks run

Local only, against a separate test database (`golf_test_search`) so the other audit sessions weren't disturbed.

- `tests/int/audit-search-sql.int.spec.ts`: 3 passed, 5 expected failures, the same on 3 runs in a row. With `it.fails` removed, each of the 5 fails for the reason described above.
- `corepack pnpm test` (full suite, including the club-separation tests): 59 files, 599 passed, 5 expected failures (the findings above), 0 failed.
- `corepack pnpm typecheck`: passed. ESLint and Prettier on the new test file: passed.
