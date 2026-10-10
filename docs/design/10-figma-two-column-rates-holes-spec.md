# Two-Column, Rate/Pricing, Hole-by-Hole + Scorecard — Figma build spec (desktop, v1)

Figma file: AI-Testing (`GXzYibwnWKKyTeUkwRn8Of`). Colour rules are in `08-brand-colour-contract.md`. Every component set's Figma description holds the full dev spec: layout, responsive behaviour, CMS fields and accessibility. All colours bind to roles; 1,448 bindings were audited across these three pages, none unbound or broken.

New shared components (on the **Shared components** page): **Tab** (Active/Default), **Segment** and **Segmented Control**.

## Two-Column Image + Text
| Option | Layout | Variants |
|---|---|---|
| A · Split (Wentworth) | Edge-to-edge 50/50: full-bleed image beside a padded text panel | Image = Left/Right × Tone = Canvas/Brand |
| B · Collage (Cabot, Meritage) | 4:5 primary image with an overlapping 4:3 inset, copy alongside, inside the 1200 container | Image = Left/Right; "Show inset image" toggle |
| C · Key facts (Masters) | 4:3 image + copy + 3-up facts row on a hairline rule | Image = Left/Right; "Show facts" toggle |

Rules: 60–90 words, one text link. Alternate the image side on consecutive blocks, and never put more than two split blocks in a row.

## Rate / Pricing Table
- **Building blocks:** Rate Row / Header and Rate Row, each with `Columns = 1 | 2 | 4`. They're real table rows: right-aligned tabular prices and a sticky label column on mobile.
- **A · Classic (Cabot):** season tabs, a weekday-vs-weekend table, footnotes, a "Prices last updated" stamp from the CMS `updatedAt`, and an Accent CTA.
- **B · Seasons (Meritage):** an audience segmented control, plus one Season Card per period. The current season is highlighted automatically by date (accent border + "Now" tag).
- **C · Matrix (Masters):** an audience segmented control and a 4-column table (Weekday/Weekend × AM/PM), beside a sticky booking aside with what's included, the CTA and a phone fallback.

## Hole-by-Hole + Scorecard
- **Building blocks:**
  - **Tee Marker** (`Tee = White/Yellow/Red/Blue`): uses the system `color/tee/*` tokens.
  - **Scorecard Cell** (`Type = Label/Head/Value/Total`).
  - **Hole Card** (`Style = Masters/Overlay/Guide`). Properties: Number, Name, Par, SI, White/Yellow/Red yards and Tip. These map to the Course Holes collection.
- **Hole grid options:**
  - **A · Card grid:** Front/Back nine tabs and a 3-column grid of Masters-style cards.
  - **B · Carousel:** a scroll-snap track of 4:5 overlay cards on the brand colour, with the next card peeking in, and a pager.
  - **C · Course guide:** a nine filter, full-width rows showing tip, par/SI and every tee's yardage, plus "Show all 18". Each row has an `#hole-N` anchor.
- **Scorecard options:**
  - **A · Classic:** holes as columns (Out and In tables) with tee rows, Par and SI, and a totals band (par, yardage per tee, rating, slope).
  - **B · Vertical:** holes as rows, front and back nine side by side, with Out/In/Total rows. Works at 320px without horizontal scroll.
  - **C · Tee selector:** a tee segmented control, a summary band, and all 18 holes on one strip for the chosen tee. The tee is held in the URL (`?tee=`).

Sample course data: par 72; 7,174 yds (White) · 6,792 (Yellow) · 6,020 (Red); rating 74.1, slope 138.

## Frames
Each page has one Desktop frame per option, with heights following the content, plus a "Tenant preview" frame locked to the *Demo · Coastal links* theme.
