# Plan: closing the feature gaps found in 50 club sites

Written 15 Nov 2026. The evidence and counts are in `docs/product/15-feature-gap-register.md`. **Nothing here is approved yet:** Dan picks which items to build, and each becomes its own branch and pull request.

Every item follows the usual rules: tenant field and access rules on anything new, a reviewed migration where the database changes, the isolation tests, demo club data and block pictures updated, and the import tool taught the new fields so the next club import uses them.

**Size key:** S = small (one sitting), M = medium (a few sittings), L = large. "Migration" means the database structure changes.

## Suggested order

| Order | Item | Count | Size | Migration | Depends on |
|---|---|---|---|---|---|
| 1 | G1 Tee sets | 21 | M | Yes | none |
| 2 | G7 Course handicap tables | 21 | S | No | G1 |
| 3 | G3 Open competitions and results | 37 | M | Yes | none |
| 4 | G2 Dated price lists | 21 | S–M | Yes | none |
| 5 | G4 Course notices (dated and weekly) | 26 / 18 | M | Yes | best done with G16 |
| 6 | G16 Status per course | 19 | S–M | Yes | none |
| 7 | G6 Membership details | 26 | S | Yes | none |
| 8 | G15 Out-of-date warnings | 22 | S–M | Maybe | G2 and G3 make it richer |
| 9 | G5 Extra enquiry fields | 14 | M | Yes | none |
| 10 | G17 Weather | 10 | S | No | none |
| 11 | G10 Vacancies | 15 | S | Yes | none |
| 12 | G13 Honours boards | 9 | S | Yes | none |
| 13 | G14 Package cards | 11 | S | Maybe | none |
| 14 | G11 Webcam | 6 | S | Yes | none |
| 15 | G12 Unusual hole counts | 5 | S–M | Yes | G1 |
| 16 | G8 Third header button | 6 | S | Yes | none |
| 17 | G18 Add to calendar | 2 | S | No | none |

Natural bundles if Dan wants fewer pull requests: **"Course data"** = G1 + G7 + G12; **"Course conditions"** = G4 + G16; **"Prices and membership"** = G2 + G6.

---

## G1. Tee sets (21 of 50)

**Goal:** any club's real tee set-up fits without a workaround, including separate women's and winter tees.

**For editors (admin):**
- Up to **eight** tees per course (Worplesdon has eight).
- More colours: add green, gold, orange, purple, silver. Keep the free "name" (so Bude's "60", "57", "54" and Aberdovey's "Black & Silver" work). Each colour still shows its name in words, never colour alone.
- Each tee gets **"Who plays it": men, women, or both**. A women's tee has its own yardages, par, stroke index, rating and slope. Today's women's figures on a shared tee stay valid for clubs that work that way (Cottrell).
- A **"winter tee"** tick, with optional dates. Winter tees hide outside their dates unless the club chooses to always show them.

**On the website:**
- Scorecard: a men's / women's switch when the course has both; the tee selector style copes with up to eight tees; long cards scroll sideways on phones as now.
- Course tour: each hole lists the tees for the chosen group.

**Data:** migration adds "who plays it", winter flag and dates, and new colour options; existing courses default to "both" so nothing changes until edited.

**Also:** demo club data, block pictures (the "Update block pictures" workflow), the import tool's tee mapping, and Cottrell on staging (offer a small script; never re-import).

**Open question for Dan:** on the scorecard, should women's tees appear on the same card under a switch (Ludlow style), or as a separate card (Conwy, Cruden Bay style)? Recommend the switch.

## G7. Course handicap tables (21 of 50)

**Goal:** a correct table without the club maintaining PDFs.

- An option on the scorecard block (or a small "Handicap table" block) that works out, for each tee and for men and women, which handicap index range gives each course handicap. It uses the World Handicap System formula with the course's stored rating, slope and par.
- An optional allowance (100%, 95% or 85%) for playing handicap, as Wrexham publishes.
- Front 9 / back 9 tables when the club enters 9-hole ratings (later, if wanted).
- Tables update by themselves whenever an editor changes a rating.
- **Check:** the formula is tested against two clubs' published tables (for example Ludlow and Sandiway) before release. Shown with a short note that the club's official table takes precedence.

**Data:** none beyond G1. **Size:** S.

## G3. Open competitions and results (37 of 50)

**Goal:** a club can list its opens with the rules golfers look for, and publish results, while entry stays on the club's own system.

**For editors, new optional fields on an event:**
- Who can enter: handicap index limit (men's and women's separately), minimum or maximum age, men / women / mixed / juniors / seniors.
- Format (free text, for example "Stableford, better ball") and tee.
- Entries open (date and time) and entries close (date and time).
- "Entry by ballot" tick, and maximum entries.
- Entry link (exists as the booking link) and a **results** file (from Documents) or link.

**On the website:**
- Event cards show "Entries open 15 Jan, 10:00" before the date, an "Enter" button during the window, "Entries closed" after, and "Results" once added.
- Events block gains a **filter** (men, ladies, juniors, seniors, mixed) and an "Open competitions" view.
- A **past results** list on the events page, grouped by year (past events with a results file stay visible; others drop off as now).

**Data:** migration adds the event fields. **Size:** M.

**Open question:** should a past open stay visible without results? Recommend: only if it has results.

## G2. Dated price lists (21 of 50)

**Answer to Dan's question:** by default the site shows **only the current prices**. Dates let it switch by itself, so a club never shows last year's prices (Castlerock, Wrexham, Dunbar and Gleneagles do today). Showing next year's prices early is **optional**, for clubs that take bookings a year ahead.

**For editors:**
- Each price list (tab or season card) can have an exact **"valid from" and "valid until"** date. Month-only seasons stay available for clubs whose prices repeat each year.
- A tick: **"Show next year's prices before they start"** (off by default). When on, the upcoming list appears as its own tab, for example "2027 prices", with its start date.

**On the website:**
- Expired lists disappear by themselves; the current list is shown and highlighted; if nothing is current, the block shows the next upcoming list (never an empty block).
- The page cache refreshes at midnight on a changeover day, so the switch happens without anyone publishing.

**Data:** migration adds dates to rate table lists. **Size:** S–M.

## G4. Course notices: dated and weekly (26 and 18 of 50)

**Goal:** the club enters known changes once, and the website shows them at the right time.

**Part A, dated notices (for example winter mats, closed for winter, holes 3 to 5 out of play, Open week):**
- A list on the Course status screen: message, start date, end date (optional), which course (with G16), and type (closure, restriction, information).
- While a notice applies, it shows on the status board and band, and optionally in the announcement bar. It expires by itself.
- The hand-set live status (open, restricted, closed) stays as the on-the-day override.

**Part B, weekly visitor times:**
- A simple table on the visitors page: day of week, time window, note (for example "Thursday: members only", "Saturday after 1pm"). Optional dates for summer and winter versions.
- A new small block, "Visitor times", with the same three-style pattern as other blocks.

**Data:** migration for notices and visitor times. **Size:** M.

## G16. Course status for each course (19 multi-course clubs)

- Course status gains a "course" choice: one status per course, plus a club-wide status for single-course clubs (as now).
- Status board shows each course in turn; the band and widget can show one course or all.
- Existing clubs keep their single status, which becomes "all courses".

**Data:** migration. **Size:** S–M. **Best built together with G4.**

## G6. Membership details (26 of 50)

**For editors, per membership category:**
- **Joining fee** (optional amount or text, for example "Equal to first year's subscription").
- **Availability:** open, waiting list, full or closed (today only style C shows availability).
- **Payment note** (optional), for example "12 monthly payments by direct debit".

**On the website:** all three styles show the joining fee and an availability badge, worded in plain English ("Waiting list", "Currently full"). "Full" categories can hide their apply button.

**Data:** migration. **Size:** S.

## G15. Out-of-date warnings (stale content on 22 of 50)

**Goal:** editors are told before visitors notice.

- On the club home screen in the admin, a short "Needs attention" list: price lists that have ended, or end within 30 days with nothing after them; events lists with nothing coming up; pages not edited for 12 months (setting); course status not changed for longer than the existing stale limit.
- Optional weekly email to the club's editors with the same list (uses existing email; off by default).
- Never shown on the public website.

**Data:** none for the screen; a small setting if the email is wanted. **Size:** S–M.

## G5. Extra enquiry fields (14 of 50)

**Keeping it simple:** a fixed set of optional fields, switched on **per enquiry purpose** in Club Settings, with no form builder.
- Fields: course; number of golfers; caddies; buggies; trolleys; hire clubs; catering or dietary needs; event type; start and finish time; organisation or society name; address; date of birth; "how did you hear about us?".
- Shown in the enquiry record, the alert email and the export.
- **Privacy check:** date of birth and address are personal data; the privacy notice already covers enquiries, but confirm wording before switching these on.

**Data:** migration. **Size:** M.

## G17. Weather (10 of 50)

- A "Weather" style on the course status widget (or a tiny block): today and the next two days, temperature, wind and rain chance, from the club's stored map position.
- Use a **free weather service with no key and no tracking** (for example Open-Meteo), fetched by our server and cached for an hour, so visitors' browsers never contact the weather site.
- **Check before building:** the service's free-use terms allow commercial use; otherwise it costs money, and I will say how much.

**Data:** none. **Size:** S.

## G10. Vacancies (15 of 50)

- A small Vacancies list (title, department, short description, closing date, how to apply: link, email or document).
- A "Vacancies" block, or a style of the existing document list. Vacancies disappear after their closing date.

**Data:** migration (new tenant-owned collection with full access rules and isolation tests). **Size:** S.

## G13. Honours boards (9 of 50)

- A new "Honours board" block: board title (for example "Club Captains"), rows of year, name and optional detail.
- Styles: dark board like the clubhouse (matching the course record block), simple table, and multi-column list for long histories (Littlestone goes back to 1894).
- Optional spreadsheet paste for importing long lists.

**Data:** migration (block). **Size:** S.

## G14. Society and golf-day package cards (11 of 50)

- **First, test** whether the membership block's card style already works for packages ("Birdie, Eagle, Albatross" with price and what's included). If it does, this becomes onboarding guidance only.
- If the wording ("categories", "join") gets in the way, add a "Packages" style or a neutral label setting.

**Size:** S, possibly none.

## G11. Webcam (6 of 50)

- A webcam block: either a still image address that refreshes every few minutes, or a video stream page from an allowed list of providers.
- Needs the content security policy to allow that one provider; no other outside scripts.
- Show "Camera unavailable" instead of an empty box (Brora's webcam page was empty).

**Data:** migration (block). **Size:** S.

## G12. Unusual hole counts (5 of 50)

- Allow any course length from 6 to 18 holes (Shiskine 12, Gullane 6, Littlestone 10).
- **27 holes as three nines (Malone):** enter each nine as its own 9-hole course, plus a short "how the nines combine" note. Full combination scorecards are not planned unless a customer needs them.

**Data:** validation change, possibly a migration. **Size:** S–M. **Depends on G1.**

## G8. Third header button (6 of 50)

The header already has a main button and a second button (enough for "Book" plus "Members' login", the pattern on most sites). Add an optional third, shown in the menu panel on phones.

**Data:** migration. **Size:** S.

## G18. Add to calendar (2 of 50)

An "Add to calendar" link on event pages that downloads a standard calendar file. No outside service. **Size:** S.

---

## Decisions for Dan (no build until decided)

- **D1. Resorts:** recommend out of scope for v1, recorded in `docs/architecture/decisions.md`.
- **D2. Pulling competitions and results from IntelligentGolf, BRS, HowDidiDo or Golf Genius:** recommend "later", after G3, and only for the supplier most of our clubs use.
- **W1. Welsh and other languages:** recommend watch only. If a Welsh club asks, it is a large change and needs its own plan.
- **Testimonials:** covered by the quote block (Dan, 15 Nov). If a club wants several quotes in one place, they add several quote blocks.

## Not covered by this plan

- Booking, payments, member logins and ticket sales stay out of scope for v1.
- Cottrell and any other club data updates are separate small jobs after each feature merges (never a re-import).
