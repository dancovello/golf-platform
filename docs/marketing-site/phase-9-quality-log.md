# Marketing site: phase 9 quality log

Run on 28 Oct 2026 against a production build of `main` (commit `ad62f77`) on a private copy of the test database, with the website running as the limited `golf_app` account, the way CI does. Pages covered: Home, Pricing, Switching, Book a demo, Website builder, Bookings, Trust, Accessibility, Changelog and the "page not found" page. The three legal pages are drafts (placeholder wording, N4), so they are not covered yet.

## What passes, and what each result does and doesn't prove

| Check | Result | Where it runs from now on | What it does NOT prove |
|---|---|---|---|
| Automatic accessibility check (axe, WCAG 2.2 AA) at 390, 768 and 1440 px wide | ✅ no problems on any page | CI, `tests/e2e/marketing-quality.spec.ts` | Automatic tools find roughly a third of real problems. Reading order, meaningful link text in context, and screen-reader behaviour need a person |
| 400% zoom (a 320 × 256 px screen, WCAG 1.4.10 Reflow) | ✅ no sideways scrolling, axe still clean, every page | same test | Whether the page is *pleasant* at 400%, only that nothing is cut off or breaks the checks |
| Keyboard only: Tab through every page | ✅ every stop shows a visible mark; nothing traps the keyboard; every visible link, button and field is reachable | same test | Whether the order feels right to a keyboard user. Radio groups and tab lists count as one Tab stop with the arrow keys moving inside (the standard pattern), so the test checks that Tab enters each group |
| Tablet (768 × 1024 and 1024 × 768) | ✅ nothing runs off the side; screenshots of every page are attached to the CI run | same test | Tablet isn't designed, so there's no "right" picture to match. Dan reviews the screenshots (CI run → "playwright-report" download) |

### How the keyboard test treats text fields

Text fields mark focus by turning their border gold (the Figma design) instead of drawing an outline. The test accepts that only when the colour really changes and stands out from the page behind it by at least 3:1 (WCAG 1.4.11). The gold passes comfortably against the dark green.

## Speed on a phone-like setup

**This is a stand-in, not a real mid-range phone.** I used Chrome's Pixel 5 profile with the processor slowed 4× and a "Fast 4G" connection (9 Mbit/s, 150 ms delay), loading the built site from my computer, median of 3 loads, intro skipped. The pictures are the test seed's, and there is no CDN, so real-world image times will be slower and cached repeat visits faster. Treat it as a check that nothing is badly wrong, not as a promise.

| Page | First paint = main content (ms) | Blocking time (ms) | Layout shift | Downloaded (KB) |
|---|---|---|---|---|
| Home | 896 | 22 | 0 | 819 |
| Pricing | 852 | 16 | 0 | 701 |
| Switching | 828 | 15 | 0 | 804 |
| Book a demo | 840 | 13 | 0 | 716 |
| Website builder | 872 | 40 | 0.058 | 1,053 |
| Bookings | 828 | 15 | 0 | 818 |
| Trust | 836 | 14 | 0 | 720 |
| Accessibility | 840 | 13 | 0 | 714 |

For reference, Google's "good" thresholds are main content within 2.5 s, layout shift under 0.1 and (for Lighthouse's blocking time) under 200 ms. All pages are inside them here. The Website builder page is the heaviest and the only one with any layout shift; worth watching when its real pictures go in.

**Do not publish any of these numbers on the site** (launch gate item 4: no speed figures unless fed by real data). A real check on a real phone, on the production address, belongs in phase 10.

## What this pass could not do

- **No screen-reader test.** The accessibility statement should keep "designed to meet WCAG 2.2 AA" and the claims register keeps its ❓ on "recording a screen reader test for every block" until someone has used VoiceOver (and ideally NVDA) on the pages. I can write the script of what to try; I can't hear the result.
- **No real phone.** See above.
- **Legal pages** are untested until their wording exists.

## Found along the way

The launch gate has three blockers that are about wording, not quality. See `launch-gate.md` (items 8, 10 and 11).
