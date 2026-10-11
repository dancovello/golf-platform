# Golf Platform: instructions for Claude Code

## What this is
A multi-tenant SaaS website platform for UK golf clubs. **One application, many tenants.** Clubs are onboarded one at a time from a single polished template. A club's identity is data (branding, pages, news, staff), not a separate copy of the software.

Owner: Dan, a product designer and product owner. He is not a developer. Every explanation, plan and review must be in plain English.

## Decided: do not re-open without asking
These decisions are already made. Build on them. Do not propose alternatives unless you find a concrete blocker, and if you do, explain it before changing anything.

| Layer | Choice |
|---|---|
| CMS / framework | Payload CMS 3.x on Next.js, TypeScript |
| Database | Postgres on Neon (use branching for migration testing) |
| App hosting | Vercel (Pro, because Hobby forbids commercial use) |
| Media storage | Cloudflare R2. Never use local disk storage |
| CDN / WAF / DNS | Cloudflare |
| Email | Resend or Postmark. Not yet chosen |
| Background jobs | Payload Jobs Queue |
| Errors | Sentry |
| Uptime | Better Stack or UptimeRobot (external, independent of the app) |
| CI/CD | GitHub Actions |
| Tenancy model | Shared multi-tenant, with domain-based tenant resolution |

## Read before significant work
- `docs/architecture/04-infrastructure-architecture-and-guardrails.md` is the **source of truth** for architecture, security and build order
- `docs/product/00-project-overview.md`
- `docs/product/02-content-model-and-block-library.md` is the content model and block library
- `docs/product/03-open-questions-and-next-steps.md` lists open decisions. Flag them and never silently decide them
- `docs/design/` holds the brand colour contract (08), block design direction (05), per-block Figma build specs (07, 09–11) and the mobile spec (13). Figma file key: `GXzYibwnWKKyTeUkwRn8Of`
- `docs/design/06-design-skill-stack.md` lists which skills to use for which job. Use one skill per job
- `docs/product/12-booking-and-accounts-design-brief.md` and section 4 of `docs/product/14-content-templates-and-booking-extensions.md` are **out of scope for v1**. News, events and contact templates in doc 14 are in scope
- `docs/product/01-research-club-list.md` is background research only. Don't read it unless asked
- `docs/delivery/` holds the general Claude Code workflow guides. Where these conflict with doc 04, **doc 04 wins**

## Non-negotiables
1. **Tenant isolation.** Every tenant-owned collection has a required tenant relationship. Every collection defines explicit create/read/update/delete access functions. **The default is deny.** A missing access function counts as a bug.
2. **Two structurally separate account types:** super-admin (Dan) and club editor (scoped to exactly one tenant, and unable to discover that other tenants exist). These are separate structures, not just a role flag.
3. **The tenant-isolation test suite** uses two test clubs. It asserts that Club A retrieves zero rows from Club B across every collection, route and admin-UI screen. It runs on every change and blocks merge on failure.
4. **Migrations only in production.** Schema auto-sync is for local development only.
5. **No secrets in the repo**, ever. Use environment variables via Vercel or a local `.env` that is git-ignored.
6. **Never** deploy to production, change production infrastructure, create paid cloud resources, or run destructive commands without Dan's explicit approval in this session.
7. **Never claim** a test, scan or build passed unless you ran it and read the result.
8. Branding customisation is limited to colours, fonts, logo and structured blocks. No per-club custom CSS or scripts.

## Build order (from doc 04 §10)
1. Repo, CI pipeline, staging and production environments, and the merge gate
2. Tenant model, auth, and the isolation test suite
3. Migration and backup pipeline, including a real restore drill
4. Domain routing, plus the first club end to end
5. The template, built from the Phase 1 block library
6. Observability and alerting, live before the first real club
Do not start with blocks or the homepage.

## Out of scope for v1
Member login, the booking portal, and billing/payments. They are documented for later. Do not build them yet.

## How to work with Dan
- **Plan first.** Propose a small plan, wait for approval, then implement only what was agreed.
- Keep changes small. One branch per change. No direct commits to `main`.
- End every change with this summary:
  > **What changed:** … · **Why it's safe:** … · **Checks run:** typecheck ✅/❌, lint ✅/❌, tests ✅/❌, tenant isolation ✅/❌ · **New dependencies:** none / list · **Migration:** none / reviewed · **Preview:** link · **Risks / open questions:** …
- If something needs a human expert (security, production infrastructure), say so plainly.

## Commands
Node 24 and pnpm (via corepack: `corepack pnpm …` if `pnpm` isn't on PATH). Local Postgres runs in Docker.

| Task | Command |
|---|---|
| Start local services | `docker compose up -d` (Postgres: dev DB `golf_dev`, test DB `golf_test`, port 54329; photo storage stand-in on port 8333) |
| Dev server | `pnpm dev` (schema auto-sync is on here only) |
| Typecheck | `pnpm typecheck` |
| Lint + formatting | `pnpm lint` and `pnpm format:check` |
| Tests | `pnpm test` (applies migrations to `golf_test`, then runs Vitest) |
| Build | `pnpm build` |
| New migration | `pnpm migrate:create <name>`, then review the generated SQL |
| Apply migrations | `pnpm migrate` |

- Copy `.env.example` to `.env` and `.env.test.example` to `.env.test` for local work.
- Every collection must be listed in `src/collections/index.ts` and define create/read/update/delete access. `tests/unit/access-guard.spec.ts` enforces this.
- Accounts are created only by trusted scripts that pass `allowAccountCreation` context (`src/access/accountCreation.ts`).
- `pnpm format` must never touch `docs/`, `.claude/` or Markdown. `.prettierignore` covers this.
- **Releases:** merging into `main` releases to staging; merging a release PR (`main` → `production`) releases to production. `.github/workflows/release.yml` runs: pre-release backup → dry run of the database changes on a structure-only copy → migrate (owner account, GitHub secrets only) → Vercel deploy → `/health` check. Vercel never changes the database (`scripts/vercel-build.sh` only builds), and `vercel.json` turns off Vercel's own automatic deploys of `main` and `production`.
- **Database accounts:** the website uses the limited `golf_app` account (read/write data only). Only the release workflow uses the owner account.
- **Backups:** `.github/workflows/backup.yml` runs nightly and before each release, encrypted with the public key in `ops/backup-recipient.txt`. Restore procedure: `docs/operations/restore-runbook.md`.
- **Migrations:** never edit a merged migration; the `migration-guard` CI check blocks it. Data-deleting changes need Dan's `approved-destructive-migration` label.
- Decisions made after doc 04 are in `docs/architecture/decisions.md`.
