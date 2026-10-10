# Block Design Direction

Full designed version: Clubhouse Blueprint artifact, Part 04 (https://claude.ai/code/artifact/3ed00485-8ff1-4c13-8982-46e65edf382f). This is the durable text reference for the same content — concrete visual/UX direction for each block in `02-content-model-and-block-library.md`, grounded in what worked on the Excellent-tier sites and what failed on the Poor-tier ones from `01-research-club-list.md`.

## System rules every block inherits

These come from the Site Settings global, not any one block — get these right once and most blocks look correct by default.

- **Spacing** — 8px base unit. Section rhythm 64–96px desktop, 40–56px mobile, between major blocks. Internal padding always a multiple of 8.
- **Type** — ~1.25 modular scale. Display face for headings, body face for text/UI, both chosen once per club. Body text 16–18px, line-height 1.6.
- **Colour** — one accent colour per club, used for CTAs and active states only, never more than ~10% of any screen. This restraint is what separates Wentworth from a generic template.
- **Imagery** — fixed crop ratios: hero 16:9–21:9, cards 4:3, avatars/testimonials 1:1, hole photography 3:2. Real photography only, never stock, never stretched.
- **Motion** — 150–250ms ease-out on hover/focus. Carousels auto-rotate no faster than every 5s, always with manual controls and a pause. Respect reduced-motion.
- **Accessibility** — 4.5:1 minimum text contrast, visible focus rings, alt text as a required CMS field, tap targets ≥44px.

## Marketing & hero

**Hero (image or video) — MVP.** Full-bleed, 80–90vh desktop, never under 480px on mobile — this measurement alone is the clearest line between Excellent and Poor sites. Video: a silent 6–12s loop with a static poster fallback; gradient overlay ~40% opacity for legibility only, never a full colour tint. Copy stack: eyebrow, one headline (5–8 words), one or two CTAs — never a paragraph.
- Do: real course photography in golden-hour/even light; one dominant CTA.
- Avoid: a heading-only "hero" with no imagery; stock photography; more than two competing CTAs.
- Model: Woburn, Woodhall Spa. Anti-pattern: Sunningdale, Rye.

**CTA Card Grid — MVP.** 3–6 equal-size cards, one thumbnail/icon + a 2–4 word label each. 3-col desktop → 2-col tablet → 1-col mobile, 24–32px gap. The most-copied pattern among Excellent sites; belongs directly below the hero.
- Do: cap at 6 cards; equal visual weight; point at Course/Visitors/Membership/Heritage first.
- Avoid: inconsistent card sizes; more than 6 tiles.
- Model: Moortown, Beau Desert, Cleeve Hill.

**Announcement Bar — Phase 2.** Thin (40–48px), single-line, dismissible, session-persistent dismissal. Reserve for genuinely time-bound info.
- Do: set an expiry date in the CMS.
- Avoid: a notice that's quietly years old.
- Anti-pattern: Rye's stale COVID-19 notice.

## Storytelling

**Two-Column Image + Text — MVP.** Alternate image-left/text-right, flip on repeat for rhythm. Full-bleed image, generous text-column whitespace, one text-link CTA. ~60–90 words per section.
- Do: alternate sides on repeat; use for facility overviews/heritage/sustainability.
- Avoid: cramming full paragraphs of history in — link to the full page instead.
- Model: Wentworth (one section per facility).

## Golf-specific data

**Rate/Pricing Table — MVP.** Real table markup, tabular numerals, right-aligned prices. Tabbed current+future season pattern. Auto-display a "last updated" date from the CMS save timestamp. Horizontal scroll on mobile.
- Do: auto-populated last-updated date; separate weekday/weekend and member/visitor columns.
- Avoid: green fees as prose; undated prices.
- Model: Hayling (2026 & 2027 tabs live together). Anti-pattern: Camberley Heath (2016/17 pricing still live).

**Hole-by-Hole Card Grid & Scorecard Table — Phase 2.** One card per hole (number, par, multi-tee yardage, real photo, 1–2 sentence tip). Scorecard: sticky first column, tabular numerals, distinct out/in/total rows, horizontal scroll on mobile.
- Do: use the club's own hole photography.
- Avoid: a scorecard so compressed on mobile it's unreadable.
- Model: Hillside.

**Course Status Widget — Phase 2.** Traffic-light iconography (open/restricted/closed), plain-English reason, visible timestamp. Must be genuinely live.
- Do: show last-changed timestamp.
- Avoid: a status badge nobody updates.
- Model: Hollinwell, Prestbury.

**Membership Tier Cards — Phase 2.** Publish pricing where comfortable; otherwise a consistent "Enquire" pattern with a qualifying question. Visually highlight one recommended tier.
- Do: highlight a recommended tier; offer an enquiry path when price isn't public.
- Avoid: a flat, unstyled list with no hierarchy.
- Model: Moortown, Hadley Wood.

## Social proof

**Testimonial (single/carousel) — MVP.** Photo, name, one-line credential. 1–2 sentence quotes. Carousel: no faster than 5–8s, manual arrows, pause-on-hover. Mix source types (press + visitor) for credibility.
- Do: attribute every quote; mix source types.
- Avoid: unattributed/generic quotes.
- Model: Cavendish.

## Booking & integration

**Tee-Time Booking Widget — MVP.** Persistent "Book a Tee Time" button in the header nav on every page, not buried on a Visitors sub-page. Skin the embed to match site fonts/colours where possible; otherwise a clearly labelled modal/new tab, not a raw iframe. Name the provider before click-through; keep a phone fallback visible.
- Do: header-nav CTA; phone fallback.
- Avoid: unstyled clashing iframes; booking buried three clicks deep.
- Model: Royal Birkdale.

## Media

**Gallery Grid + Lightbox — MVP.** Equal-ratio/masonry grid, lazy-loaded, filterable by tag/album. Lightbox with keyboard nav + swipe.
- Do: tag/filter by album.
- Avoid: loading every image at full resolution upfront.
- Model: Cleeve Hill, Appleby.

## Utility & navigation

**Document List — MVP.** Grouped by category (Scorecards/Policies/Forms), file type + size shown. Policies need a visible "last reviewed" date.
- Do: last-reviewed date on every policy.
- Avoid: one flat unsorted list.
- Model: Kington.

**Map/Location — MVP.** Static styled map by default, loads interactive map on click. Paired with a short "getting here" text block.
- Do: load the heavy map only on click.
- Avoid: an eager-loaded iframe with no directions text.
- Model: The Wisley.

## Everything else — condensed direction

| Block | Direction |
|---|---|
| Rich Text | Cap line length near 65 characters; real subheadings, never a wall of prose. |
| Pull-Quote | One quote, display face, italic; sparing use as a page-break. |
| Timeline | One entry per milestone: year + short line + optional photo. |
| Ambassador/Spotlight Profile | Full-width photo, name, credential line, then prose — a mini press page. |
| Partner/Logo Strip | Grayscale/single-tone logos, evenly sized, scrolls on mobile rather than wrapping. |
| Review/Rating Badge | Show source (Google/TripAdvisor/Top 100) and score together. |
| Press/Media Quote Strip | 3–5 short quotes in a row, publication visible on each. |
| Social Feed Embed | Cap at 6–8 posts, lazy-loaded. |
| Video Embed | Custom poster frame, never provider auto-thumbnail; under 90s for promos. |
| Virtual Tour/360°/Webcam | Label live vs pre-recorded; show last-refreshed time on webcams. |
| Flexible Enquiry Form | Purpose-selector dropdown first, then only relevant fields. |
| Event Calendar | List view by default; .ics export per event. |
| Newsletter Signup | Single email field + explicit (never pre-checked) consent checkbox. |
| FAQ/Accordion | Genuine FAQs only — never a substitute for a rate table or policy list. |
| Tabs | 2–4 tabs max, labelled by the real distinction, never "Tab 1". |
| Team/Staff Grid | Consistent photo crop/background across every person. |
| Stat/Ranking Band | 3–4 numbers max, large tabular-numeral display, one-word label each. |
| Weather Widget | Pair with Course Status rather than standing alone; compact, not a full forecast. |
| Cookie Consent Banner | Granular accept/reject-by-category, not a single accept-all button. |

## Note on scope vs. `claude/04-infrastructure-architecture-and-guardrails.md`

Doc 04 (infrastructure) already flags that branding customisation should stay to colours/fonts/logo/structured content rather than arbitrary custom CSS or embedded scripts per club, for security reasons (XSS surface, isolation-test complexity). Everything in this doc is compatible with that constraint — none of the direction above requires custom code per club, only values read from the Site Settings global.
