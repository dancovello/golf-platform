# Production readiness audit, 10 Nov 2026

Read-only review by Claude. No code was changed.

## How much was actually reviewed (read this first)

The repository has 1,191 tracked files. This was a **targeted review, not a line-by-line read of everything**. What was read: `next.config.ts`, `vercel.json`, `src/proxy.ts`, `src/payload.config.ts`, the access helpers, the rate-limit code, every API/cron route handler listed below, the contact-form submit path, Turnstile, the SVG checker, the search query layer, the cache-clearing hooks, `release.yml`, the workflow action pinning and timeouts, the restore-drill log, the monitoring doc and the existing audit-fix plan. `pnpm audit --prod` was run. **Not read in full:** the 18 block renderers, the 161 migrations, the marketing site, the import tool, most of `ClubSettings.ts`, the Docker files, and the test code itself. **No tests, build or browser checks were run**, so nothing here says anything passes. Anything marked "needs checking" is a suspicion, not a confirmed fault.

Not applicable: there are **no AI/LLM features** in the code (no Anthropic/OpenAI references anywhere in `src`, `scripts` or `package.json`), so the AI section is skipped. There is no Kubernetes or Nginx; hosting is Vercel.

A previous audit (9 Nov) and its fix plan (`docs/plans/audit-fix-plan-2026-11-09.md`) already cover many items. Where this report repeats one, it says so, because the fix has not landed yet.

---

## Findings

### 🔴 F1. No backup has ever been restored
- **File:** `docs/operations/restore-drills.md`; `.github/workflows/backup.yml`
- **Category:** Disaster recovery
- **Problem:** The restore-drill table has headers and no rows. Backups are encrypted and run nightly, but nobody has proved one can be decrypted and loaded, or how long it takes. The plan lists this as step 6, "Not started", and it needs the devops friend and a decryption key with one holder.
- **Evidence:** The table in `restore-drills.md` is empty. Backups failed silently from 6 Nov (Actions minutes ran out) until found on 9 Nov.
- **Impact:** If the database is lost or damaged, the real recovery time and whether recovery works at all are unknown. Neon's free tier has no point-in-time restore, so the last nightly backup is the only fallback: up to 24 hours of club edits and enquiries lost.
- **Recommended fix:** Do the drill before the first paying club. Store the decryption key in two places. Add an alert when the nightly backup has not succeeded in 26 hours (today a failure only shows up in GitHub).

### 🔴 F2. The release goes live before it is checked, and cannot roll back
- **File:** `.github/workflows/release.yml` (deploy job, lines ~160-200); `src/app/(frontend)/health/route.ts`
- **Category:** Release safety
- **Problem:** Three things combine. (1) `vercel deploy --target=production` has no `--skip-domain`, so the new version takes the production address as soon as it builds, before the health check. (2) The database migration has already run by then. (3) `/health` returns a fixed `{"status":"ok"}` without touching the database, so it passes even when the site cannot reach its data. There is no automatic rollback step. A failure opens an issue and stops.
- **Evidence:** `health/route.ts` is 4 lines and returns `ok` unconditionally. `release.yml` ends the deploy job with `exit 1` on failure and nothing else.
- **Impact:** A bad release can serve broken pages to every club while the migration has already changed the database, so a quick "put the old version back" can also fail. Plan steps 3 and 4 cover this but are not started.
- **Recommended fix:** Deploy with `--skip-domain`, check the new deployment's own address with a health check that runs `SELECT 1` and one tenant lookup, then promote it (`vercel promote`). Keep migrations backward compatible for one release so the previous version still runs.

### 🟠 F3. Outages are detected slowly, and by one person
- **File:** `docs/operations/monitoring.md`; `vercel.json`
- **Category:** Alerting
- **Problem:** The uptime monitor checks every 5 minutes and needs 3 failures, so about 15 minutes before anything fires. Because `/health` does not test the database (F2), a database outage is only noticed by the hourly `database-check` cron, so up to an hour. Alerts are one email to one person. The doc admits the uptime alert "has not been tested with a real outage".
- **Impact:** A Saturday-morning outage during a club's competition entry period could run for an hour or more with nobody aware.
- **Recommended fix:** Make `/health` check the database (shared with F2), test the uptime alert once on purpose, and add a second recipient or a phone push for uptime alerts.

### 🟠 F4. Neon and Resend free-plan limits are launch limits
- **File:** `src/security/rateLimit.ts` (`WEBSITE_FORM_EMAILS`); plan Q1 and Q2
- **Category:** Capacity and cost
- **Problem:** Email is capped at 100 a day across every club (70 for forms, 30 held for resets and invites). Past that, club contact messages are saved but not emailed. The database has no point-in-time restore. Both upgrades are deferred "until 2 paying clubs".
- **Impact:** On a busy day a club can miss enquiry emails without noticing (an admin column now shows it, but only if someone looks). Cost to fix is small (about $20 a month for email), so deferring it is a business choice, not a technical one.
- **Recommended fix:** Treat "first paying club" as the trigger for both upgrades, not "second".

### 🟠 F5. Every page-search keystroke writes to the database
- **File:** `src/security/limitRequest.ts`, `src/site/routes/suggest.ts:19`, `src/site/search/load.ts:77`
- **Category:** Scalability
- **Problem:** The rate limiter does an `INSERT ... ON CONFLICT DO UPDATE` on every search and every type-ahead suggestion, on the same database the sites read from. Writes cannot be served from a cache or a read replica.
- **Evidence:** `allowRequest` runs one upsert per call; the typed-suggestion route calls it each time. Pool size is 5 per instance (`poolGuard.ts`).
- **Impact:** Fine at a handful of clubs. With dozens of clubs and a crawler or a busy tournament week, this becomes the first thing to saturate the database connection pool. It also means a search flood costs database writes, not just reads.
- **Recommended fix:** Count in memory per instance with a lower fixed cap, and use the database only for sign-in and form limits. Or use Vercel Firewall's built-in rate limit for search. Load-test first (plan step 15, not started).

### 🟠 F6. The hourly club-site check can time out as clubs grow
- **File:** `src/app/(frontend)/cron/club-sites/route.ts`
- **Category:** Reliability
- **Problem:** The function has a 60 second limit. It checks 5 clubs at a time with a 10 second timeout each. 30 clubs that are all down take 6 batches of 10 seconds, which is the whole 60 seconds, and a 31st club tips it over. The failure is the moment the check matters most (many clubs down at once).
- **Impact:** Silent loss of the alert in a widespread outage.
- **Recommended fix:** Raise the batch size to 15-20 and lower the per-site timeout to 5 seconds, or split by club count across two cron runs.

### 🟠 F7. Tenant isolation is enforced only in application code
- **File:** `src/search/query.ts` (raw SQL with `WHERE tenant_id = ...`); `docs/plans/postgres-row-level-security-spike.md`
- **Category:** Multi-tenant isolation
- **Problem:** The database does not stop one club's rows reaching another. Everything depends on Payload access functions and on each raw SQL query remembering its tenant filter. The code has good guard tests (a raw-SQL guard, an access guard, a two-club suite), and a row-level-security spike exists, but it was not adopted.
- **Impact:** One future query written without the filter, or a bug in a plugin upgrade, leaks a club's data. The test suite catches known paths, not new ones. This is the highest-consequence failure for a multi-club product (privacy, reputation).
- **Recommended fix:** Adopt the row-level-security spike for the tables that hold club content, at least for read, or keep the current approach but run the isolation suite as a required status on every PR (it appears to be already; confirm it is a required check, which `dan-pending-setup` lists as unfinished).

### 🟠 F8. One super-admin account, and no tested way back in
- **File:** `src/auth/superAdminTwoFactor.ts`; plan step 10, Q4
- **Category:** Access / single point of failure
- **Problem:** Everything administrative (clubs, accounts, restores) is one person's account with two-factor. The emergency second account is deferred to Dan's decision. The reset path is a local script (`reset-two-factor.ts`), which needs production database access.
- **Impact:** Lost phone plus an urgent club problem equals a long lockout. The same account being compromised is a total compromise.
- **Recommended fix:** Create the emergency account (kept offline) and write down a tested lockout recovery.

### 🟡 F9. Rate limiter treats missing visitor addresses as one shared bucket
- **File:** `src/security/rateLimit.ts:208` (`'unknown'`)
- **Category:** Robustness
- **Problem:** If neither `x-real-ip` nor `x-forwarded-for` is present, all such visitors share the key `unknown`. On Vercel the header is always set, so this only matters if hosting or proxying changes (for example if Cloudflare is put in front without `TRUSTED_PROXY=cloudflare`, all visitors would share the Cloudflare edge addresses). Needs checking when Cloudflare is added.
- **Recommended fix:** Add a test and an alert for a high count on the `unknown` key.

### 🟡 F10. Dependency advisories (transitive, low exposure)
- **File:** `pnpm-lock.yaml`
- **Category:** Supply chain
- **Evidence:** `pnpm audit --prod` reports 4 (1 low, 3 moderate): `esbuild` via `drizzle-kit`, `glob` and `minimatch` via the Sentry bundler plugin, and `deepmerge` via Payload (no patched version). All are build-time or deep inside Payload; none is a request-path exposure as far as the paths show.
- **Recommended fix:** Keep the `osv-scanner.toml` exceptions dated (as done in step 1), and re-check on each Payload upgrade.

### 🟡 F11. Nightly clean-up depends on one 120 second function
- **File:** `src/app/(frontend)/cron/clean-up/route.ts`
- **Category:** Reliability
- **Problem:** Enquiry retention, rate-limit pruning and the orphan-file sweep run in one invocation capped at 120 seconds. The sweep is now time-budgeted (PR #322), which is good, but the retention promise in the privacy policy depends on it finishing most nights. A failure reports to Sentry but is not retried until tomorrow night.
- **Recommended fix:** Add an alert when the last successful run is older than 36 hours.

### 🟡 F12. No load test exists
- **Category:** Testing / scalability
- **Problem:** Plan step 15 is not started. The 189 test files are strong on isolation and behaviour, but there is no evidence of how the site behaves under concurrent traffic, which makes every number in the scalability section below an estimate.

---

## Executive summary

**Is it production ready?** Not yet, but close. Few early-stage products have this much security work: two-club isolation tests, shared rate limits, content security policy, SVG scanning, signed form tokens, encrypted backups, pinned CI actions, and an audit log. I found no easy way in.

**Can it safely serve paying customers today?** Not safely. The reason is **recovery and release safety, not hacking**: untested restores (F1), a release that goes live before it is checked and cannot roll back (F2), and slow, single-person alerting (F3).

**Biggest business risks:** (1) losing a day of a club's data with no proven way to restore; (2) a bad release taking every club down at once; (3) one leaked row between clubs, which the application-level design makes possible only through a future mistake.

## Production readiness scorecard

| Category | Score /10 | Notes |
|---|---|---|
| Security | 8 | Strong. Isolation is app-level only (F7); one super-admin (F8). |
| Backend architecture | 7 | Clean separation. Write per search request (F5). |
| Frontend | 7 | Not audited in depth; accessibility tests and axe exist. |
| Database | 6 | No point-in-time restore on the free plan; pool of 5 per instance. |
| Infrastructure | 5 | Release has no rollback; liveness-only health (F2). |
| Reliability | 5 | Backups never restored (F1); cron time limits (F6, F11). |
| Scalability | 5 | Unmeasured; no load test (F12). |
| Testing | 8 | 189 test files, isolation gate. No load or restore tests. |
| Observability | 6 | Sentry and uptime exist; slow and single-recipient (F3). |
| AI safety | n/a | No AI features. |

## Security risk matrix

| ID | Risk | Severity |
|---|---|---|
| F7 | Club data separation depends only on application code | 🟠 |
| F8 | Single super-admin account | 🟠 |
| F9 | Shared `unknown` rate-limit bucket if proxying changes | 🟡 |
| F10 | Transitive dependency advisories | 🟡 |

No critical security vulnerabilities (injection, auth bypass, secrets in the repo) were found in the files read. That is not a clean bill for the unread files.

## Technical debt matrix

1. Rate limiting through the main database (F5)
2. Application-only tenant isolation (F7)
3. Cron jobs sized for a handful of clubs (F6, F11)
4. Hand-set alerting to one inbox (F3)
5. `ClubSettings.ts` at 1,090 lines in one file (maintainability)

## Scalability assessment (estimates, not measured)

Users here means visitors to club sites plus editors.

| Scale | Likely state |
|---|---|
| 100 | Fine. |
| 1,000 | Fine. Email cap (100 a day) is the first thing hit on a busy day (F4). |
| 10,000 | Search writes (F5) and the 5-connection pool per instance start to show; club-site check may time out (F6). |
| 100,000 | Single database and single region need read caching and a larger Neon plan; search limiter must change. |
| 1,000,000 | Not a realistic target for this design without re-architecture. |

## Missing systems report (priority order)

1. A proven restore (F1)
2. Deploy-then-promote with automatic rollback (F2)
3. A health check that touches the database (F2, F3)
4. Second alert recipient and a tested outage alert (F3)
5. Backup-failed and clean-up-late alerts (F1, F11)
6. Load test (F12)
7. Emergency super-admin account (F8)
8. Row-level security or an equivalent database-level guard (F7)
9. Feature flags (none found; releases are all-or-nothing)

## Top fixes by return on effort

1. Make `/health` check the database (small)
2. Test the uptime alert once and add a second recipient (small)
3. Backup and clean-up "too old" alerts (small)
4. Deploy with `--skip-domain`, then promote after the check (small to medium)
5. First restore drill (half a day, needs the devops friend)
6. Club-site check batch size and timeout (small)
7. Move first paid upgrades to "first club" (decision)
8. Emergency super-admin (small, needs a decision)
9. Load test on staging (small)
10. Alert on the `unknown` rate-limit key (small)

## Top production blockers

1. F1 restore never practised
2. F2 release goes live before its check, no rollback
3. F3 health check that cannot see a database failure
4. F4 email and restore limits of the free plans, once real clubs depend on them
5. Plan step 16, the legal and ICO jobs (not code, but they block launch)

## 30-day plan

- **Week 1:** Database-aware health check; deploy-then-promote with rollback; test the outage alert; second recipient.
- **Week 2:** Restore drill with the devops friend; second decryption key holder; backup-late alert.
- **Week 3:** Load test on staging; decide on search limiter and club-site check changes; emergency super-admin.
- **Week 4:** Decide row-level security; upgrade Resend and Neon with the first paying club; re-run this audit on the unread areas (block renderers, marketing site, import tool, Docker).

## Final verdict

**HIGH RISK for paying customers today; fixable in about a month.** The code and the isolation tests are well above the usual standard. What puts it below "ready with minor changes" is evidence, not code: F1 (an empty restore log), F2 (the deploy workflow as written), and F3 (a health check that always says ok). Three small-to-medium pieces of work, plus one half-day drill, would move this to "ready with minor changes".
