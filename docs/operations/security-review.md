# Security scan on every pull request

**Since:** 26 October 2026 (replaced the paid AI review added on 22 Oct) · **Workflow:** `.github/workflows/security-review.yml` · **Check name:** `security-review`

Every pull request into `main` (and hotfix pull requests into `production`) is scanned with **Semgrep Community Edition**: free, open source, no account, no API key, nothing to pay. It looks for known insecure code patterns using Semgrep's free rule sets for TypeScript, JavaScript, Node, React, Next.js, plus the general `security-audit` set.

## What it costs

**Nothing.** No subscription and no API key. It takes about a minute of GitHub Actions time a run, against 5–12 minutes for the old AI review. Nothing about the code is sent anywhere: `--metrics=off`, and the rules are downloaded, not the code uploaded.

## What it catches, and what it doesn't

- **Catches:** known insecure patterns, e.g. weak or misused encryption, unsafe HTML in React, dangerous redirects, unsafe regular expressions, hard-coded secrets in code. On its first run it found that the two-factor secret encryption accepted a shortened tamper-check value, now fixed (`src/auth/totpSecretEncryption.ts`).
- **Doesn't:** understand this project's own rules, such as "one club must never see another club's data". It matches patterns, it doesn't reason about the code. **Club data is guarded by the project's own required checks instead:** the tenant-isolation test suites (`tenant-isolation`, `test`), the access-rule guards (`tests/unit/access-guard.spec.ts`, `override-allowlist.spec.ts`, `raw-sql.spec.ts`) and `migration-guard` for database changes.
- The independent security review before launch (doc 04 §7) is still needed. No automatic scan replaces it.

## When it runs, and what blocks merging

- **Every push to a pull request that isn't a draft.** It runs when a draft is marked ready, then on each push after that.
- **Only what the pull request adds counts** (it compares with the base branch). A new rule from Semgrep never blocks an unrelated change.
- **Findings are shown on the changed lines** in the pull request, and listed in the run summary.
- **An ERROR finding fails the check.** WARNING and INFO are shown only.
- **If the scan itself fails, the check fails.** A broken scan must not look like a clean one.

The check isn't on `main`'s required list today, so a failure shows as a red cross but doesn't stop a merge. **Dan, optional:** to make it blocking, add `security-review` under GitHub → repo → Settings → Branches → `main` → Require status checks.

## Dismissing a false positive (Dan only)

1. **Write the reason** as a comment on the pull request, starting exactly with `Security finding dismissed:`.
2. **Add the label** `security-finding-dismissed`. This re-runs the check, which then passes.

Both must come **after the latest push**: new commits need a new dismissal. **The check passes only with both**, from the repository owner (`dancovello`). **Claude never adds this label or writes this comment** (CLAUDE.md).

## Running it locally

```bash
docker run --rm -v "$PWD:/src" semgrep/semgrep:1.180.0 semgrep scan --metrics=off --config p/typescript --config p/javascript --config p/nodejs --config p/react --config p/nextjs --config p/security-audit --exclude docs --exclude tests --exclude .claude
```

In a Git worktree, run it on a plain clone instead: the container can't follow a worktree's link to the main repository.
