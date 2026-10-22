# CI minutes (GitHub Actions)

**Measured:** 22 October 2026, from every workflow run between 22 Sep and 22 Oct (627 runs, 4,537 jobs) · **Job 6** from the 21 Oct grilling

Public repositories get GitHub Actions minutes free. Private ones draw on an allowance: **GitHub Pro includes 3,000 minutes a month**, then **$0.006 a minute** (Linux; GitHub's billing docs, checked 22 Oct). The repo was public from 15 Oct to keep CI free, and is going back to private.

## Before

**About 7,850 minutes in the last 30 days**, counting each job rounded up to a whole minute, as GitHub bills.

| Where | Minutes |
|---|---|
| CI on pull requests | 4,850 |
| CI on merges to `main` | 1,980 |
| Releases (backup, dry run, deploy) | 630 |
| "Update block pictures" (by hand) | 200 |
| Dependabot | 150 |
| Nightly backup | 30 |

The heaviest jobs are the browser checks: `tenant-isolation` (about 4 minutes a run) and `block-regression` (about 4). `test` takes about 3 and `build` about 2. The other six jobs take about a minute each. About 430 of the 7,850 minutes were placeholder jobs that no longer exist, so today's baseline is **about 7,400**.

**Over the allowance by about 4,400 minutes, roughly $26 a month.** Without a spending limit set in GitHub (the default is $0), Actions **stops running** once the 3,000 are used. Nothing could then pass the merge gate until the next month.

## What changed (`.github/workflows/ci.yml`)

1. **Docs-only pull requests skip the slow checks.** Docs-only means every file is under `docs/` or `.claude/`, or is Markdown. Tests, build, both browser checks and the migration dry run are skipped. **Secret scanning always runs**, along with typecheck, lint, the dependency scan and the migration guard (a minute each). A skipped job counts as passed for a required check. It's only skipped when no code changed, so it can't hide code.
2. **Draft pull requests skip the two browser checks.** They run once the pull request is marked ready for review (a draft can't be merged). Claude opens pull requests as drafts while still pushing to them, and marks them ready when done (CLAUDE.md).
3. **`cancel-in-progress` is kept**: a new push stops the old run.
4. **Merges to `main` and release pull requests (into `production`) always run everything.**
5. **Releases stop if the repository is public** (`.github/workflows/release.yml`, first step).

## After (estimate)

| Change | Saves a month |
|---|---|
| Docs-only pull requests skip the slow checks (about 1 in 9 pull requests) | about 450 |
| Browser checks once per pull request, not on every push (about 2 runs per pull request today) | about 1,200 |
| **Expected total** | **about 5,750 a month** |

**Still over 3,000**, by about 2,750 minutes: roughly **$17 a month**. Options, cheapest to set up first:

- **a. Set an Actions spending limit** so CI never stops mid-month (GitHub → Settings → Billing and plans → Spending limits → Actions, e.g. $25). **Recommended, whatever else you choose.**
- **b. Merge the five one-minute checks into one job.** That saves about 1,600 a month. But the required check names change, so you'd update the branch protection list. Claude can do the workflow side.
- **c. Skip the browser checks on merges to `main`.** They already passed on the pull request; this saves about 950 a month. It goes against "main always runs everything", so only if you're happy with that.

## How to check the real number

GitHub → your profile picture → **Settings** → **Billing and plans** → **Usage** → filter by **Actions**. It shows minutes used this month against the 3,000.
