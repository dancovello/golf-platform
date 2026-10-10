# Mobile components spec (v3)

Figma file: AI-Testing (`GXzYibwnWKKyTeUkwRn8Of`). Covers every block page (Hero, then CTA Card Grid through Cookie Consent). The "Booking platform for members" page is out of scope here; its mobile chrome (Header / Mobile, Menu Drawer) already lives on that page.

v2 (10 Oct 2026) added Dan's first round of mobile amends:

- compact centred buttons;
- pill tabs;
- carousels that run to the screen edge;
- long-content rules and character limits;
- legibility scrims;
- the hole-grid carousels;
- course status built for 2–6 items;
- membership and team carousels.

v3 (10 Oct 2026) adds the second round. See "v3 changes" at the end.

## Where things are

On every block page:

- **Section "<Block> — Mobile (360) · 3 options"**, to the right of the desktop sections. Holds the mobile components, plus mobile versions of any sub-components the block uses.
- **Frames "Mobile — <Option>"** at x=1546, beside the matching "Desktop — <Option>" frame. They are instances of the mobile components.
- **Section "Mobile — long content tests"**, under the mobile section, on these pages:
  - Holes
  - Team
  - CTA
  - Rates
  - Documents
  - Tee-Time
  
  It holds instances filled with deliberately long names and titles.
- **Course Status** has its own section, "Course Status — content tests (2 and 6 items)", covering desktop and mobile.

Naming: every mobile component is the desktop name plus ` / Mobile`, for example `Hero / A · Heritage / Mobile`. The variant properties and the text and boolean properties are the same as desktop, so content maps 1:1.

## Breakpoints

| Breakpoint | Width | Source |
|---|---|---|
| Mobile | 320–767 (designed at 360) | `/ Mobile` components |
| Tablet | 768–1023 | Not designed yet. Use desktop layouts with the mobile type scale and a 2-column cap on grids |
| Desktop | ≥1024 (designed at 1366, container 1200) | Desktop components |

## Tokens on mobile

Colours are unchanged. Every fill and stroke uses the same `color/*` roles as desktop (doc 08), so tenant branding applies with no extra work.

**Spacing:** each token steps down one size on mobile. Do this with the token, not a raw number.

| Desktop | Mobile |
|---|---|
| space/128 | space/64 |
| space/96 | space/48 |
| space/80 | space/40 |
| space/64 | space/32 |
| space/48 | space/32 |
| space/40 | space/24 |
| space/32 | space/24 |
| ≤ space/24 | unchanged |

The page gutter is `space/24` (24px each side, 312 content at 360).

**Nav clearance:**

- `size/nav-clearance` is now **120** on desktop (header 105 + 15).
- `size/nav-clearance-mobile` is **80** (header 64 + 16).
- The hero utility row and status chip sit straight under the header.

**Type:** `Mobile/*` text styles. Same family, weight, line-height % and tracking as desktop; only the size changes. On build, use `clamp()` between the mobile and desktop sizes.

| Style | Desktop | Mobile |
|---|---|---|
| Display/XL | 96 | 50 |
| Display/L | 76 | 44 |
| Display/Caps | 68 | 36 |
| Heading/L | 52 | 36 |
| Heading/M | 28 | 24 |
| Heading/Caps | 30 | 22 |
| Quote/L | 44 | 30 |
| Quote/M | 32 | 26 |
| Data/Serif | 30 | 26 |
| Body/L | 18 | 17 |
| Body/M and smaller, Eyebrow, Label, Data/Label, Caption, Nav | unchanged | unchanged |

## Global rules

### Buttons

- `Button` has a new variant, **`Size=Default | Compact`**. Every mobile component uses `Compact`:
  - 12px vertical and 24px horizontal padding;
  - a 20px icon;
  - about 44px tall, which still meets the tap-target minimum.
- Labels are **centred** in every variant, so a full-width button reads correctly.

### Tabs become pills

Every tab bar and segmented control on mobile is now a row of **individual pills**, using the `Segment` component:

- the selected pill is filled (`action/solid`);
- the others are text only;
- there is no outer container around the row.

The same pill row follows two rules:

- **When the pills fit** in 312px (usually 2–3 short labels), they fill the width equally. That fixes the gap that was left on the right.
- **When they don't fit** (4–5+ labels, or long ones), the row scrolls sideways (scroll-x) and runs to the screen edge. A row of 5 or more never breaks.

Form choices, such as Membership C "How often do you play?", wrap onto a second line instead of scrolling.

### Carousels and scroll rows run to the screen edge

These frames start on the 24px gutter and scroll off the right edge of the screen:

- every carousel, track, pill row, thumbnail strip, marquee and scorecard scroll area;
- frames named `Track`, `Carousel`, `Pills`, `Scroll area`, `Thumbnails` or `scroll-x`.

How it's built:

- Parent frames lose their side padding.
- Siblings get a `Gutter` wrapper frame, or padding on themselves, so normal content still sits on the 24px gutter.
- The scroll row carries `space/24` padding on each side, so the first card lines up with the gutter and the last card can scroll fully into view.

On build: `padding-inline: 24px; scroll-padding-inline: 24px; overflow-x: auto; scroll-snap-type: x mandatory`, with no visible scrollbar. Keep keyboard focus and the arrow controls.

Carousel cards are **equal height** within a row.

### Long content: wrap, then truncate

Nothing in a component may push the page wider than the screen.

- **Names and titles** wrap to **2 lines**, then truncate with an ellipsis. This covers hole names, people's names and roles, card titles, rate names, facility labels, document titles and course names.
- **Key–value rows** keep the key short and on one line. The value takes the remaining width, aligns right and wraps to 2 lines. This covers booking summaries, key facts and rate prices.
- **Headings** wrap freely, with no truncation.
- **Tags, chips and pills** stay on one line. Their parent row wraps or scrolls.

Recommended CMS character limits. Validate in Payload; the design survives the truncation, but editors should see the limit as they type.

| Field | Limit |
|---|---|
| Announcement message | 100 recommended, 240 maximum. Desktop shows 1 line and mobile 2 lines, then "Read more" expands it |
| Announcement link label | 24 |
| Hole name | 40 |
| Person name / role | 40 / 40 |
| Card title (CTA, membership tier) | 48 |
| Rate name / sub-label | 48 / 60 |
| Course status label / value | 24 / 28 |
| Key fact label / value | 16 / 24 |
| Document title | 80 |
| Button label | 24 |
| Pill label | 20 |

### Legibility on images

The scrims are now stronger. The scrim gradient colour is unchanged; only its opacity stops changed.

- **Hero, desktop:** 55% at the top behind the nav and utility row, easing to 15%, then 45% → 90% behind the copy.
- **Hero, mobile:** 60% at the top, 25%, then 55% → 92% behind the copy.
- **CTA Immersive cards:** 25% → 55% → 90%.

For very bright tenant photos, CMS image focal-point guidance still applies.

## Pattern per block

| Block | A | B | C |
|---|---|---|---|
| Hero | Full-bleed image, copy at the bottom, full-width CTAs. **No scroll cue** (desktop or mobile) | Brand band, CTAs, then the feature image | Status chip right under the header, headline (Mobile/Heading/L), then **Booking Bar / Mobile Compact**. The whole hero fits in about 600px, one phone screen. **No pause control on mobile** |
| CTA Card Grid | **Swipe carousel** to the screen edge. A small **View all** link sits under the heading, and a **View-all card** is the last slide; the pager sits below | Stacked image strips (stronger scrim, 16px between the title and the arrow) | Stacked index list; title row reads "01. The Course" and is left-aligned, attached to the number |
| Announcement Bar | `State=Collapsed`: message truncates (desktop 1 line, mobile 2 lines) and shows **Read more**. `State=Expanded`: full message and **Show less** | Same states | Same states |
| Two-Column | Image, then copy | Collage, then copy | Image, copy, then **key facts as a list**: label on the left, value on the right (wraps to 2 lines). Desktop facts also wrap safely |
| Rate Table | Pills, then **Rate Row / Mobile**: rate name in Heading/M, sub-label, then one line per price (day caption on the left, price on the right in Data/Serif) | Pills filling the width, season cards | Pills, rate rows, booking aside |
| Hole Grid | **Carousel** (Masters cards 272, image 180) | **Carousel** (Overlay cards 272) | **Carousel** (Guide cards 272, raised card with 16px padding, 16px between cards) |
| Scorecard | **Tee pills, then that tee only**: summary (par, length, rating, slope), then front-nine and back-nine tables with Hole · Par · SI · Yards. Par and SI can differ by tee | Nines stacked; each table scrolls sideways inside its card (fixed 360 width, first column sticky), so all six columns always fit | Pills (tees), stats 2×2, scroll table |
| Course Status | Board, 2–6 facilities | **2-up grid**, 2–6 items, weather row last | Widget, 2–6 rows |
| Membership | **Carousel** of tier cards (280) | Tier pills (scroll-x, to the edge) plus single-column compare; full-width Apply button | Category list, then the form (pills wrap) |
| Tee-Time | Search: Booking Bar / Mobile (stacked) plus quick picks | Course pills, slots 2-up, summary | Full-screen sheet |
| Gallery | 2-column masonry; filter pills scroll | 2-up grid | Lightbox; thumbnails scroll to the edge |
| Documents | Rows: icon, title (2 lines), meta, download icon | Cards | Pills (scroll), list |
| Map | Map 240, then details | Map 280, then the card | Routes, then the map |
| Rich Text, Pull-Quote | as v1 | as v1 | as v1 |
| Timeline | Single-sided rail | Carousel | Ledger |
| Logo Strip | 2-up, centred | **Two equal columns** in rows; logos centred in each cell (logo box max 2 lines) | Marquee |
| FAQ | Accordion | Contact card, then the accordion | Search, topic pills (scroll), accordion |
| Team | `Layout=Grid` (2-up; names and roles wrap to 2 lines; tag drops below the role) or **`Layout=Carousel`** (200 cards to the edge) | Directory with a clear hierarchy: department eyebrow (accent), 56px avatar, **name in Heading/M**, role as an eyebrow (secondary), then phone and email as underlined links on one wrapping row; divider between people | Featured |
| Cookie Consent | Reject all and Accept all, then Manage preferences | Card | Full-screen preferences |

**Hole Grid variants.** Each hole grid mobile component (A, B and C) is now a set with **`Layout=Carousel | Stacked`**:

- `Carousel` is for the block on a page.
- `Stacked` is for the "all holes" page: one column, full width, no pager.

**Course Status flexibility.** Desktop and mobile components have `Show item 3` to `Show item 6` booleans:

- A board defaults to 6 items. B and C default to 4 and 3.
- Desktop B lays items out in a 200px-column grid that wraps, so 6 items become 4 + 2 rows instead of squashing.
- Mobile B uses a 2-up grid.
- The content-test section shows 2 and 6 items for every option.

## New shared and building-block components

- `Button` `Size=Compact` (Shared components).
- `Booking Bar / Mobile`: stacked fields, used in Tee-Time A.
- `Booking Bar / Mobile Compact`: one summary field ("Sat 18 Oct · 2 golfers · Championship", 1 line, truncates) and the search button. Tapping the field opens the Tee-Time C sheet. Used in Hero C.
- `Rate Row / Mobile` (v2 hierarchy) and `Rate Row / Header / Mobile`.
- Mobile versions of these sub-components, each in its page's mobile section:
  - CTA Card
  - Season Card
  - Hole Card
  - Membership Tier Card
  - Document Row
  - Static Map
  - Logo Slot
  - Accordion Item
  - Portrait

## v3 changes (second round of amends)

- **Hero A:** scroll-down cue removed on desktop and mobile.
- **Hero C mobile:** pause control removed.
  - *Accessibility note:* WCAG 2.2.2 requires a pause control for motion that plays for more than 5 seconds. If C uses video, either loop it for 5 seconds or less and then stop, or honour `prefers-reduced-motion` and show the poster image.
- **CTA B:** 16px gap between the title block and the arrow.
- **CTA A:**
  - A "View all" link (small, Link style) sits under the heading.
  - A **View-all card** is the last item in the carousel. It has a subtle fill, an arrow, "View all" and a one-line description, and the whole card is a link.
- **Announcement bars (desktop and mobile):** new `State=Collapsed | Expanded` variant.
  - Show "Read more" only when the message overflows.
  - Build it as a button with `aria-expanded`.
  - Expanded shows the full text and "Show less".
- **Hole Grid C:** guide cards now have a card treatment with padding and spacing, so nothing overlaps.
- **Scorecard A:** rebuilt as a one-tee-at-a-time view: pick a tee, then see its par, SI and yards.
- **Scorecard B:** tables scroll sideways inside their cards.
- **Partner B:** rebuilt as two equal columns; logos are centred in their cells and on the page.
- **Team B:** new hierarchy (see the table).

## Open items

- Tablet (768–1023) still needs a pass.
- Desktop tab bars still use the original Tab and Segmented Control styles. Decide whether pills become the desktop pattern too, for consistency.
- The character limits above need adding to the Payload field config (doc 02).
- Scorecard data model: par and SI need storing per tee, not per hole (affects doc 02, Hole collection).
