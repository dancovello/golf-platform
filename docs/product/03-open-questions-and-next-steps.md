# Open Questions & Next Steps

_Last updated 2026-10-20._ Decisions made during the build are in `docs/architecture/decisions.md`; this doc only lists what's still open, and a short record of what was settled.

## Where the build is (2026-10-20)

| Build step (doc 04 §10) | Status |
|---|---|
| 1. Repo, CI, staging, production, merge gate | Done |
| 2. Clubs, accounts, two-factor, isolation tests | Done |
| 3. Backups and safe database changes | Nightly encrypted backups and the release pipeline are running. **The first restore drill hasn't been done yet** (Dan's devops contact; `docs/operations/restore-runbook.md`) |
| 4. Club domains and the first real club | Not started (planned next) |
| 5. The template | Done: blocks in three design styles, news, events, contact, privacy, 404, site search, demo club |
| 6. Error alerts and uptime monitoring | Not started |
| 7. External security audit (pen test) | Before the first cohort of paying clubs |

Production was last released on 2026-10-11. From now on releases to production happen regularly, each with Dan's go-ahead (Dan, 2026-10-20).

## Decided (kept here for context)

- **Team and shape of the business:** solo founder (Dan: product, design, project management), an informal devops-engineer friend for infrastructure and maintenance, and Claude writing the code.
- **Go-to-market:** one polished template, sold club by club, about two to four clubs a month, priced below the incumbents in `01-research-club-list.md`.
- **Two service tiers exist:** self-serve-leaning and paid build. Prices and the boundary between them are still open (below).
- **Branding scope:** colours, fonts, logo and structured blocks only. No per-club custom CSS or scripts (CLAUDE.md, non-negotiable 8).
- **Stack:** Payload CMS 3 on Next.js, Neon Postgres, Vercel, Cloudflare R2 and Cloudflare, Resend for email (2026-10-16), Sentry, external uptime monitor, GitHub Actions.
- **Site search:** built (2026-10-19). Part 5 (popular searches, synonyms, a log of searches with no results) only when Dan asks.
- **Booking, member login, billing:** out of scope for v1. Dan agreed on 2026-10-20 not to start booking now. The plan is to launch the website first, then ask the first clubs what booking would be worth to them.
- **Working platform name:** "Clubhouse" (placeholder; see below).

## Still open: Dan to decide

- **Platform name.** "Clubhouse" is a placeholder (`PLATFORM_NAME` in `src/site/privacy/policy.ts`). Needed before the platform's own domain, the sending email address and the legal agreement can be finalised.
- **Pricing and tier boundaries.** Which features or services need the paid tier, and the prices. Needed before club #1 signs.
- **Legal wording.** The data processing agreement (`src/agreement/text.ts`) has square brackets for the provider's legal name, company number, address, contact email and liability clause, and needs a solicitor. The privacy policy needs a data-protection adviser's review. Dan is finalising these (2026-10-20).
- **Suppliers' own data terms.** Confirm the data processing terms of Vercel, Neon, Cloudflare, GitHub and Resend are accepted, and decide whether to move Vercel's function region to London.
- **The devops friend's scope.** What he owns (infrastructure, monitoring, restore drills, periodic security review) versus what stays automated. Dan is checking with him (2026-10-20), starting with the first restore drill.
- **Security audit budget.** A paid penetration test before the first cohort of paying clubs.
- **Booking providers.** Clubs use IntelligentGolf, BRS Golf, ClubV1/HowDidiDo and GolfGenius. Today every club gets a "Book a tee time" button that links to its own system. Decide whether any provider gets a proper embed.
- **Weather in the course status band** (needs a provider, e.g. the free Open-Meteo) and a **styled map image** (Mapbox or Google, paid). Both are left out until decided.
- **Dashboard next steps** from the 2026-10-20 review: a club home screen (quick actions, new enquiries, setup checklist), a preview for Club Settings (refresh on save, or drafts), a page-tree view, previews for News and Events.

## Still to do before the first real club

- Step 4 (club domains), step 6 (Sentry, uptime monitor) and the first restore drill (above).
- Neon upgraded to the Launch plan, with 7-day history, daily snapshots and branch protection on production (`decisions.md`, 2026-10-11).
- Editor invitations by email (today the super-admin copies a link by hand).
- Clean-up jobs the privacy policy relies on: delete enquiries after 12 months, and remove uploads that failed the content check.
- A security review of the contact form, and a content security policy. Run checks with `docs/operations/security-checks.md`.
- A short help guide for club editors (Dan, outside Claude Code).
- Dan's own dashboard steps on staging: `ADMIN_URL`, the Turnstile keys, and (optionally) `migration-dry-run` as a required check.

## Follow-ups from the research phase

- **5 sites need a manual recheck in a real browser** (automated review was blocked, not confirmed poor): Royal St George's, St George's Hill, Royal Cinque Ports (all hard "JavaScript required" walls with no fallback markup), Alwoodley (SSL hostname-mismatch), JCB Golf & Country Club (robots.txt-blocked, and its visitor-facing content appears gated behind login). Worth a five-minute look before drawing conclusions.
- **Geographic scope:** the research covers England only. Decide whether to look at Scotland, Wales and Northern Ireland (St Andrews, Muirfield, Royal Portrush, Royal County Down), which may use different terminology or booking providers.

## Useful sales angle from the research

Clubs rated **Poor or Very Poor** (26 of 93) are running dated, legacy-template sites despite often being highly ranked, well-resourced clubs (see `01-research-club-list.md`). That list is a ready-made prospecting target: these clubs care enough about their course to rank in the national top 100, but haven't yet modernised their web presence.
