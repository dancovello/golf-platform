# AI security review on every pull request

**Added:** 22 October 2026 (job 7 from the 21 Oct grilling) · **Workflow:** `.github/workflows/security-review.yml` · **Check name:** `security-review`

Claude reviews each pull request into `main` for security problems before it can merge, using Anthropic's `claude-code-security-review` GitHub Action (pinned to a commit, like every other action). The reviewer hasn't seen how the code was written: it gets the change and the repo, plus a project brief.

## What it checks

The brief is `.github/security-review/scan-instructions.txt`. **Tenant isolation comes first**: any way for one club to read, change or learn about another club's data is HIGH. Then it checks:
- access rules;
- every place that skips access rules, against the allowlist in `src/security/override-allowlist.ts`;
- raw SQL;
- where the club for a request comes from;
- sign-in, sessions and two-factor;
- uploads;
- caches;
- secrets and logs.

`.github/security-review/false-positive-instructions.txt` explains the project's deliberate patterns, so it doesn't report them. For example, public site loaders skip access rules but always filter by club.

## When it runs, and what blocks merging

- **Every push to a pull request into `main` that isn't a draft.** It runs when a draft is marked ready, then on each push after that.
- **Not for docs-only changes** (nothing to review) or **Dependabot's version bumps** (it can't read the key; the dependency scan covers them). A skipped run counts as passed.
- **Findings are posted as comments** on the pull request, and listed in the run summary.
- **Any HIGH finding fails the check.** MEDIUM and LOW are comments only.
- **If the review itself fails** (key missing, timeout, API error), the check **fails**. The action on its own would report "0 findings" then, which would be a silent pass.

**Dan:** add `security-review` to the required checks for `main` (GitHub → repo → Settings → Branches → `main` → Require status checks).

## The API key

- **Secret name:** `ANTHROPIC_API_KEY` (GitHub → repo → Settings → Secrets and variables → Actions → New repository secret).
- **Create it** at console.anthropic.com → API keys. Use a key just for this, named e.g. `github-security-review`, so it can be revoked on its own. Set a monthly spend limit in the Console (Settings → Limits) as a safety net.
- It lives only in GitHub's secrets: never in the repo, and never in Vercel.

## What it costs (estimate; check after the first week)

**Model:** Claude Opus 5.5 (`claude-opus-5-5`): $4 per million input tokens, $20 per million output, cached input $0.20. To halve the cost, change `claude-model` in the workflow to `claude-sonnet-5-5` ($2 / $10). That's one line, at some cost to depth.

**Per review:** Claude Code reads the change and the files around it. A typical review of a change this size reads roughly 150,000–500,000 tokens (much of it cached) and writes 10,000–30,000. That's **about $0.30–$2.50 a review, typically around $1**.

**Per month:** the last 30 days had about 150 pull requests. Reviewed once each (drafts until done, then marked ready) is **about 150 reviews, around $150 a month** (range roughly $50–$375). Reviewing every push, at about 2 pushes per pull request today, roughly doubles it.

**CI minutes too:** each review takes about 5–12 minutes of GitHub Actions time. 150 reviews is **about 750–1,800 minutes a month**, on top of the CI budget in `docs/operations/ci-minutes.md`, once the repository is private. That's the bigger constraint: see the note there.

To see the real cost: console.anthropic.com → Usage, filtered by this key.

## Dismissing a false positive (Dan only)

A HIGH finding blocks merging until it's fixed or dismissed. To dismiss one:

1. **Write the reason** as a comment on the pull request, starting exactly with `Security finding dismissed:`. For example: *"Security finding dismissed: the `overrideAccess` in loadClubPage is limited to the club from resolveSite (allowlist entry), so no other club's page can be returned."*
2. **Add the label** `security-finding-dismissed` to the pull request. This re-runs the check, which reuses the existing review (no new cost) and passes.

**The check passes only with both**: the label, and a comment from the repository owner (`dancovello`) starting with those words. The reason stays on the pull request as the written record. **Claude never adds this label or writes this comment** (CLAUDE.md), the same as the `approved-destructive-migration` label.

If a false positive keeps coming back, add a line to `false-positive-instructions.txt` explaining the pattern, in its own pull request.
