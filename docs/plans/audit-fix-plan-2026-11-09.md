# Audit fix plan (9 Nov 2026)

The plan for fixing everything found in the production readiness audit of 9 November 2026. Finding codes (C1, M2, m6 …) are the audit's: C = critical, M = major, m = minor.

**How we work through it:** one step at a time, in order. Claude plans each step in more detail first, Dan approves, then Claude builds it on its own branch and opens a draft pull request. Dan's own jobs are batched so they can be done in one sitting. A step is done when its "Done when" line is true. Update the status column in this file in the same pull request as the step.

**Nothing here is decided beyond what the audit found.** Where a step needs a choice or costs money, it says so, and Claude asks before acting.

## Decisions Dan needs to make before or during the plan

| # | Decision | Needed by | Notes |
|---|---|---|---|
| Q1 | Upgrade Resend to a paid plan? | Deferred until 2 paying clubs (Dan, 9 Nov) | Free: 100 emails a day, 3,000 a month, across every club. Pro: about $20 a month for 50,000, no daily cap (third-party pages, 9 Nov; confirm on resend.com/pricing) |
| Q2 | Upgrade Neon to the Launch plan? | Deferred until 2 paying clubs (Dan, 9 Nov) | Already on the launch checklist (D8). Gives 7-day point-in-time restore. Sources disagree: pay-as-you-go with no base fee (Neon's newer pages), or $19 a month (older pages). Confirm on Neon's billing page |
| Q3 | How to keep a second copy of photos and documents | Step 5 | Claude researches what Cloudflare R2 offers first. The free-leaning option is a nightly copy to a second bucket |
| Q4 | A second, emergency super-admin account, kept offline | Step 10 | Who holds it, and where the details are kept |
| Q5 | What the audit log records, and for how long | Step 12 | Claude proposes a short list |
| Q6 | When the devops friend can do the restore drill | Step 6 | About half a day together |
| Q7 | Repository public or private | Step 0, now | See step 0: private runs out of free Actions minutes (backups stop); public needs the release check relaxed |

## The steps

| Step | What | Fixes | Who | Size | Status |
|---|---|---|---|---|---|
| 0 | Dan's dashboard jobs, in one sitting | C3, M11 (C4, M3 deferred) | 👤 Dan, Claude writes the checklist | 1 hour | Done 10 Nov (database pooling check moves to step 9) |
| 1 | Renew or fix the dependency-scan exceptions (two expire 10 Nov) | m1 | 🔨 Claude | Small | Done 10 Nov (#307) |
| 2 | Spam protection on the demo booking form | M2 | 🔨 Claude | Small | PR open |
| 3 | A health check that proves the database answers, used by the release and the uptime monitor | M1, M7 | 🔨 Claude | Small | PR open (release uses it; the 5-minute monitor stays on `/health` to let Neon sleep) |
| 4 | Safer releases: automatic rollback when the new version fails its check | M1 | 🔨 Claude | Medium | PR open (production only; proved with a fake Vercel here, first real production release is the live test) |
| 5 | A second copy of club photos and documents; clean-up stops deleting for good | C2 | 🔨 Claude, 👤 Dan for Q3 | Medium | PR open |
| 6 | First restore drill, database and files | C1 | 👤 Dan + devops friend, Claude prepares | Half day | Not started |
| 7 | Monitoring each club's own address, and showing when an email alert wasn't sent | M7, M3 | 🔨 Claude, 👤 Dan adds monitors | Small | PR open |
| 8 | Switch on the admin's script protection | M4 (part 1) | 🔨 Claude | Small, then a watch week | PR open (see step 8) |
| 9 | Sign-in limit per address, written in code; small hardening | M5, m6, m8 | 🔨 Claude | Small | Done 10 Nov (#315) |
| 10 | Super-admin safety: session time limit, emergency account, incident plan | M13 | 🔨 Claude, 👤 Dan for Q4 | Small | Done 10 Nov (#316); the emergency second account is Dan's decision |
| 11 | Branded error pages | m2 | 🔨 Claude | Small | Done 10 Nov (#314) |
| 12 | Audit log: who changed what, when | M6 | 🔨 Claude, 👤 Dan for Q5 | Large | 12a PR open (accounts, sign-in, clubs, super-admin actions); 12b next (deleted club content) |
| 13 | Faster, cheaper site search | M9 | 🔨 Claude | Medium | PR open |
| 14 | Nightly clean-up that keeps working as clubs grow | M8 | 🔨 Claude | Medium | PR open |
| 15 | Load test against staging | Scalability | 🔨 Claude, 👤 Dan approves | Small | Not started |
| 16 | Dan's legal and business jobs | C5, m10 | 👤 Dan | Ongoing | Not started |
| 17 | Later, after the first clubs (v1.1) | M10, M4 (part 2), m3, m4, m5, m7, m9 | Both | Various | Not started |

Steps 0–6 and 16 (ICO) are the **launch blockers**: no paying club until they're done. Steps 7–11 should be done before the first paying club too, as they are small. Steps 12–15 within the first month. Step 17 can wait.

## Step details

### Step 0. Dan's dashboard jobs (C3, M11; C4 and M3 deferred)

**Found when checking GitHub on 9 Nov, late:**
- **The nightly backups have failed since 6 Nov.** GitHub refused to start them: "recent account payments have failed or your spending limit needs to be increased" (the Actions minutes ran out while the repository was private). The last good backup is from 5 Nov.
- **The 9 Nov production release (#303) did not go out.** The repository is public again, and the release stops at its "repository must be private" check. Production is still on the 5 Nov release (#265).
- The `release-staging` and `release-production` environments exist but hold no secrets and have no branch limits; all the keys are still repository-wide.
- **Decision needed first (Q7):** public or private. Private means the free 3,000 minutes run out again (October's pace was about 7,400 a month), and backups and releases stop with them. Public means anyone can read the code and the security notes in `docs/security/`, and the release check must be relaxed.

**Neon and Resend upgrades: deferred (Dan, 9 Nov)** until there are 2 paying clubs. Claude reminds Dan then. Until then, the newest restore point is the last nightly backup (up to a day of changes could be lost).

Original expected items:
- **GitHub (C3, launch checklist D4):** move the production secrets into the `release-production` environment, with Dan as required reviewer; delete the repo-wide copies.
- ~~**GitHub (M12):** make `browser-tests` and the tenant isolation check required before merging into `main`.~~ **Dan, 9 Nov: not doing this.** Instead, Claude keeps running the browser and isolation tests locally before saying a change is ready (as now), and the release PR is where a failure is caught.
- **Neon (C4, D8):** Launch plan, if Dan says yes to Q2.
- **Neon / Vercel (M11):** confirm production's database address is Neon's pooled one (it contains `-pooler`). Claude can check this with Dan without the password being shown.
- **Resend (M3):** paid plan, if Dan says yes to Q1.

**Done when:** each item is ticked, and Claude has checked the result where it can (for example, that the workflows still find their secrets on a staging release).

### Step 1. Dependency-scan exceptions (m1)
Two exceptions in `osv-scanner.toml` expire on 10 November and two on 16 November; after that the security scan fails every pull request. Claude checks whether fixed versions now exist; upgrades where they do, renews with a fresh reason where they don't.
**Done when:** the scan passes with no exception older than its review date.

### Step 2. Demo booking form spam protection (M2)
Give the booking form the same three checks the other two public forms already have: the hidden box only bots fill in, the "too fast to be a person" timer, and Cloudflare's "are you a person?" check (with its own name, so a check made for another form doesn't count). Tests for each.
**Done when:** a booking without a valid check is refused, and the browser tests still book a call.

### Step 3. Health check that reaches the database (M1, M7)
Today `/health` answers "ok" without touching the database, so a release with a broken database connection still counts as healthy. Add a check that runs one tiny database query with a short time limit, revealing nothing about clubs. The release workflow and the uptime monitor then use it. Keep the hourly database check's reasoning in mind (the database is allowed to sleep): Claude will propose how often the uptime monitor calls it, and what it costs, before changing anything.
**Done when:** a deployment that can't reach its database fails the release check (proved on a pull request preview or in a test).

### Step 4. Automatic rollback (M1)
If a new version fails its health check, put the previous version back automatically and open the usual issue. Also make the `migration-guard` check refuse a database change that removes or renames something the running version still uses, unless it's split over two releases (add first, remove later), so the short gap between "database changed" and "new code live" can't break club sites.
**Done when:** a staging release with a deliberately broken health check rolls itself back, and the guard's tests cover the two-release rule.

### Step 5. A second copy of photos and documents (C2)
**Decided by Dan, 10 Nov:** database backups are kept **7 days**, then deleted. The live photo bucket is **930 MB** (so the copy is inside Cloudflare's 10 GB free allowance).

- **Nightly copy (built, PR open):** `.github/workflows/media-backup.yml` copies every new file from `golf-platform-media-production` into `golf-platform-backups/media/production/`. A file removed from the live bucket is moved to `media/removed/`, and a lifecycle rule deletes it 7 days later (a file removed by mistake can be got back for a week). A safety brake stops the run, and opens a GitHub issue, if more than 200 files look removed or the live bucket looks empty.
- **The nightly clean-up stays as it is**: its existing brake (never more than 200 files a night) plus the copy is enough, so the "holding folder" idea is dropped.
- **Dan's jobs in Cloudflare and GitHub (after the PR is merged):**
  1. Create an R2 token with **Object Read only** on `golf-platform-media-production`, and save its key and secret in the `release-production` environment as `R2_MEDIA_READ_ACCESS_KEY_ID` and `R2_MEDIA_READ_SECRET_ACCESS_KEY`.
  2. On the bucket `golf-platform-backups` → Settings → Object lifecycle rules, add three rules: delete objects with prefix `production/` after 7 days, `staging/` after 7 days, and `media/removed/` after 7 days. **No rule on `media/production/`**: those are the live copies.
  3. Run the workflow once by hand and check it passes.
- **The privacy policy** says backups are deleted "within 35 days"; with 7 days that stays true, so it needs no change.

**Done when:** the nightly job has run green on real data, a removed test file is found under `media/removed/`, and the lifecycle rules are in place. Restoring from the copy is practised in step 6 (runbook section 7).

### Step 6. First restore drill (C1)
Dan and the devops friend follow `docs/operations/restore-runbook.md`; Claude prepares a short script for the day and adds a section for restoring files from step 5. Record the result, including how long it took, in `restore-drills.md`. Also: a second, safe place for the backup decryption key that Dan can reach without the devops friend.
**Done when:** a row is in `restore-drills.md` with every column filled, and the key has two holders.

### Step 7. Club address monitoring and missed email alerts (M7, M3)
Claude writes the steps for an uptime monitor per live club address (a real page, not just the admin), checking first whether Sentry's free plan allows enough monitors. In the admin, show a club when a message arrived but its email alert wasn't sent because the daily allowance ran out.
**Built 10 Nov, differently from planned:** Sentry's free plan has one uptime monitor (already used by the production admin), so each club's own address is checked by a free hourly job instead (`/cron/club-sites`, a Sentry issue per club that doesn't answer). The Enquiries list now shows an "Emailed to the club" column so a missed alert stands out; the message is always saved, and the club home screen already lists new messages.
**Done when:** each live club has a monitor, and a test shows the "alert not sent" note.

### Step 8. Admin script protection on (M4, part 1)
The admin's content security policy has been report-only since October. Check the reports, then switch it to enforced. Watch for a week for anything it blocks that it shouldn't.
**Found 10 Nov:** the reports were misleading, not the admin. While a policy is report-only, Next.js doesn't put the one-time code on the page's own scripts: production's login page had 0 of 20 script tags with a code, while the same build enforced locally had 20 of 20. So every script was reported (about 300 in Sentry). Enforced, no admin screen I tried gave a single violation (13 list and settings screens, the edit and create screens, the login screens), and the 98 existing admin browser tests pass. So the fix is the one-line switch, plus tests that the admin's own scripts carry the code.
**Done when:** the admin's policy is enforced and a week has passed with no real problem reports in Sentry (the "Security policy blocked" issue should stop growing; if it doesn't, read its newest events).

### Step 9. Sign-in limit in code, and small hardening (M5, m6, m8)
- A per-address limit on sign-in, password reset and two-factor code attempts, using the existing shared rate-limit table, so it doesn't depend only on a Vercel dashboard rule. Write the current Vercel Firewall rules into the docs.
- Preview links built from the admin's own configured address, not from a header the request carries (m6).
- Pin the one loosely versioned package (`three`) exactly (m8).
**Done when:** tests show the limit holds from one address, and the inventory test lists it.

### Step 10. Super-admin safety (M13)
- Super-admin sessions end after 12 hours, like editors' 8 (audit item H2).
- An emergency super-admin account, created by the script, its details kept offline (Q4).
- A one-page incident plan: who to call, what to switch off, how to tell clubs.
**Done when:** the time limit is tested and the incident plan is in `docs/operations/`.

### Step 11. Error pages (m2)
A plain, branded "something went wrong" page for club sites, the marketing site and demos, so a crash never shows the framework's default screen. Errors still go to Sentry.
**Done when:** a forced error on each kind of page shows the branded page.

### Step 12. Audit log (M6)
A record of sign-ins, account changes, deletions and anything a super-admin does: who, which club, what, when. Only the super-admin can read it; editors could later see their own club's. Claude plans this one in full before building (Q5), because it touches every collection and must keep to tenant isolation.
**Done when:** the agreed actions are recorded, the isolation suite covers the new table, and old entries are removed on the agreed schedule.

### Step 13. Faster, cheaper search (M9)
Rebuild a club's search index straight after a save rather than while a visitor waits; keep the "Did you mean" word list per club instead of rebuilding it on every search; add the database index the spelling-tolerance check needs.
**Measured 10 Nov** on a benchmark club (900 items, 1.9 MB of text): a normal search is about 10 to 15 ms in the database; "Did you mean" (only when nothing is found) was about **147 ms** and grows with the club's text. It now uses a per-club word list cached for 5 minutes: about 5 to 9 ms. The rebuild-on-first-search is left as designed (nothing rebuilds while editors type); its cost wasn't the worst, and rebuilding after every save would add database work.
**Done when:** the search tests pass and a timing comparison on staging shows the slow cases are faster.

### Step 14. Clean-up that scales (M8)
Work through the clubs in batches instead of loading every photo record and listing the whole storage bucket at once, so it stays inside its time limit as clubs are added.
**Done when:** a test with many clubs' worth of files finishes within the limit.

### Step 15. Load test (staging)
A short, controlled load test against staging, with Dan's go-ahead, to find the real first breaking point rather than the audit's estimate. Run outside working hours; stays well inside Vercel and Neon usage limits (Claude checks them first).
**Done when:** results and the first bottleneck are written down here.

### Step 16. Dan's legal and business jobs (C5, m10)
From the launch checklist: ICO registration (D1, needed before the first club), final terms (D3), penetration test booked (D10). Also confirm that "no export when a club leaves" still meets data-protection requests from a club for its own visitors' messages (m10).

### Step 17. Later, after the first clubs
- **M10:** let pages be cached at the edge (needs a different way of marking allowed scripts). Before about 10,000 visitors a day.
- **M4 part 2:** club previews on their own address, away from the admin (needs the platform domain).
- **m3:** privacy-safe error reports from visitors' browsers, if wanted.
- **m4:** ask for the current password when changing it (before member logins).
- **m5:** two-factor backup codes.
- **m7:** smoother rate-limit windows.
- **m9:** storage allowance per club (also Bearwood B-23).

## Not covered by the audit
The audit didn't read most block and marketing components, the test files in detail, or every CI job line by line, and couldn't see dashboard settings. Anything found while doing these steps gets a new row here rather than being fixed quietly.
