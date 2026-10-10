# Infrastructure Architecture & AI-Safe Guardrails

**Written from the perspective of a lead software engineer planning this platform for a 1000+ tenant future, on the ground truth as of this update: a solo founder (Dan) with an informal devops-engineer friend for infrastructure help, and Claude writing all the code. There is no dedicated development team, and no club has signed up yet.**

That team shape is the filter every recommendation below is run through. It doesn't mean the platform can't be built safely — it means safety has to come from things a non-coder *can* verify (a green checklist, a passing test suite, a staging link that looks right) rather than from someone reading a diff line by line, because in practice nobody is going to do that as a matter of routine. Dan's devops friend is a real asset, but a devops background is about infrastructure and operations, not necessarily reading application code — so his involvement gets pointed at the places it fits best (see §07), and the automated-guardrail posture stays the default everywhere else.

## 1. The one fact that changes everything

This is not eventually-1000 websites. It is **one application, built to hold many tenants, that will onboard them one at a time.**

Every club does not get its own codebase, database, or deployment. They share one Payload CMS instance, one Postgres database, one Next.js frontend, one set of blocks (from `02-content-model-and-block-library.md`). A club's identity is a row of data — its branding global, its pages, its own news, staff, and testimonials — not a separate copy of the software.

This is the right call for a business that plans to grow one club at a time: one bug fix reaches every existing client at once, one new block is available to everyone at once, and a single template is what actually gets resold rather than rebuilt. But it means the single most valuable thing a golf club is paying for — the privacy of its own membership pricing, its own visitor data, its own content — depends entirely on every line of tenant-scoping code being correct, from the very first paying club, not just once there are hundreds.

> **Why this document exists.** A previous AI-built website "falling down" is annoying. A previous AI-built *multi-tenant platform* leaking Club A's membership fees to Club B, or letting Club B's editor publish over Club A's homepage, is the kind of bug that ends the business — and it's exactly as possible with two real clients as it is with two hundred. That risk is the organizing idea of everything below.

## 2. Recommended stack

A concrete stack, chosen for three things: it works whether there are 2 tenants or 200, it stays boring and standard enough to avoid lock-in, and — deliberately, given the "no fixed overhead" pricing strategy in §03 — every piece of it is close to free at zero clubs and scales its cost roughly with actual usage, not with time.

| Layer | Recommendation | Why |
|---|---|---|
| CMS / framework | Payload CMS 3.x on Next.js (already chosen) | TypeScript, self-hostable, no per-site licensing, one deployable app rather than a CMS bolted onto a separate frontend. |
| Database | Postgres, not MongoDB | A multi-tenant SaaS with strict per-club isolation needs relational constraints and mature, reviewable migrations — not a schema-less store. |
| Database host | Neon | Free/starter tier costs nothing pre-revenue; branching lets every code change test its migration against a real branch-copy of data first — the single best tool for AI-safe database changes on this whole list. |
| App hosting | Vercel, to start | Native Next.js support, per-domain custom domains for every club's own domain, automatic preview links a non-coder can click and look at. Hobby/low tiers are cheap while there are only a handful of clients; keep the app vanilla enough to move to a self-hosted container platform later if it ever makes sense. |
| Media storage | Cloudflare R2 | S3-compatible, no egress fees, pay-per-use. Payload's default local-disk storage does not survive serverless deploys — this must be object storage from day one regardless of tenant count. |
| CDN / edge | Cloudflare | Caching, DDoS protection, a web application firewall, and wildcard SSL for every club's own domain — has a genuinely usable free tier at this scale. |
| Transactional email | Resend or Postmark | Enquiry forms and sign-ups never sent directly from the app server — both have free tiers well beyond what a handful of clubs will generate. |
| Background jobs | Payload's Jobs Queue | Avoids ad-hoc cron hacks, a classic source of silent AI-introduced bugs. |
| Error tracking | Sentry | Every unhandled error, on any tenant's site, in one place, with an alert — how "it fell down" gets caught in minutes, not on a phone call from a club. |
| Uptime monitoring | Better Stack / UptimeRobot | Independent of the app — if the whole platform goes down, you still get told. |
| CI / CD | GitHub Actions | The actual safety net in §07: automated checks that must pass before any change reaches production. Free for a project this size. |

Worth a short conversation with your devops friend rather than a solo decision — he may already have opinions or existing accounts on some of these.

## 3. How this actually launches

Worth stating plainly, because it changes what "done" looks like at each stage:

- **Team**: you (product, design, project management), your devops-engineer friend (infrastructure and maintenance, hopefully), and Claude (all the code). No dedicated developer, no office, no fixed monthly overhead beyond the usage-based infrastructure in §02.
- **Zero clubs signed today.** The bet is that AI cutting the cost of building and provisioning each new club site, combined with having no overhead to cover, lets you price meaningfully below the incumbents this project's own research turned up — the dated `intelligentgolf`-template sites and agency-built ones in `01-research-club-list.md` — and still be sustainable at a fraction of their volume.
- **Growth is gradual by design**, a target of roughly two to four clubs a month from launch rather than a big-bang rollout. This is good news for the infrastructure plan specifically: it buys real time to get the foundational pieces — tenant isolation, backups, CI gates — right while the blast radius of any mistake is one or two clubs, not hundreds.
- **One template gets built first.** A single, polished golf club site, built to take a different club's branding and content and look native to that club. Every future client is a configuration of that same template, not a bespoke rebuild — the literal commercial expression of the "one system, many distinct-looking sites" idea already in `02-content-model-and-block-library.md`.
- **Two ways a club's site actually gets built** — worth treating as a real packaging decision, not an afterthought:
  1. *Self-serve-leaning* — the club hands over brand assets (logo, colours, fonts), you provision the template with their branding attached, and they fill in most of their own content afterward.
  2. *Paid build* — the club pays more, and you (with Claude doing the work) assemble their actual pages — writing the copy into blocks, laying out Course/Membership/Visitor pages — rather than leaving that to them.

  This changes how much of the CMS genuinely needs to be usable by someone with zero training versus how much stays something you'll always do yourself. Flagged again as an open decision in §11.

## 4. Client onboarding workflow, concretely

This is the actual sequence, end to end, for every single club that signs up:

1. The club signs up and hands over brand guidelines and a logo.
2. You open the **super-admin area** — the platform-admin role described in §05 — and create a new tenant, entering their branding into that tenant's Site Settings global: colour tokens, logo, typefaces, exactly the branding mechanism already specified in `02-content-model-and-block-library.md`.
3. Payload provisions the template site for that tenant with the branding attached — handed to the club to fill in themselves, or built up further by you and Claude if they've paid for that.
4. Once the site is ready, you invite the club's main user into the CMS as that tenant's editor.
5. From that moment on, that user can see and edit **only their own club's content — nothing from any other tenant, and no way to even discover that other tenants exist.**

> **This is not a nice-to-have.** Step 5 is the same tenant-isolation guarantee from §05, now as a literal feature you'll use for every single club you onboard. Two concrete ways an AI-written invite flow gets this wrong: (1) the invite creates the new user correctly scoped to one tenant, but some list or dropdown elsewhere in the admin UI was built without a tenant filter, so the new editor can still *see* other clubs' pages even if they can't edit them; (2) the invite step itself lets a tenant go unset or be picked from an unfiltered list, so a reused or copy-pasted invite link attaches the wrong club. The tenant-isolation test suite in §05 should explicitly include this exact scenario — invite a test user, log in as them, and assert they see nothing outside their own tenant anywhere in the admin UI, not only at the API level.

## 5. Multi-tenancy data model

- One `Tenants` collection. Every tenant-owned collection — Pages, News, Staff, Testimonials, Documents, Membership Tiers — carries a required relationship back to a tenant.
- **Every Payload collection must define explicit access functions for create, read, update, delete, and the default must be deny, not allow.** An access function that is merely missing, rather than wrong, is the most common way this bug ships — Payload will happily let a collection through unrestricted if nobody added one.
- Domain-based tenant resolution: middleware maps the incoming hostname — a club's own domain, or a subdomain fallback — to a tenant ID, and that ID scopes every query made during the request.
- Two account types, kept structurally separate, not just a role flag: the **super-admin** (you — can see and touch every tenant, used exactly as described in §04) and the **club editor** (scoped to exactly one tenant, invited per §04, cannot see that others exist). A bug that lets a club editor's permissions inherit super-admin scope is one of the worst outcomes on this whole page.

> **Build this before onboarding your first real club**: an automated tenant-isolation test suite. Spin up two fake test clubs, and assert — for every collection, every route, every access level, and every admin-UI screen a club editor can reach — that Club A's account retrieves exactly zero rows belonging to Club B. Run it on every change; block deployment on failure.
>
> This matters more than any other guardrail here because it's the one class of bug you cannot catch by looking at a staging preview. A broken layout is visible on screen. A cross-tenant data leak is invisible until it's a support ticket or a breach notice — and with only one or two real clients early on, it's tempting to assume informal care is enough. It isn't; this is exactly the kind of thing that's cheap to build correctly on day one and expensive to retrofit once real client data is in the system.

## 6. Database change discipline

- Payload/Drizzle's schema auto-sync is for local development only. **Production schema changes go exclusively through committed, versioned migration files**, checked by the CI pipeline in §07 and applied through the deployment pipeline — nothing ever runs a raw sync against production.
- No migration that drops or destructively alters data ships without an automatic backup checkpoint immediately beforehand, and stays reversible for a stated window — thirty days, say — before old data is actually purged.
- Automated, scheduled backups with point-in-time recovery, turned on the day the production database exists, not added later once there's real client data to lose.
- A staging environment with the exact same schema as production, seeded with realistic, anonymized data, is where every migration runs first.

> **Calendar item, not a one-off.** Test the restore process for real, at least once, before the first paying club goes live. An untested backup is a hope, not a backup — and this is a good, concrete task to hand to your devops friend specifically.

## 7. Guardrails for a small, mostly-automated team

This is the direct answer to "what do we need to make sure AI doesn't mess up," given the real team shape from §03: you can't read the code, and your devops friend's strength is infrastructure and operations, not necessarily reviewing every application-code change either. So the process substitutes automated, pass/fail checks for line-by-line review at the points a mistake would otherwise reach production silently — and it points your friend's actual involvement at the things a devops background is genuinely good at.

**No direct-to-production changes, ever.** Every change goes: a branch → an automated pipeline → a staging preview → your visual sign-off → production. On every change, the pipeline blocks merging unless all of the following pass:

1. Type-checking and linting — catches a large share of mistakes before anything runs.
2. The full automated test suite, including the tenant-isolation suite from §05.
3. A migration dry-run against a copy of the schema.
4. A dependency vulnerability scan — new packages show up in the diff and get scanned, never added silently.
5. A secrets scanner, so no API key or database credential is ever accidentally committed.
6. A block-rendering regression check across the library in `02-content-model-and-block-library.md` — catches "fixed one club's page, silently broke a block used on every other club's site."

> **What you actually review**: a fixed "definition of done," restated on every change in plain English — what changed, why it's safe, which checks passed. You don't need to read code to read "tenant isolation tests: pass · migration: reviewed · no new dependencies · staging preview: [link]." That sentence is the review, translated into something checkable by a non-coder.

**Staged rollout, not all-or-nothing.** New features and blocks go to one real club first, not every client at once — the standard way any serious SaaS company bounds the damage of a mistake, caught or not. With only a handful of early clients this is easy to do literally, not just in theory.

**Where your devops friend actually fits**: hosting and infrastructure setup and hardening, monitoring and incident response, the backup-restore drills from §06, and a periodic security-focused pass — rather than an assumption that he's reading every Claude-authored diff. Worth agreeing this division of labour with him directly rather than leaving it implicit on either side.

> **The one gap process can't fully close**: budget for a periodic outside security audit — a paid third-party penetration test, once before the first real cohort of paying clubs goes live, and again at a real growth milestone. This is the closest thing to an independent code reviewer this plan can offer. Your devops friend, even without reviewing application code day to day, is exactly the right person to help scope or vet who does this.

## 8. Security specifics

- **Input sanitization** — rich text from CMS editors and anything from public forms (enquiries, newsletter sign-up) is sanitized against stored XSS before it's rendered back to a visitor. Well-solved problem; the risk is skipping it under time pressure, not that it's hard.
- **File uploads** — restricted by type and size, verified by actual content rather than extension, served from a separate cookie-less domain so a malicious upload can't be used to steal session cookies.
- **Authentication** — strong password requirements, rate-limited login attempts, two-factor authentication required at minimum for the super-admin role that can see every club's data.
- **Secrets management** — credentials live in the hosting provider's environment store, never in the repository, with the automated scanner from §07 as a backstop.
- **Rate limiting and abuse protection** on every public endpoint — forms, login, search — at both the edge and the application. Public golf club marketing sites are a realistic, near-term spam target even before any other threat.
- **GDPR / privacy** — a documented lawful basis for members' personal data, a real retention and deletion policy beyond the cookie banner already in the content model, and the same rigor for membership data — names, contact details, sometimes payment references — that any personal data deserves. A natural item for your devops friend to help harden at the infrastructure level (WAF rules, edge rate limits, secrets storage).

## 9. Scaling and longevity

- **Stateless application tier** — any running instance serves any tenant's request, no per-club server. Scaling is running more instances, not a re-architecture at some tenant count.
- **Caching by default** — green fees, menus, staff pages change rarely. Aggressive CDN caching per tenant domain, invalidated only when that club actually publishes, keeps the database mostly out of the request path even as clients accumulate.
- **Connection pooling from day one** — the specific, well-known way multi-tenant apps that work fine at ten clients fall over at two hundred: serverless functions multiplied by tenants exhaust a database's connection limit long before its CPU.
- **Indexing on tenant ID plus every commonly filtered field**, set up from the start rather than retrofitted after the first slow-query complaint.
- **Given the gradual, a-few-a-month growth plan from §03, there's no need to provision for hundreds of tenants on day one.** Start on the smallest tier of each managed service in §02 and let usage-based pricing scale with actual growth. The point of raising connection pooling and indexing now is so nobody is surprised later, not so they get over-built prematurely — revisit them for real as the client count actually climbs, roughly in the 50–200 range.
- **No platform lock-in** — standard Next.js, Postgres, and S3-compatible storage throughout means the platform can change hosting providers without a rewrite if cost or reliability ever demands it. That portability is what "built for longevity" concretely means here.

## 10. Build sequencing

The instinct when telling an AI "build me a golf club website" is to start with the homepage hero block. That instinct is exactly backwards here, and it's plausibly what went wrong on the previous build.

1. Repo, CI pipeline, staging and production environments, and the deployment gate from §07 — before any product code exists.
2. Tenant model, authentication, and the access-control isolation test suite from §05 — the foundation everything else sits on, built before club #1, not after club #10.
3. Migration and backup pipeline, proven with a real restore drill.
4. Domain routing and your actual first signed club, end to end, on the now-safe foundation — this is the pilot, not a hypothetical one.
5. The one template, built from the Phase 1 block library in `02-content-model-and-block-library.md`, against infrastructure that already enforces isolation and has tests protecting it.
6. Observability and alerting live and tested before that first real club goes live, not after the first incident.
7. The first external security audit, booked once a first real cohort of paying clubs is onboarded.

## 11. Decisions this surfaces

> **Hosting.** This document recommends Vercel, Neon, Cloudflare R2, and Cloudflare as the default. Worth a short conversation with your devops friend rather than a decision made solo.

> **Security audit budget.** Flagged in §07 as a real cost to plan for once real clients are onboarded, not optional — and a good thing to have your devops friend help scope.

> **Branding customization scope.** Already an open question in `03-open-questions-and-next-steps.md`, and it has a security dimension as well as a design one. The more customization allowed per club — full custom CSS, arbitrary embedded scripts — the larger the attack surface for cross-site scripting, and the harder the isolation tests in this document are to keep comprehensive. This holds regardless of which service tier (§03) a club buys. The recommendation is the same one already implied by the design-simplicity case: colours, fonts, logo, and structured content through the block library — not arbitrary custom code per club.

> **Pricing and packaging.** The self-serve-leaning versus paid-build split sketched in §03 isn't priced yet. Worth nailing down before club #1 signs, since it directly decides how much of the CMS needs to be usable by someone with zero training versus how much stays something you'll always do by hand.

> **Your friend's scope.** Agree explicitly what he owns — infrastructure, monitoring, backup drills, periodic security review, per §07 — versus what stays fully automated and Claude-driven, so it's a conscious division rather than an assumption on either side.
