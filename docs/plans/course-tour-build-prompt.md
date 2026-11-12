# Course tour: build brief (prompt for a new Claude Code chat)

You are picking up a feature that was designed and decided in a long earlier chat with Dan (product owner, not a developer: plain English only). Everything agreed is below. **Do not start coding.** Follow `CLAUDE.md`: read the docs it lists, check the code, then propose a small plan and wait for Dan's approval before building anything. One branch per change, draft PRs, end each change with the standard summary.

## 1. What we are building

A **Course tour**: one full page per hole (like https://www.ashburnhamgolfclub.co.uk/the-course/course-tour/hole-2/), not a pop-up. Clubs fill in as much or as little as they like. It must look good with almost nothing filled in. It is inspired by that Ashburnham page, but improved: tee yardages are labelled, par and stroke index live on the hole (not per tee), the hole picker shows par and the current hole, advice is split into clear parts, and every part is optional.

It is a **new block, "Course tour"**, with the same pattern as the existing Hole by hole and Scorecard blocks: one block, three design styles (A, B, C), reading one of the club's courses.

## 2. Read first

- `CLAUDE.md`, then `docs/architecture/04-infrastructure-architecture-and-guardrails.md` (wins on conflict)
- `docs/product/02-content-model-and-block-library.md` and `docs/product/03-open-questions-and-next-steps.md`
- `docs/plans/step-5-template-build.md` (how blocks were built; note it says hole cards open a pop-up and there are no hole pages: **this feature reverses that for the tour only**)
- `docs/architecture/decisions.md` (line ~636: "ladies' par is one figure per hole, only if different, not per tee colour". We keep that.)
- Existing code to build on: `src/collections/Courses.ts`, `src/collections/courseTees.ts`, `src/blocks/holeGrid/config.ts`, `src/blocks/scorecard/config.ts`, `src/blocks/video/`, `tests/e2e/site-holes.spec.ts`, `tests/e2e/seed-world.ts`
- Skills: `design-to-block` (Figma to block), `payload`. Memory rules that apply: always call Figma `get_design_context` on each frame before building and never invent styling; white label means features must work on any club's content, so keep logic simple.

## 3. The designs (source of truth)

Figma file `GXzYibwnWKKyTeUkwRn8Of` (page "Course Tour (hole pages)", page id `400:1810`). The sample club is "Heathcote" with made-up numbers and stock photos.

Each option has five content states on desktop (1366) and mobile (360): **empty** (hole number, par, one photo), **minimum** (adds a name), **typical**, **full**, **overflow** (longest allowed text, 12 photos, 4 tees with 25-character names).

| Option | Name | Section | Desktop frames (empty, minimum, typical, full, overflow) | Mobile frames |
|---|---|---|---|---|
| A | Hole story: photo-led, big hero | `415:2962` | 415:2964, 415:3119, 415:3275, 415:3621, 415:3994 | 417:3972, 417:4065, 417:4159, 417:4435, 417:4737 |
| B | Split-screen guide: media pinned left, details scroll right | `419:4695` | 419:4697, 419:4853, 419:5010, 419:5250, 419:5509 (expanded view: 419:5776) | 422:5364, 422:5449, 422:5535, 422:5700, 422:5886 (expanded: 422:6080) |
| C | Course journey: filmstrip, media viewer, tabs | `423:5744` | 423:5746, 423:5936, 423:6127, 423:6387, 423:6667 | 424:6377, 424:6469, 424:6562, 424:6706, 424:6870 |

- Fields-by-option table (every field appears in A, B and C): frame `425:6709`. **Treat it as the spec for where each field shows.**
- Shared components (section `400:1811`): Tour / Hole chip `400:1818` (A's picker), Tour / Hole dot `414:2994` (B's rail), Tour / Tee row `400:1843` (name, colour dot, yards), Tour / Hole plan `401:1810` (a drawing standing in for the club's uploaded plan image). `Tour / Stat` (`400:1844`) and the routing map (`401:1909`) are unused leftovers.
- Old first-round designs are parked off to the right, labelled "(v1, superseded)". Ignore them.
- The header, footer, buttons, tabs, tags, segmented control and carousel arrows are the existing shared components. The site already has them in code.

## 4. Decisions made (do not reopen without a concrete blocker)

1. **Each hole gets its own page.** The club adds one Course tour block to one page and picks a course. The system serves a page for every hole in that course, e.g. `/the-course/course-tour/hole-2` (the page's own address plus `/hole-N`). Editors never create 18 pages. A club with two courses adds two tour pages. Hole numbers beyond the course's 9 or 18 give a 404. (The Hole by hole pop-up cards stay as they are.)
2. **Every hole needs at least one photo; more are optional.** See open question 1 about existing data.
3. **The three styles show exactly the same fields.** No field may exist in only one style.
4. **Everything else is optional and disappears with no gap when empty.** No empty boxes, no orphan headings.
5. **Men's and ladies' scorecards:** par and stroke index per hole, plus ladies' par and ladies' stroke index only when different. Ratings and slopes (men's and women's) stay per tee and live on the scorecard, not on hole pages. No men/ladies switch on hole pages; ladies' figures just appear in the facts row when filled in.
6. **Tees:** up to 4 per course (unchanged). Colour dot chosen from white, yellow, red, blue **and black (new)**. The club can **rename each tee: up to 25 characters** (default is the colour word, e.g. "White"), because some clubs have black tees further back than white and call them things like "Championship Back Markers". The first tee listed is the main tee, used for the "Length" figure.
7. **Cut because they were in only one design:** signature-hole flag, key distances, hole shape, a course map with the hole highlighted, a photo per advice note, a "club to hit" pill. The course name is not shown on hole pages (it belongs to the page title). Do not add these back.

## 5. Fields on a hole (proposed)

Existing in `Courses.holes`: name (30 chars), par (required), strokeIndex, ladiesPar, ladiesStrokeIndex, yardsWhite/Yellow/Red/Blue, image, video (YouTube or Vimeo only), tip (300 chars).

| Field | State | Notes |
|---|---|---|
| Hole number | existing | from the order in the list (9 or 18 holes) |
| Photos (at least 1) | extend | Keep `image` as the main photo and add an optional "More photos" list (up to 11 more, 12 in total). This is non-destructive and keeps Hole by hole working. Confirm with Dan. |
| Hole plan image | new, optional | the club uploads a yardage-book drawing or aerial |
| Description | new, optional | one or more paragraphs (blank line = new paragraph); about 1,200 characters |
| Note: off the tee / the approach / on the green | new, optional | three short texts, about 500 characters each; each shows only if filled in |
| Hazards | new, optional | a short list of tags, up to 8, each up to 24 characters |
| Pro's tip | existing `tip` (300 chars) | |
| Pro's tip: who from | new, optional | **one field on the course**, up to 80 characters |
| Tee name | new, per tee | up to 25 characters, defaults to the colour word |
| Black yards | new | `yardsBlack`, alongside the others |

Group the new fields in the admin under "Course tour details (optional)" inside each hole so clubs that only want a scorecard never need to open it. `Courses` is club-owned: keep tenant isolation, explicit access functions and the isolation tests (see `CLAUDE.md` non-negotiables). Adding fields means a reviewed migration (additive only; nothing that deletes data).

## 6. Where each field shows (summary; the Figma table has the full version)

- **A Hole story:** full-width hero photo with a huge hole number and name, facts (par, stroke index, ladies' par and index, length). Video and plan appear as buttons in the hero. A sticky numbered hole picker (with par) follows. Then "About the hole" next to a tee card, "Watch out for" tags, "How to play it" columns, the plan beside the pro's tip, a "More from this hole" photo grid, large previous and next hole cards.
- **B Split-screen:** a slim numbered rail (circles, arrows, front/back divider) replaces the old pager. The left half is a media panel pinned to the window height: switch between Photos, Hole plan and Video (only the types the hole has), a photo carousel with counter, and an **expand button** opening the media full width (dialog, like the Video block: Esc or the cross closes it, focus returns). The right half scrolls: title, facts, tee card, description, hazards, how to play, tip. Bottom bar: previous and next with thumbnails. There are no photos at the bottom, as the carousel carries them all.
- **C Journey:** a dark filmstrip of hole photos with progress, a media viewer with the same Photos / Hole plan / Video switch and expand, number and name, facts, tee list, tabs (Overview with description and hazards, then one tab per filled-in note; no gallery tab), a dark pro's-tip band, and an "Up next" section.
- **Mobile (all):** things stack. The hole picker, rail, filmstrip and tabs swipe sideways. On B the media switch moves to a row under the photo (it does not fit on top at 360px). B has a bottom bar for previous and next.

Edge cases the designs do not draw: hole 1 has no previous, the last hole has no next or "Up next"; all drawn states are hole 2.

## 7. Behaviour to build

- Sticky picker (A), pinned media panel at window height (B), horizontally swipeable rows on mobile.
- Media switch only offers types that exist. Photos carousel works by arrows, swipe and keyboard. Nothing loads from YouTube or Vimeo until pressed (reuse the Video block's approach and its CSP-safe embed).
- Previous and next must work from the course's hole list. Add proper page titles (hole name or "Hole N", course name) and include hole pages in the sitemap and site search if that is simple; **do not set them to noindex** except on demo clubs (follow the existing demo-club rules).
- Long text must wrap and never overlap: tee names of 25 characters were tested in the designs at 312px wide; a worst-case name wraps and the row grows (the tee row component now hugs its height).
- Accessible: keyboard operable tabs, carousel, expand dialog; every image has alt text; contrast follows the site's existing rules.

## 8. Open questions for Dan (ask, don't decide)

1. **Required photo vs existing data.** Imported courses (e.g. Cottrell) have holes without photos. Recommended: the requirement applies when a hole is used by a Course tour block (editor warning), and the page falls back to a branded panel rather than breaking. Confirm.
2. **Scorecard and booking links.** The designs have "View full scorecard" (A, B, C) and "Book a tee time" (C). Proposed: an optional "Scorecard page" link on the block and the club's existing booking button from Club Settings; each hidden when not set. Confirm.
3. **Routing.** Nobody has checked how pages are served in the code. Investigate and explain in plain English how `/page/hole-N` fits before proposing the plan, plus the effect on the sitemap and search.
4. **Black tee:** adding a fifth colour with a four-tee maximum is intended (a club picks which four). Confirm this reads fine to Dan.
5. **Real data check.** Cottrell Park's real scorecard (and ideally a few hole descriptions) has not been supplied yet. Ask Dan for it. Use it as the test: pars and yardages must add up to the printed totals, and the three styles must render it without breaking.

## 9. What the designs did not prove

Only 14 of the 32 frames were checked by eye; an automated scan found no overflow or placeholder text on desktop, and on mobile only the intentionally swipeable rows. Not drawn: the plan and video views of the media switch, a video playing, the 9-hole tabs state beyond what is shown, small-text contrast, and B's pinned panel at real window height (Figma draws it full page height, so its photo looks more stretched than it will). Check these in a real browser against the build.

## 10. How to work

1. Read the docs and code above. Check routing (open question 3). Ask Dan for Cottrell's scorecard.
2. Reply with a **short plan in plain English**: fields and migration, the new block, the hole-page routing, the three styles in a sensible build order (suggest: data and route first, then one style fully, then the other two), tests. Wait for approval.
3. Build in small branches. Keep the tenant-isolation suite, the access-guard test and the visual tests green. Add tests: sparse content (the five states) per style, hole 1 and last hole, 9-hole course, a 25-character tee name on a 360px screen, and the 404 for a hole that does not exist.
4. Never deploy to production or run destructive commands without Dan's explicit approval. Never claim a check passed unless you ran it.
5. End every change with the summary in `CLAUDE.md`.
