# Golf Websites — Project Overview

**Read this doc first in any new chat.** It orients you on what we're building, why, and where the detailed work lives.

## The product

A semi-customisable golf club website product, built on **Payload CMS**, sold to golf clubs. Each club gets a modern, block-based website they can brand as their own (logo, colour palette, typography) and manage day-to-day through the CMS — editing pages by assembling reusable content blocks rather than needing a developer.

The core architectural idea: **one shared system, many distinct-looking club sites.** A club's branding lives in a single Payload "global," and every reusable block (hero, CTA cards, pricing table, etc.) inherits that branding automatically. So the product scales by adding clubs, not by forking templates.

## Why this approach

We started by researching how golf clubs' *existing* websites actually look, using England's top 100 ranked golf courses (from top100golfcourses.com) as the research sample. The working thesis, confirmed by the audit: **course quality and website quality are not correlated.** Several of the most prestigious clubs in the country (Sunningdale, Royal Worlington & Newmarket, Camberley Heath) run dated, unstyled, or stale sites — often on the same legacy platform (`intelligentgolf`) with no real content-management workflow. That's the market gap this product is aimed at.

Quality calibration anchors used throughout the audit (client-provided): **Wentworth** = good modern site, **Sunningdale** = poor/dated site despite prestige.

## Team & go-to-market

This is a **solo-founder project**: Dan handles product, design, and project management; a friend who's a devops engineer is expected to help with infrastructure and ongoing maintenance (informally, not full-time); and Claude writes all the code. There's no dedicated developer and no fixed overhead beyond usage-based infrastructure costs.

**Zero clubs are signed up yet.** The plan is to build one polished template first, then resell it club by club — each new client is a configuration of that same template (their branding, their content) rather than a rebuild. The pricing thesis is to undercut the incumbents this project's own research surfaced (the dated `intelligentgolf`-template sites and agency-built alternatives in `01-research-club-list.md`) by leaning on AI to cut build and setup cost, combined with having no overhead to cover. Growth is expected to be gradual — roughly two to four clubs a month from launch, not a big-bang rollout.

Each club can get their site two ways: a **self-serve-leaning** tier (club provides branding, gets the template provisioned, largely fills in their own content) or a **paid build** tier (Dan and Claude assemble the actual pages for them). Exact pricing and the boundary between the two tiers is still open — see `03-open-questions-and-next-steps.md`.

The onboarding mechanics — how a club goes from signing up to having an invited CMS user who can edit *only* their own site — are specified in `claude/04-infrastructure-architecture-and-guardrails.md`.

## What's been done so far

1. **Sourced the research list** — England's top 100 golf courses from top100golfcourses.com/golf-courses/britain-ireland/england. Note: this ranking is **England only**, not the whole UK (no Scotland/Wales/Northern Ireland — so no St Andrews, Muirfield, Royal Portrush, Royal County Down). See `01-research-club-list.md` for the full list and scope notes.
2. **Found official websites** for 93 unique clubs (100 ranked entries collapse to 93 clubs because several clubs have multiple ranked courses sharing one site — e.g. Sunningdale Old/New, Woburn's three courses). One club, Queenwood, has no public website at all.
3. **Ran a full design/UX audit** of all 93 sites — rated each Excellent/Good/Average/Poor/Very Poor, catalogued the content types (pages) and reusable UI blocks/components each site uses. Result: 51 clubs (55%) rated Good or better, 26 (28%) rated Poor or Very Poor, 5 need a manual recheck (they blocked automated review with a JS wall, SSL error, or robots.txt lockout — could be modern SPAs, could be broken, worth a five-minute look in a real browser).
4. **Synthesised a content model and block library** for the Payload build — see `02-content-model-and-block-library.md`.
5. **Wrote concrete visual/UX design direction for every block** — layout measurements, imagery rules, content constraints, and do/avoid guidance per block, each traced back to a specific audited site — see `claude/05-block-design-direction.md`. Both this and item 4 are published together as one designed reference artifact: **Clubhouse Blueprint** (https://claude.ai/code/artifact/3ed00485-8ff1-4c13-8982-46e65edf382f) — Part 03 is the block library, Part 04 is the design direction.
6. **Planned the infrastructure, security, and AI-safe process guardrails** for building this as a solo founder plus a devops friend plus Claude — see `claude/04-infrastructure-architecture-and-guardrails.md`. Published as a designed reference artifact: **Clubhouse Foundations** (https://claude.ai/code/artifact/d5886cd7-5aa5-4c3d-b1ad-2fe86673088d).

## Where things live

- `01-research-club-list.md` — the full 93-club list: rank, club name, official URL, design rating, keep/discard status, reference-site groupings, and recurring anti-patterns.
- `02-content-model-and-block-library.md` — the Payload content model (Pages / Collections / Globals) and the full reusable block catalogue with build-order recommendation.
- `claude/05-block-design-direction.md` — concrete visual/UX direction per block (layout, imagery, content rules, do/avoid), grounded in the audit.
- `03-open-questions-and-next-steps.md` — decisions still open, follow-ups to run.
- `claude/04-infrastructure-architecture-and-guardrails.md` — the infrastructure, security, multi-tenancy, and AI-safe process plan, including the concrete client-onboarding workflow.
- `claude/clubhouse-blueprint.html` — the full HTML source of the Clubhouse Blueprint artifact, mirrored into the project so it's readable without leaving the project (identical content to the published artifact link below).
- `claude/clubhouse-foundations.html` — the full HTML source of the Clubhouse Foundations artifact, mirrored the same way.
- **Artifact:** Clubhouse Blueprint (https://claude.ai/code/artifact/3ed00485-8ff1-4c13-8982-46e65edf382f) — audit findings, content model, block library, and per-block design direction, meant for sharing.
- **Artifact:** Clubhouse Foundations (https://claude.ai/code/artifact/d5886cd7-5aa5-4c3d-b1ad-2fe86673088d) — the infrastructure and guardrails plan, meant for sharing (e.g. with the devops friend).
- **Spreadsheet:** `Top100_England_Golf_Clubs_Websites.xlsx` / `.csv` — the richest version of the per-club data (rating, one-line rationale, content types found, UI blocks observed, standout feature per club). Delivered directly to Dan in chat rather than stored in this project (binary uploads aren't supported here) — ask him to re-share if a future session needs it.

## Note on doc numbering

Two independent numbering sequences exist in this project: the bare-named docs (`00`–`03`) and the `claude/`-namespaced docs (`04`, `05`). They're both sequential within their own namespace — not a conflict, just two series. If you're adding a new doc, check both before picking the next number.

## Current phase

Research, design direction, and infrastructure/process planning are done. Not yet started: actual Payload schema implementation, final pricing and packaging for the self-serve vs. paid-build tiers, and any UK-wide (Scotland/Wales/NI) expansion of the research. See the open-questions doc for specifics.
