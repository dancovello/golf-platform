# Security audit: database changes and the release pipeline

- **Date:** 22 October 2026
- **Commit reviewed:** `b45c7cf` (top of the stacked PRs #145–#155, branch `docs/pentest-scope-review-list`)
- **Reviewer:** Claude Code (Opus 5.5), acting as an outside application security reviewer. Job 8 of the security programme.
- **Scope:** `src/migrations/`, `scripts/check-migrations.ts` (and `scripts/lib/migrationGuard.ts`), `scripts/copy-database-structure.sh`, `scripts/vercel-build.sh`, and the workflows `release.yml`, `backup.yml`, `ci.yml` (migration-guard, migration-dry-run), `security-review.yml`, `isolation-nightly.yml`. Checklist: items 1, 8 and 10 of `docs/operations/security-checks.md`.

## Summary

Nothing here lets one club see or change another club's data through the website today. The database itself is in good shape: every club-owned table insists on a club and refuses to let a club be deleted while it has content, and the website's `golf_app` account can only read and write data.

The weak points are around **who can reach the keys to production**, and **which automatic checks would notice a database change that weakens security**.

| # | Finding | Severity |
|---|---|---|
| 1 | The production database's owner password, the Vercel token and the backup storage keys can be read by a workflow on **any** branch | **High** |
| 2 | Every "Dan approves" step can be done by any Claude session, and a release can come from any branch | Medium |
| 3 | A database change that weakens security passes every automatic check | Medium |
| 4 | The website's account can edit the list of database changes already applied | Low |
| 5 | The website's account can insert a super-admin directly into the database | Low |
| 6 | The saved "snapshot" files disagree with the real database about club rules | Low |

No critical findings. Each finding except 6 has a test that proves it (below). The tests are marked `it.fails`, so they pass CI while the problem exists and fail once it's fixed, which is the signal to turn them into ordinary tests.

**Two settings don't match the docs (not new findings, already on Dan's to-do list):**
- The repository is **public** right now (checked with the GitHub API on 22 Oct). `decisions.md` says it's private again from 22 Oct. Until it's made private, the release workflow's first step stops every release, so nothing unsafe can ship. But workflow logs and test reports are visible to anyone.
- The AI `security-review` check **is not a required check** on `main` or `production`, and there's no `ANTHROPIC_API_KEY` repository secret, so it can't run. CLAUDE.md says a HIGH finding blocks merging. Right now it can't.

---

## Findings

### 1. Production keys can be read from any branch (high)

**What's wrong.** The production database's owner connection string (`PRODUCTION_DATABASE_URL_DIRECT`), `VERCEL_TOKEN` and the backup storage keys (`R2_*`) are **repository secrets**. They aren't locked to a GitHub *environment* with a branch rule. Any workflow that runs from a branch in this repository can read them. The workflows only *use* them on `main` and `production`, but that's a convention. Nothing enforces it.

- `.github/workflows/release.yml:90`, `:138`, `:154`: jobs `dry-run`, `migrate`, `deploy` read the secrets with no `environment:`
- `.github/workflows/backup.yml:52-56`: the same, and `backup.yml:12` (`workflow_dispatch`) can be started on any branch
- GitHub settings: environments `Preview`, `Production` and `staging` exist (Vercel made them) but have no branch rules, and the secrets aren't stored in them

**How an attacker would use it.** Anyone who can push a branch adds a workflow file with `on: push` that prints or sends out the secret. It runs as soon as the branch is pushed: no pull request, no review, no required checks. With the owner connection string they can read every club's data, or change and delete any of it, skipping the backup, the dry run and every club rule in the app. With `VERCEL_TOKEN` they can deploy their own code to production. "Anyone who can push" today means Dan's account, which every Claude Code session on this Mac uses (see finding 2). So one prompt-injected or confused agent session is enough. A malicious package that runs during `pnpm install` on this Mac, and finds the GitHub login, is another route.

**Proof.** `tests/unit/audit-migrations.spec.ts`, "every job that reads a production secret is locked to a GitHub environment". Today it lists `release.yml → dry-run`, `migrate`, `deploy` and `backup.yml → backup`.

**Proposed fix (needs Dan's approval, and part of it is a GitHub setting only Dan can change):**
1. Create two GitHub environments, `release-production` (deployment branches: `production` only) and `release-staging` (`main` only). Move `PRODUCTION_DATABASE_URL_DIRECT`, `VERCEL_TOKEN` and the `R2_*` keys into them, and delete the repository-wide copies.
2. Add `environment:` to the four jobs above. Backups would then run from `main` (staging) and `production` (production) only.
3. Optional: a required reviewer on `release-production`, so Dan clicks "Approve" in GitHub before production migrates. GitHub's docs say private repositories need a paid plan for environment features. Dan has GitHub Pro (decisions.md, 22 Oct), which covers branch rules for environments. Whether it covers required reviewers needs checking before we rely on it.

### 2. "Dan approves" steps can be done by any Claude session; releases can come from any branch (medium)

**What's wrong.** Every human approval in the pipeline is "something Dan's GitHub account does":
- merging the release pull request into `production` (`release.yml:4` "that's the approval")
- adding the `approved-destructive-migration` label (`ci.yml:288`)
- adding the `security-finding-dismissed` label plus a comment starting "Security finding dismissed:" from the repository owner (`security-review.yml:97-100`)

Every Claude Code session runs `gh` and `git` **as Dan** (`dancovello`, admin rights, `repo` + `workflow` scopes, checked with `gh auth status`). GitHub can't tell Dan from an agent, so these approvals hold only because CLAUDE.md asks agents not to do them. Neither branch requires a pull request review (`required_pull_request_reviews: null` on `main` and `production`).

Two smaller gaps make it worse:
- The AI security review only runs on pull requests **into `main`** (`security-review.yml:9`). A pull request straight into `production` from any other branch skips it. Nothing checks that release pull requests come from `main`.
- Both labels **stay approved after new commits**. If Dan labels a pull request for one destructive migration, a second one pushed later is approved too. Likewise, one written dismissal clears every later HIGH finding on that pull request (`security-review.yml:98-100` accepts any earlier comment).

**How an attacker would use it.** A prompt-injected or mistaken agent session adds the label, writes the dismissal, or merges into `production`. All three look exactly as if Dan did them. Or a branch with a harmful change is opened straight into `production`, so the AI review never sees it.

**Proof.** `tests/unit/audit-migrations.spec.ts`, "pull requests into production must come from main, or be security-reviewed". The identity part is a GitHub setting, so a test can't prove it. The `gh auth status` and branch-protection output above is the evidence.

**Proposed fix:**
1. A small CI check that fails a pull request into `production` unless it comes from `main`. Make it required on `production`.
2. Re-check the labels against the current commit: an approval counts only if the label was added after the latest push. Do the same for the dismissal comment.
3. Bigger, and Dan's call: give Claude sessions their own GitHub identity (a second account or a GitHub App, without admin rights or the `workflow` scope), and make Dan's account the only one that can approve. Together with finding 1, step 3, that turns "Dan approves" into something GitHub enforces.

### 3. A database change that weakens security passes every automatic check (medium)

**What's wrong.** Two checks look at new database changes, and neither looks for changes that weaken security:
- The AI security review **skips `src/migrations/` entirely** (`security-review.yml:60`, `exclude-directories: …,src/migrations`). Yet the migrations are where the club rules live in the database: the club column on each table, "a club can't be deleted while it has content", "an account can never change club", and what `golf_app` may do.
- `migration-guard` only looks for **lost data** (`scripts/lib/migrationGuard.ts:9-48`). It doesn't flag, for example:
  - `GRANT … TO golf_app` (gives the website more rights)
  - `ALTER COLUMN "tenant_id" DROP NOT NULL` (records with no club)
  - re-adding a club link with `ON DELETE cascade` (deleting a club silently deletes its content)
  - `DROP TRIGGER users_role_tenant_immutable` or `DISABLE TRIGGER` (accounts could change club)
  - `INSERT INTO users …` (an account made by a database change)
- `migration-guard` only reads files named like `20261101_120000_name.ts` directly in `src/migrations/` (`migrationGuard.ts:94`). Any other file there, or in a subfolder, is never read. Changes to `src/migrations/index.ts`, which decides what actually runs, aren't checked either. The existing test `tests/unit/migration-guard.spec.ts:121` even asserts that `oddly-named.ts` is skipped.

**How an attacker would use it.** A harmful or mistaken migration (for example, one written by an agent following poisoned instructions) passes review unnoticed and runs on production with the owner account. Nothing in the database would then stop the website from mixing clubs' data. The app's own rules would be the only line left.

**Proof.** `tests/unit/audit-migrations.spec.ts`: "the AI security review reads migrations", six "migration-guard flags a migration that …" tests, and "migration-guard checks a migration whatever its file is called".

**Proposed fix:**
1. Remove `src/migrations` from `exclude-directories`. The review is then charged a little more per database change.
2. Add "weakens security" rules to `migration-guard` (`GRANT`, `REVOKE`, `ALTER ROLE`, `DROP NOT NULL`, `DROP CONSTRAINT`, `ON DELETE cascade` on a link to `tenants`, `DROP`/`DISABLE TRIGGER`, `DROP FUNCTION`, `SECURITY DEFINER`, `INSERT INTO "users"`). Show them under a separate heading, needing the same label.
3. Make the guard read every file added under `src/migrations/` (except the `.json` snapshots), and check that `index.ts` only imports from files that follow the naming rule. Update `migration-guard.spec.ts:121` to match.

### 4. The website's account can edit the list of applied database changes (low)

**What's wrong.** `golf_app` has read/write on **every** table, including `payload_migrations`, the list the release uses to decide which database changes still need applying (`src/migrations/20261011_173431_app_role_grants.ts:37` grants on all tables, and `:41-44` on every future one). The website never needs to write to it.

**How an attacker would use it.** Someone who has already taken over the website, or obtained the `golf_app` password, adds a row saying a future security fix "has already run". The next release skips it and reports success, so the fix never reaches production. This needs a prior break-in, hence low.

**Proof.** `tests/int/audit-migrations.int.spec.ts`, "golf_app cannot mark a database change as applied" and "… cannot remove a database change from the list".

**Proposed fix:** a new migration: `REVOKE INSERT, UPDATE, DELETE ON payload_migrations FROM golf_app` (read can stay). Payload's own "is the database up to date" check only reads it.

### 5. The website's account can insert a super-admin directly (low)

**What's wrong.** The database stops an account from *changing* type or club (trigger `users_role_tenant_immutable`, `src/migrations/20261011_072736_initial.ts:107-115`). It doesn't stop the website's account from *inserting* a brand-new `super-admin` row. Super-admins see every club. Only `scripts/create-super-admin.ts` should ever make one.

**How an attacker would use it.** After a break-in to the website or a leaked `golf_app` password, the attacker inserts a super-admin with a password hash they chose. That gives them lasting admin access to every club's data, even after the original hole is fixed.

**Proof.** `tests/int/audit-migrations.int.spec.ts`, "golf_app cannot insert a super-admin account".

**Proposed fix:** a new migration adding an insert trigger that refuses `role = 'super-admin'` unless the database account running it is the owner account. `create-super-admin` would then have to be run with the owner connection string. That needs Dan's OK, because it changes how he creates super-admins. Editors can still be created by the website (invites need that).

### 6. The snapshot files disagree with the real database (low)

**What's wrong.** Each migration has a `.json` "snapshot" that the next `pnpm migrate:create` compares against. The club rules were added by hand-written SQL (for example `20261011_082024_club_content.ts:36-43`), so the snapshots still say the club column is optional and deleting a club **clears** the column (`ON DELETE set null`) on every club-owned table. The real database (checked by applying every migration to an empty database on 22 Oct) says required and refused. The comment at `src/payload.config.ts:127` is true only because of those hand edits. No test checks the real database's club rules table by table, so a future generated migration that rebuilds one of those links could quietly bring back `set null`. Finding 3's gaps mean nothing would flag it.

**How an attacker would use it.** Not directly. It's a way for a protection to vanish by accident.

**Proof.** No failing test: the database is correct today. The fix below is the test that keeps it that way.

**Proposed fix:** an integration test that reads the live database and asserts, for every club-owned collection in `src/tenancy.ts`, that `tenant_id` is `NOT NULL` with `ON DELETE RESTRICT`.

---

## Checked and fine

- **Club rules in the real database** (all migrations applied to an empty database, then inspected): `tenant_id` required, with deleting a club refused, on all 11 club-owned tables. The search tables delete with their club, which is fine because they're rebuilt from content. Accounts carry the "super-admin has no club, editor has exactly one" rule plus the "never changes" trigger. Page *version history* (`_pages_v`) can have no club and clears it if a club is deleted. Only super-admins can see such orphaned rows, so they're no cross-club risk.
- **`golf_app` rights:** read/write data only. It can't create, change, drop or empty tables, create accounts, or give itself rights (no `CREATE` on the schema, no grant option). It refuses to run if it's a Neon super-account. `agreement_acceptances` is insert-only. The newest migration (`20261022_091355_rate_limits`) adds one table of hashed keys, gets the same rights through the default grants, and changes nothing else.
- **Untrusted text in shell steps:** pull request titles, branch names, commit messages and the replay seed all reach the shell through environment variables, never pasted straight into a script. The only `${{ }}` inside a script is a commit hash (`security-review.yml:70`).
- **Pinned actions:** every third-party action is pinned to a full commit hash. gitleaks and OSV-Scanner downloads are checksum-checked. The storage stand-in image is pinned by digest. Vercel CLI is pinned to `63.1.2`, though its own dependencies aren't locked (`release.yml:168`; see "Smaller notes").
- **Workflow permissions:** read-only by default. Issue-writing only in the failure-report jobs, and pull-request comments only in the security review. Workflows use `pull_request`, not `pull_request_target`, so pull requests from forks never get secrets.
- **Vercel never changes the database:** `scripts/vercel-build.sh` only builds.
- **Release order:** the backup and the dry run must both succeed before the real migration, and migration before deploy. Releases never cancel each other, and pipes fail properly (`pipefail`).
- **Backups:** dumped straight into encryption with a public key only. A suspiciously small backup fails, and the upload size is read back.
- **`copy-database-structure.sh`:** structure plus the applied-changes list only, no club data. Arguments are quoted.
- **Release refuses to run if the repository is public** (`release.yml:49-56`).

## Smaller notes (no action needed now)

- `ci.yml:273` still says migration-guard is "Not built yet". It is built.
- The dry run applies changes as the database's top account (`postgres`), not as Neon's owner account, so a change needing more power than Neon allows would pass the dry run and then fail the release. That's safe (the release stops), just late.
- `npx vercel@63.1.2` installs the CLI's own dependencies fresh, unlocked, in the job that holds `VERCEL_TOKEN`. Low risk, but installing it from the lockfile would close it.
- The database itself doesn't check that a page in Club A only points at Club A's photos or pages. The app does (`src/site/sameClub.ts`), and the tenancy audit covers that.

## Not checked

- The live Neon roles: whether production's `golf_app` really isn't a Neon super-account. The grants migration refuses to run if it is, so this is checked in code only.
- Exactly which environment protections Dan's GitHub plan includes for private repositories.
- Cloudflare R2 bucket permissions and Vercel's environment settings.
- No workflow was run, and nothing was sent to staging or production.

## Tests added in this pull request

| File | Tests | State |
|---|---|---|
| `tests/unit/audit-migrations.spec.ts` | findings 1, 2, 3 (10 tests) | `it.fails`: pass while the problem exists |
| `tests/int/audit-migrations.int.spec.ts` | findings 4, 5 (3 tests) | `it.fails`; each runs as `golf_app` in a transaction that is always rolled back |

Each was also run as an ordinary `it` to confirm it fails on its assertion, not on a typo. All 13 did.
