# Step 3 plan: backups, safe database changes and production

**Status:** approved by Dan on 2026-10-11 (answers at the end). The devops contact reviews the release pipeline (3.3) and owns the restore drill (3.6).
**Goal:** before any real club data exists, the platform can **survive losing its database**, and **no database change can reach production untested**. Doc 04 §6 and §10 step 3: "proven with a real restore drill".

---

## What you'll have at the end

1. **A production environment.** Its own Neon database (London) and Vercel production, kept separate from staging. It has no clubs yet, and it stays behind Vercel's login until a club's domain is connected in step 4.
2. **Three independent layers of backup:**
   - **Neon point-in-time restore:** rewind production to any moment in the last 7 days, accurate to the second.
   - **Daily Neon snapshots:** named restore points, kept for 14 days.
   - **A nightly off-site copy** to Cloudflare R2, encrypted, kept for 30 days. It's independent of Neon, so it survives even a Neon account problem.
3. **A real restore drill, done and written down.** Your devops contact restores production from each layer onto a spare copy, checks it, and records how long it took.
4. **Safe database changes:**
   - every pull request that changes the database structure is first tried on a **throwaway copy** of the database; it's deleted straight afterwards;
   - changes that delete or rewrite data are blocked unless you explicitly approve them, and a backup point is taken just before.
5. **Controlled releases.** Production changes only when you merge a "release" pull request. A backup point is taken, the database change is applied, then the new code goes live, in that order, with a health check at the end.
6. **A limited database account for the app.** The running website can read and write data but **can't change or drop tables**. Only the release process uses the all-powerful account (open item from the step 2 devops review).

---

## How it works (plain English)

### Releasing to production
```
You merge "Release" PR (main → production)
  → GitHub takes a Neon backup point ("before release <date>")
  → GitHub tries the database changes on a throwaway copy of production
  → if that works, GitHub applies them to production (all-powerful account, stored only in GitHub)
  → GitHub tells Vercel to put the new code live
  → GitHub checks /health on production; if it fails, you get an email and the runbook says how to roll back
```
Today Vercel applies database changes while it builds. That works for staging but is the wrong order for production: new code could go live before its database change, and Vercel would need the all-powerful database password. **Both staging and production will use the GitHub release route**, so staging rehearses exactly what production does.

### Checking database changes on every pull request
The placeholder `migration-dry-run` check becomes real:
- When a PR includes a database change, GitHub creates a **throwaway Neon copy of staging**, applies every change to it, runs the tenant-isolation suite against the result, then deletes the copy.
- **Destructive changes are caught by a guard.** If a change deletes tables or columns, empties tables or rewrites data, the check fails unless the PR carries an `approved-destructive-migration` label, which only you add, after reading a plain-English explanation in the PR.
- Production data is **never** copied to staging, a PR preview or anyone's computer. Throwaway copies of *production* only exist inside Neon, during a release, for a few minutes.

### Backups
| Layer | Protects against | How far back | Who restores | Cost (estimate) |
|---|---|---|---|---|
| Neon point-in-time restore | Mistakes, bad releases, accidental deletion | 7 days, to the second | Devops contact (or me with your approval) | Included in usage, about $0.20 per GB a month |
| Daily Neon snapshots | The same, as named restore points | 14 days | Same | About $0.09 per GB a month |
| Nightly encrypted copy in Cloudflare R2 | Problems with Neon itself or the Neon account | 30 days | Devops contact | First 10 GB free, then about $0.015 per GB a month |

The off-site copy is made by a scheduled GitHub job using Postgres's standard export tool (`pg_dump`). It's encrypted **before** it leaves GitHub, with a key kept only in GitHub and your password manager. If the nightly job fails, you get an email. Proper alerting (Better Stack or UptimeRobot) comes in step 6.

### The restore drill (devops contact owns this; doc 04 §6)
A written runbook, `docs/operations/restore-runbook.md`, followed for real:
1. Rewind a **copy** of production to "10 minutes ago" with point-in-time restore, and check the app works against it.
2. Restore the latest Neon snapshot to a copy, and check the same.
3. Download last night's R2 copy, decrypt it, load it into an empty database, and check the same.

"Check it works" means: the admin starts, the record counts match, and the tenant-isolation suite passes against the restored data. Each drill is recorded in `docs/operations/restore-drills.md` with the date, who did it and how long each restore took. **It's repeated every 3 months** and after any change to the backup setup.

---

## How the work is split: small PRs, in this order

| # | What | Who |
|---|---|---|
| 3.1 | **Accounts and settings:** upgrade Neon to Launch, create the production Neon project (London), create a Cloudflare account and an R2 bucket for backups | **Dan** (dashboards), with my step-by-step instructions |
| 3.2 | **Limited database account:** a migration grants the app account read and write only; Dan creates the account in Neon and puts its password in Vercel | Me, plus Dan for the password |
| 3.3 | **Release pipeline:** GitHub release workflow (backup point → dry run → migrate → deploy → health check), staging switched to the same route, Vercel set to deploy only when GitHub says so | Me, plus Dan for two GitHub secrets |
| 3.4 | **Migration dry-run on every PR**, plus the destructive-change guard | Me, plus Dan for one Neon access key |
| 3.5 | **Nightly encrypted off-site backup** to R2, with failure emails | Me, plus Dan for the R2 key and the encryption key |
| 3.6 | **Restore runbook**, and the **first real restore drill** | Me (runbook); **devops contact** (drill) |
| 3.7 | **First production release:** the empty platform goes live (behind Vercel's login), and you create your production super-admin with two-factor | Dan (merge and approval), me (checks) |

## Checks on every PR in step 3
The usual six required checks plus tenant isolation. From 3.4, `migration-dry-run` becomes real and required.

## Costs (estimates, to be confirmed by your first bills)
- **Neon Launch:** usage-based, no minimum. For a tiny database that sleeps when idle, expect roughly **£5–£20 a month** across staging and production. The plan applies to your whole Neon account.
- **Cloudflare R2:** **likely free** at this size (first 10 GB). Cloudflare is already the decided choice for media, CDN and DNS, so the account gets used again in step 4.
- **GitHub Actions:** the nightly backup and release jobs fit well inside GitHub Pro's 3,000 minutes a month.

## What needs your devops contact
- **Owns:** the restore drill (3.6) and the quarterly repeat.
- **Reviews:**
  - the release pipeline;
  - where each secret lives (GitHub vs Vercel vs password manager);
  - the limited database account's permissions;
  - the backup encryption approach.
- **Agrees with you:** the recovery targets below.

## Dan's answers (2026-10-11)
1. **Spending:** yes. Move Neon to the **Launch** plan (estimated £5–£20 a month) and create a **Cloudflare** account.
2. **Recovery targets:** **at most 24 hours of data lost in the worst case** (in practice minutes, with point-in-time restore); **back up within 4 hours**.
3. **Production address:** stays on its `*.vercel.app` address, behind Vercel's login, until the first club's domain in step 4.
