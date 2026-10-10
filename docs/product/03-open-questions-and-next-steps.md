# Open Questions & Next Steps

## Decided since the infrastructure planning session

- **Team & shape of the business** — this is a solo-founder project (Dan on product/design/PM), with an informal devops-engineer friend helping on infrastructure and maintenance, and Claude writing the code. No dedicated developer, no fixed overhead.
- **Go-to-market motion** — build one polished template, resell it club by club, starting from zero signed clubs and growing gradually (roughly two to four a month), not a big-bang launch. Pricing thesis: undercut the incumbents surfaced in `01-research-club-list.md` by leaning on AI to cut build/setup cost and having no overhead to cover.
- **Two service tiers exist** — self-serve-leaning (club provides branding, largely fills in their own content) vs. paid build (Dan and Claude assemble the client's pages for them). The exact price points and the feature boundary between the two tiers are still open — see below.
- **The client onboarding workflow is specified** — signup → brand assets handed over → Dan enters branding into the tenant's Site Settings global via a super-admin area → Payload provisions the templated site → Dan invites the club's main user into the CMS as that tenant's editor. Full detail, plus the hard requirement that an invited editor can only ever see or edit their own club's content, is in `claude/04-infrastructure-architecture-and-guardrails.md`.

## Follow-ups from the research phase

- **5 sites need a manual recheck in a real browser** (automated review was blocked, not confirmed poor): Royal St George's, St George's Hill, Royal Cinque Ports (all hard "JavaScript required" walls with no fallback markup), Alwoodley (SSL hostname-mismatch), JCB Golf & Country Club (robots.txt-blocked, and its visitor-facing content appears gated behind login even for members-only areas). These could be modern SPAs the crawler couldn't render, or genuinely broken sites — worth a five-minute look before drawing conclusions either way.
- **Geographic scope decision:** current research covers England only. Decide whether to pull Scotland, Wales, and Northern Ireland's top-ranked courses from top100golfcourses.com's other regional pages before finalising the content model — those markets include St Andrews, Muirfield, Royal Portrush, Royal County Down, and may surface content types/blocks not seen in the England set (e.g. links/dunes course terminology, different booking providers).

## Product decisions not yet made

- **Payload implementation** — none of the schema (Blocks config, Collections config, Globals config) has actually been written yet; the docs in this project are the spec, not code.
- **Branding customisation scope** — how far can a club go? Options range from "colours, fonts and logo only" (fastest to build, easiest to keep visually consistent) up to "full block reordering and custom CSS per club" (more flexible, harder to support). Needs a decision before the Site Settings global schema is finalised. Doc 04 adds a security angle to this: more customisation per club means a larger cross-site-scripting surface and harder-to-maintain tenant-isolation tests, which is a second reason (alongside design consistency) to favour the constrained option.
- **Exact pricing and tier boundaries** — the self-serve vs. paid-build split above is sketched but not priced, and it isn't yet decided exactly which capabilities (e.g. custom page layout, extra blocks) require the paid tier.
- **The devops friend's scope** — what he owns day to day (infrastructure setup, monitoring, backup drills, periodic security review, per doc 04) versus what stays fully automated and Claude-driven, hasn't been explicitly agreed with him yet.
- **Booking-provider integrations** — the audit found four third-party tee-time platforms in real use (IntelligentGolf, BRS Golf, ClubV1/HowDidiDo, GolfGenius). Decide which to build first-class embed support for vs. generic iframe/link fallback.
- **Security audit budget** — doc 04 recommends a paid third-party penetration test once the first real cohort of paying clubs is onboarded, and again at a later growth milestone. Not yet budgeted.

## Useful sales angle from the research

Clubs rated **Poor or Very Poor** (26 of 93) are running dated, legacy-template sites despite often being highly-ranked, well-resourced clubs — see `01-research-club-list.md` for the full discard list. That list is a ready-made prospecting target: these clubs have already demonstrated they care enough about their course to rank in the national top 100, but haven't yet modernised their web presence.
