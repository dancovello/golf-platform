# GitHub environments and approvals

**Added:** 23 October 2026 (migrations audit, findings 1 and 2: `docs/security/audit-migrations.md`) · **Who does this:** Dan (GitHub settings; Claude can't and mustn't change them)

## Why

The production database's owner password, the Vercel token and the backup storage keys used to be **repository secrets**. Any workflow on any pushed branch could read them. They now belong in two **GitHub environments** that only `main` and `production` can use. The release and backup jobs name the environment they need (`environment:` in `.github/workflows/release.yml` and `backup.yml`).

## Steps (in this order)

GitHub → the repository → **Settings → Environments**.

1. **New environment `release-staging`.** Deployment branches and tags → **Selected branches** → add `main`. Add these environment secrets, with the same values as today's repository secrets:
   - `STAGING_DATABASE_URL_DIRECT`
   - `VERCEL_TOKEN`
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`
2. **New environment `release-production`.** Selected branches → add `production` **and** `main`. `main` is needed because the nightly backup of production runs from `main` (GitHub always runs schedules there). Add:
   - `PRODUCTION_DATABASE_URL_DIRECT`
   - `VERCEL_TOKEN`
   - `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`
3. **Merge the pull request** that adds `environment:` to the workflows. Until the repository copies are deleted (next step), the jobs still find them, so nothing breaks in between.
4. Check the next nightly backup (both staging and production) and the next staging release are green.
5. **Settings → Secrets and variables → Actions → Repository secrets:** delete `PRODUCTION_DATABASE_URL_DIRECT`, `STAGING_DATABASE_URL_DIRECT`, `VERCEL_TOKEN`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` and `R2_ENDPOINT`. Leave `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (they aren't secret).

**Optional:** on `release-production`, tick **Required reviewers** and add yourself. GitHub then waits for your "Approve" click before production is migrated or deployed. Check first that your GitHub plan offers this on a private repository.

## Required checks (Settings → Branches)

- **`production`:** add `release-source` (a release must come from `main` or a `hotfix/…` branch) and `security-review`.
- **`main`:** add `security-review`. It also needs an `ANTHROPIC_API_KEY` repository secret to run (`docs/operations/ai-security-review.md`).

## Approvals now count only after the latest push

The `approved-destructive-migration` label and the security dismissal (the `security-finding-dismissed` label plus your "Security finding dismissed:" comment) only count if you gave them **after the latest push** to the pull request. If more commits are pushed, give the approval again (remove and re-add the label; write a new comment). `scripts/check-approval.ts` does the check.

## Recommended: a separate GitHub identity for Claude (your call)

Every Claude Code session on your Mac uses your own GitHub login, so GitHub can't tell your approvals from an agent's. To make "Dan approves" something GitHub enforces:

1. Create a second GitHub account (or a GitHub App) for Claude, with **write** access to this repository, no admin rights and no `workflow` permission.
2. Sign Claude Code's `gh` in as that account (`gh auth login` in Claude's terminal).
3. Branch rules on `main` and `production`: **Require a pull request review** (1 approval). Claude can't approve its own pull requests, so only you can.
