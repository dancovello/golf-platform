# Performance: club page speed

How fast club pages answer, measured before changing anything (job 1 from the 21 Oct grilling). Newest results first.

## How it's measured

- **Database queries per page view.** On staging and previews (never production), every club page view writes one line to the server log after it's sent:
  `[db-timing] /preview/heathcote-demo/news queries=16 db_ms=92 total_ms=213`
  - `queries`: how many database queries the page made.
  - `db_ms`: their times added together. Some run at the same time, so this can be more than the page took.
  - `total_ms`: from the start of the page to the end of its last part.
  - In Vercel: the staging project → Logs, search for `db-timing`. Locally: set `DB_TIMING=1`.
  - Code: `src/monitoring/dbTiming.ts`, started from `src/site/resolveSite.ts`. Tested in `tests/unit/db-timing.spec.ts`.
- **Time to first byte (TTFB)** for five page types on the demo club: home, a content page (`/visitors`), the news list, events and a search. `pnpm measure-speed` asks for each one once to warm up, then 20 times, one at a time, and prints the median (p50) and the slowest 1 in 20 (p95).
  - Staging is behind Vercel's login, so the script needs `VERCEL_PROTECTION_BYPASS` (Vercel → the project → Settings → Deployment Protection → Protection Bypass for Automation) and `SPEED_BASE_URL` (the staging address), both in your git-ignored `.env`.
  - Run from Dan's computer in the UK, so the numbers are what a UK visitor sees.

**Why not a Server-Timing header?** Next.js pages can't set response headers, and the queries are still running when the first bytes are sent. A log line written after the page is finished counts every query.

## 2026-10-22: baseline, on a developer's computer

Local server and local database, so each query takes about 5 ms. **The query counts are what carry over to staging**; the times don't.

| Page | Queries per view | DB time (ms, summed) | TTFB p50 (ms) | TTFB p95 (ms) |
|---|---|---|---|---|
| Home page | 30 | 260–320 | 347 | 403 |
| Content page (`/visitors`) | 20 | 110–135 | 293 | 306 |
| News list | 16 | 70–90 | 224 | 228 |
| Events | 18 | 55–95 | 230 | 233 |
| Search (`?q=lessons`) | 18–19 | 80–100 | 195 | 280 |

(5 runs each, development server, demo club Heathcote.)

**What it means:** on staging today, functions run in Washington (Vercel's default) and the database is in London. Every query is a round trip across the Atlantic, about 75–80 ms. Even with some queries running at the same time, 20–30 per page adds up to well over a second. Moving functions to London (job 1, part B) should cut each round trip to a few milliseconds. Caching (job 5) then removes most of the queries.

## Staging, before and after London

To fill in. **Before:** run `pnpm measure-speed` against staging once part A (#145) is live there and part B isn't. **After:** run it again once part B (`regions: ["lhr1"]`, #146 or later) is live on staging. Add the `db-timing` lines from Vercel's logs for the same pages.

| Page | Before p50 / p95 (ms) | After p50 / p95 (ms) |
|---|---|---|
| Home page | | |
| Content page | | |
| News list | | |
| Events | | |
| Search | | |
