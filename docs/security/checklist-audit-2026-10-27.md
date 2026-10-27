# Security checklist audit, 27 October 2026

**Scope:** the whole app (club platform and marketing site) and its GitHub workflows, at `main` (b029f72). **Method:** Cloudflare's `security-audit` skill (installed globally), 19 areas of the code each reviewed by a separate agent, then every possible issue re-checked by a second agent trying to disprove it. Source reading only: no live site was touched and no target code was run. Full working files are in `~/security-audit-skill/golf-platform/run-1/`.

**Result: no way found for one club to reach another club's data, for an editor to become a super-admin, or to get into the admin without sign-in.** No secrets in any commit on any branch (gitleaks, 614 commits).

## Fixed in this change
| Item | What was wrong | Fix |
|---|---|---|
| Homepage confirmation email | Sent the club name the visitor typed (could hold a link) to any address | Confirmation no longer repeats anything the visitor typed |
| Hourly isolation check | If `ADMIN_URL` was unset it signed in at the address named in the request, sending the canary password and Vercel bypass secret there | Refuses to run and alerts instead |
| Demo club and marketing starter routes | A malformed `Origin` caused a 500 | Shared `fromAnotherSite` check, refuses with 403 |
| `EMAIL_OVERRIDE_TO` | Would redirect every email to one inbox if set on production | Ignored on production |
| `/_next/image` | Unused image resizer open to anyone | Switched off |
| News archive | Odd search words and huge page numbers each made a new cache entry or a database error | Trimmed and capped |
| Club logos | Logo address placed unescaped inside a CSS string | Escaped |
| Live preview link | Page address not encoded | Encoded |
| `.env.example` | Missing `CRON_SECRET`, `VERCEL_AUTOMATION_BYPASS_SECRET`, `TRUSTED_PROXY`, `SITE_PREVIEW`, `SITE_FIXED_TODAY` | Added |
| Restore guide | No step to re-apply removed accounts and resets after a restore | Added |

## Fixed in a separate CI change
- A pull request that renamed code into `docs/` was treated as docs-only and skipped the tests (proved on a test repo). Fixed with `--no-renames`.
- The production database owner password was visible to `pnpm install` in the release dry run. Now only the two steps that need it get it. The Vercel token is no longer on the command line.

## Needs Dan: settings only you can see (nothing to fix in code until you check)
1. **GitHub → Settings → Secrets:** are the old repository-level copies of the production database URL, R2 keys and Vercel token deleted? If not, any branch's workflow can read them.
2. **GitHub → Environments → `release-production`:** is `main` listed as an allowed branch? If so, anything merged to `main` can use production credentials. Fix: give the nightly backup its own environment.
3. **Vercel → Deployments:** do `dependabot/*` branches get preview builds, and which secrets do Preview builds hold? If they hold staging secrets, add a branch filter in `vercel.json`.
4. **Resend and Vercel:** forgot-password emails are not counted against the shared daily email allowance. Someone who knows two editor emails could use up a 100-a-day plan for every club. Needs a platform-wide cap on reset emails (small code change; say if you want it).
5. **Sentry:** `/csp-report` forwards up to 300 events a minute from one anonymous sender, which could use up the error quota that the isolation alerts depend on. Check the Sentry plan and spike protection, or let me aggregate the reports.
6. **Shared form-email budget (70 a day):** an attacker targeting two clubs plus the homepage form can use it up, so no club gets enquiry emails until midnight UTC. Enquiries are still saved. Check how many clubs are live.
7. **Search "did you mean":** zero-result searches scan the whole club's text, with only a per-person limit. Check the Neon compute size and whether Vercel firewall rule 1 exists.
8. **Vercel firewall rule 2** (login and password-reset limits per address) is the only per-address limit on those routes. Confirm it is on.
9. **Dependency scanner exceptions expire 10 November** (`braces`, `esbuild`). Both are build-tool only.

## Rejected after a second look
- "A pull request can clear its own security check": anyone who can open a pull request can edit the workflow anyway. The real control is a separate reviewer, already in `docs/operations/github-environments.md`.
- "Search reveals staff phone and email the page hides": the same details already reach visitors through the page itself.
- "A restore brings back removed accounts": an operator step, now in the restore guide.

## Hardening suggestions (not done)
Enforce the admin content security policy after the clean-report week; ask for a password when adding or removing two-factor; cap super-admin session life; bind the two-factor cookie to the session; schema-qualify and set `search_path` in the `users_super_admin_owner_only` trigger; consider blocking `golf_app` from changing super-admin password, email and two-factor columns; `removeTokenFromResponses`; index only the staff details a Team block shows; `pasteURL` off for uploads; delete rate-limit counts before other clean-up steps; per-club search ceiling; `includeSubDomains` on platform hosts only.

## Checklist coverage
1 unused packages: none unused. 2 debug mode: none enabled in production. 3 dependencies: 1 moderate (esbuild, build-time only); Payload 3.92 and Next 16.4.3 have no security notes. 4 git secrets: none. 5 and 6 keys and env: nothing reaches the browser; `.env` ignored. 7 exposed files: no `public/`, no source maps, backups encrypted in a separate bucket. 8 and 9 auth and hashing: PBKDF2-SHA256, 600,000 rounds, random salt; 1-hour tokens; lockout after 5 tries. 10 and 11 own data and admin: enforced on the server plus database triggers. 12 and 13 input and limits: see items 4–8 above. 14 database: parameterised queries, `golf_app` has data rights only. 15 CORS: no cross-origin access. 16 and 17 forms and XSS: validated on the server; only two raw-HTML spots, both safe. 18 headers: all present; admin policy is report-only.
