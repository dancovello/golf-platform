# Security audit: cron and background jobs

**Date:** 22 October 2026 · **Commit reviewed:** `b45c7cf` (top of the stacked PRs #145–#155, branch `docs/pentest-scope-review-list`) · **Job 8** of the security programme · **Reviewer:** Claude, acting as an application security reviewer new to the codebase.

## Summary for Dan

**Nothing critical or high.** No one outside can start a job, and none of the jobs can let one club see or change another club's data. That was the top risk, and it holds.

| # | Finding | Severity |
|---|---|---|
| CRON-1 | The "safety brake" on deleting photo files doesn't stop. It still deletes 200 files a night and only writes a log line | **Medium** |
| CRON-2 | If the nightly clean-up fails, the scheduler is told "ok" and no alert is sent | **Low** |
| CRON-3 | The live canary doesn't try three obvious ways in (the club-switcher cookie, listing clubs, listing accounts) | **Low** |
| CRON-4 | Anyone who knows the canary's email address can keep it locked out | **Info** (a setup choice, no code change) |

Each real finding (CRON-1 to CRON-3) has a test that proves it. The tests are marked as known failures (`it.fails`), so they pass today and don't block merging. When a fix lands, its test flips: change `it.fails` to `it`.

- `tests/int/audit-cron-jobs.int.spec.ts`: CRON-1, CRON-2
- `tests/unit/audit-cron-canary.spec.ts`: CRON-3

**Fixed on 23 October 2026** (Dan approved all four): CRON-1 to CRON-3 in the fix PR stacked on this audit, CRON-4 as a setup note in `docs/operations/canary.md`. The R2 "undelete" window from CRON-1 is optional and left for Dan (a Cloudflare setting that may cost a little).

## What was reviewed

| Area | Files |
|---|---|
| Job queue set-up | `src/privacy/jobs.ts`, `src/payload.config.ts` (lines 73–74) |
| Nightly clean-up | `src/privacy/cleanUp.ts`, `src/security/rateLimit.ts` (`deleteOldCounts`), `src/media/folders.ts`, `src/media/storage.ts` |
| Scheduler entry points | `src/app/(frontend)/cron/clean-up/route.ts`, `src/app/(frontend)/cron/canary/route.ts`, `vercel.json` |
| Canary | `src/canary/probe.ts`, `src/canary/targets.ts`, `src/canary/setup.ts`, `docs/operations/canary.md` |
| Payload's own job endpoints | `node_modules/payload/dist/queues/endpoints/run.js`, `handleSchedules.js`, `queues/config/collection.js` (Payload 3.90.2) |
| Context | `docs/architecture/decisions.md` (11 Oct storage, clean-up, canary entries), `.github/workflows/release.yml`, `docs/operations/restore-runbook.md`, `src/collections/Users.ts` (login lockout) |
| Existing tests | `tests/int/cleanup.int.spec.ts`, `tests/int/canary.int.spec.ts` |

Checklist used: `docs/operations/security-checks.md`, mainly items 1 (club separation), 7 (secrets) and 11 (retention promises). The project's `infosec-review` skill is written for a different stack (Go, Clerk), so it wasn't used.

## Findings

### CRON-1 · Medium · The file-deletion brake doesn't brake

**Where:** `src/privacy/cleanUp.ts:121–140` (`deleteOrphanUploads`).

**What's wrong:** Each night, the clean-up lists every stored photo and document file. It then deletes any file that no database record points at. The code comment says a limit of 200 is "a safety brake … a person should look first". But when more than 200 files look unused, the code still deletes the first 200, then writes one error line to the server log. Nobody watches that log, and it doesn't go to Sentry. The next night it deletes another 200, and so on.

**When it matters:** this isn't something an outsider can start. It's an accident waiting to happen. If production ever runs against the wrong database, or a half-restored or empty one (the very case the comment describes), every club's photos and documents look "unused". The clean-up then removes 200 a night, across all clubs, until someone notices. Stored files are **not backed up** (the backups hold only the database: `docs/operations/restore-runbook.md`), so deleted files are gone for good.

**Proof:** `tests/int/audit-cron-jobs.int.spec.ts`, "removes nothing when more files look unused than the nightly limit". It puts 3 unused files in storage, with a limit of 1. Today 1 is deleted, so the test's "0 deleted" expectation fails.

**Proposed fix (small):** if more files than the limit look unused, delete **none** and send a Sentry alert instead of a log line. Update the existing test "stops at the nightly limit…" in `tests/int/cleanup.int.spec.ts`, which currently asserts the old behaviour. Optional extra safety: turn on object versioning or a lifecycle "undelete" window on the production R2 bucket. That's a Cloudflare setting, so it needs your approval and may have a small cost.

### CRON-2 · Low · A failed clean-up looks like a success

**Where:** `src/app/(frontend)/cron/clean-up/route.ts:25–27`, `src/privacy/jobs.ts:25–28`.

**What's wrong:** the route queues the clean-up and runs it. If the clean-up throws an error (database down, storage settings wrong), Payload's job queue catches it and marks the job for a retry. The route still answers `200 {"ok":true}`. Vercel's cron log shows a success, and Sentry hears nothing. The retry only happens when the route is called again the next night.

**Why it matters:** the privacy policy promises enquiries are deleted 12 months after they're handled (`src/site/privacy/policy.ts`, `RETENTION.enquiries`). If the clean-up kept failing, that promise would quietly stop being kept, and no one would know. It's a UK GDPR storage-limitation issue, not a breach.

**Proof:** `tests/int/audit-cron-jobs.int.spec.ts`, "doesn't answer 'ok' when the clean-up fails". It breaks the storage settings on "production" and calls the route with the right secret. The route answers 200, so the test's 500 expectation fails. The test log shows the job failing with "Missing required environment variable: MEDIA_S3_BUCKET".

**Proposed fix (small):** after `payload.jobs.run`, check whether the clean-up job finished. If it didn't, report it to Sentry and answer 500, so the failure shows in both Vercel and Sentry.

### CRON-3 · Low · The canary skips three obvious ways in

**Where:** `src/canary/probe.ts:64–91`.

**What's wrong:** the hourly canary signs in as hidden club A's editor and tries to reach hidden club B. It never tries:
1. **the club-switcher cookie** (`payload-tenant=<club B>`). This is the multi-tenant plugin's own way of picking which club you're working in, so it's the first thing an attacker would tamper with;
2. **listing the clubs** (`/api/tenants`). Club editors must not even learn that other clubs exist (CLAUDE.md, non-negotiable 2). The canary only asks for club B by ID;
3. **listing accounts** (`/api/users`), which would reveal club B's editors.

These routes are protected today: the main isolation test suite covers them, and the tenancy audit is checking them separately. The gap is in the canary. If a future change opened one of these doors on production, the canary wouldn't notice.

**Proof:** `tests/unit/audit-cron-canary.spec.ts` runs the canary against a pretend site and records what it tries. None of the three attempts appear.

**Proposed fix (small):** add the three attempts to `probeAsCanaryA`, and add one marked account to canary club B in `src/canary/setup.ts`, so a leak of it can be recognised. Production canary clubs don't exist yet, so no production data changes.

### CRON-4 · Info · The canary account can be locked out by someone who knows its email

**Where:** `src/collections/Users.ts:140–144` (5 wrong passwords lock an account for 10 minutes), `docs/operations/canary.md` ("Give canary A's editor an email inbox you control").

**What's wrong:** if someone learns the canary's email address, they can keep it locked out with a few wrong passwords every 10 minutes. The canary then can't sign in, so it checks nothing. It does send a "couldn't run" alert every hour, so this isn't silent. But it's noise, and someone actually exploiting a leak would want the canary switched off first.

**Suggested fix (no code):** when you create the canary clubs, use an email address nobody could guess, such as a random alias (for example `canary-7f3k…@` your own domain), and don't use it anywhere else. One line in `docs/operations/canary.md`. No test, because the code is behaving as designed.

## Checked and fine

- **No one outside can start a job.** Both `/cron/*` routes answer only with Vercel's `CRON_SECRET`, compared in constant time (`timingSafeEqual`, with a length check first). Without the secret, or with no secret configured, they answer "Page not found" (`clean-up/route.ts:10–16, 23`; `canary/route.ts:13–19, 29`). The existing tests cover the missing, empty and wrong secret cases.
- **Payload's own job endpoints are locked.** `/api/payload-jobs/run` and `/api/payload-jobs/handle-schedules` both check `jobs.access.run` (Payload source, `queues/endpoints/run.js`, `handleSchedules.js`). This project sets it, and `queue` and `cancel` too, to "super-admin with two-factor code entered" (`src/privacy/jobs.ts:10–13`), and a test checks that. Club editors and visitors get "unauthorised". `handle-schedules` has nothing to do anyway: no task has a schedule.
- **The job records themselves are closed.** Payload's `payload-jobs` collection denies create, read, update and delete to everyone and is hidden in the admin (Payload `queues/config/collection.js`). GraphQL is off. Finished jobs are deleted (`deleteJobOnComplete`).
- **The enquiry clean-up can't be steered by a club.** It deletes by date alone, across all clubs, with no input from the request (`cleanUp.ts:38–72`). The "marked handled on" date is set by the server and editors can't type it (existing test). An editor could only bring forward deletion of their own club's enquiries, which they can delete anyway.
- **The file clean-up can't delete another club's files because of its own logic.** It compares against every photo and document record in all clubs (`cleanUp.ts:75–90`). It only touches folders in the platform's exact random-folder format (`folders.ts:6–7`), never `marketing-media/` or anything else in the bucket. It leaves files under a day old alone. Its only real risk is CRON-1.
- **File clean-up runs on production only.** Staging is deployed as a Vercel custom environment (`release.yml:167`, `--target=staging`), which Vercel reports as `preview`, not `production`. So staging never deletes files that belong to pull-request previews sharing its bucket (`cleanUp.ts:150`). Vercel also runs cron schedules on production only.
- **Rate-limit tidy-up** uses a parameterised query (`rateLimit.ts:89–95`). No injection is possible.
- **The canary only reaches its own two clubs.** `canaryTargets` reads only canary club B's records, by slug (`targets.ts:12–33`). The probe acts only as canary A's editor over the normal web address, with no special powers. Its credentials go only to `ADMIN_URL` (set by you) or the address Vercel's scheduler called. They never appear in error messages, logs or responses (`canary/route.ts:41–62`, `probe.ts:44–46`). It signs out afterwards. Record IDs are random UUIDs, so its "did club B's ID appear?" check can't misfire on short numbers.
- **The canary clubs can never get a web address** (existing test), so club B's marked content can't appear on a public club site. On staging, previews are open by design, and `docs/operations/canary.md` already says the preview check will report there.

## Not checked

- **Live behaviour on staging or production.** By the rules of this audit, nothing was sent to a live site. Vercel's handling of `CRON_SECRET` and of custom-environment `VERCEL_ENV` is taken from Vercel's documented behaviour and the release workflow, not observed.
- **Whether `CRON_SECRET` is set, and how long it is.** It's a Vercel setting. `decisions.md` asks for "any long random value"; please make it at least 32 random characters.
- **Club separation in the collections the canary probes.** That belongs to the tenancy and access audits running alongside this one.

## Checks run

- New tests, plus the existing clean-up and canary tests (`tests/int/audit-cron-jobs.int.spec.ts`, `tests/unit/audit-cron-canary.spec.ts`, `tests/int/cleanup.int.spec.ts`, `tests/int/canary.int.spec.ts`): **12 passed, 3 expected failures**. Each of the 3 was also run once without the "expected failure" mark, to confirm it fails for the stated reason. Run against a separate local database (`golf_test_cron`) and storage bucket, so other audit sessions running at the same time weren't disturbed.
- `pnpm typecheck`: passed. ESLint and Prettier on the new test files: passed.
- The full test suite was **not** run in this session.
