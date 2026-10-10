# Content templates and booking extensions (v1)

> **Scope note for Claude Code:** the news/events/contact templates in sections 1–3 are in scope for the template build. The booking extensions in section 4 are **out of scope for v1** (see CLAUDE.md).

Figma file `GXzYibwnWKKyTeUkwRn8Of`. Every screen below exists at 1366 (desktop) and 360 (mobile). Colours are bound to tenant tokens (doc 08); spacing to Layout variables. Mobile rules from doc 13 apply (bleeding scroll rows, full-width buttons, 2-line truncation).

## 1. Where things live

| Page | Section | What |
|---|---|---|
| Templates — content pages | Templates — building blocks | News Card, Event Card, Pagination, Post Nav, Footer / Mobile |
| Templates — content pages | News — archive page | Archive desktop + mobile, mobile "no results for topic" |
| Templates — content pages | News — carousel block options | A Card carousel, B Lead + list, C Headlines rail (each + Mobile) |
| Templates — content pages | News — post page | Article template with prev/next and "More news" |
| Templates — content pages | Events — archive page | Archive grouped by month |
| Templates — content pages | Events — carousel block options | A Card carousel, B Agenda, C Featured (each + Mobile) |
| Templates — content pages | Contact page & form + mobile 404 | Idle, Errors, Sent; mobile 404 |
| Booking platform for members | 5 · Accounts (two sections) | 5.1–5.5, 5.7–5.10 |
| Booking platform for members | 6 · Activities (three sections) | 6.1–6.8, 6.9 Event tickets |
| Booking platform for members | 7 · Manage bookings (three sections) | 7.1–7.12 |
| Booking platform for members | 8 · Competitions (two sections) | 8.1–8.9 |

## 2. New and changed components

| Component | Variants / props | Notes |
|---|---|---|
| News Card | Layout Stacked / Row / Feature × Size Desktop / Mobile; Meta, Title, Excerpt | Title ≤ 90 chars, excerpt ≤ 160. Title 3 lines (Row 2) then truncates. Feature has a bottom-weighted scrim for legibility. |
| Event Card | Layout Stacked / Row × Size; Day, Month, Title, Meta, Price, Category | Price line shows visitor and member price. Link label: Book, Enquire or Sold out. |
| Pagination | Desktop (numbered, 44px targets) / Mobile ("Page n of m") | `nav aria-label="Pagination"`, `aria-current="page"`. Events use "Show more" instead. |
| Post Nav | Desktop / Mobile; Previous title, Next title | Hide a side when there's no post. |
| Footer / Mobile | — | Link groups are an accordion (one open at a time). |
| Form Field / Textarea | State Default / Focus / Error; Label, Value, Helper, Show required | New. Grows to 6 lines then scrolls; helper shows a live character count. |
| Form Field | — | Error variant now uses the Helper property (it was hard-coded). Helper and label wrap. |
| Booking Card | — | Tag moved above the title; title wraps to 2 lines. Fixes mobile truncation. |
| Empty State, Alert, Dialog | — | Text fills the width, actions wrap. Dialog becomes a bottom sheet on mobile. |

## 3. Template rules

- **Archives** filter by category with pills (single select, "All" first). Filters are URL parameters so results can be shared. An empty filter shows the Empty State with "Show all".
- **Carousels** (news and events, option A) end on a "View all" tile and show a "View all" link under the heading on mobile. Past events drop out automatically.
- **Contact** is one form with a purpose selector (General, Visitor golf & societies, Membership, Events & weddings, Lessons, Feedback). Each purpose routes to a CMS-set inbox and can show extra fields (e.g. Membership type). Errors show a summary alert at the top plus inline messages. The Sent state names who will reply, by when, and a reference.
- **Mobile 404** keeps the search and swaps link buttons for a list of rows.

## 4. Booking extensions

**One engine, different resources.** Tee times, range bays, simulators, lessons, spa, tables and event tickets all run as *resource + time + duration + price rules*. What changes per type:

| Type | Choose | Then | Notes |
|---|---|---|---|
| Range / simulator | Date, duration | Bay × time grid (desktop) or start time then bay list (mobile) → 6.7 options (balls, players) | Grid greys out booked and closed cells; outside opening hours shows "Closed". |
| Spa | Treatment (6.5) | Therapist: Any or named (6.6), then time | "Any therapist" shows every free time. Intake questions on 6.3; stored for 12 months. |
| Lessons | Lesson type | Pro, then time | Same pattern as spa (pro = therapist). |
| Event tickets (6.9) | Ticket types × quantity | Guest names, dietary needs, seating preference | Seats held 10 minutes, like tee slots. |
| Competitions | 8.2 detail → eligibility | Own-time: 8.3 shows competition-blocked slots only. Ballot: partner + time preference, no time until the draw (8.7). | Not eligible gives the reason and alternatives (8.5). Full field offers the reserve list with position (8.6). |

**Shared steps:** 6.3 Summary handles signed-out (member price prompt), intake questions and the payment choice (Pay now / Pay at reception with card held). 6.4 Confirmed always gives the reference, payment status, what to bring, and the change/cancel cut-off.

**Manage bookings** lists every type in one place (7.1, with Upcoming / Past / Cancelled and a type filter). Changes show was vs now and the price difference before confirming (7.4). Inside the cut-off the actions stay visible but disabled, with the reason and the pro shop number (7.10). Cancelling and withdrawing are dialogs stating the refund outcome before you confirm (7.8, 8.9).

**Accounts:** sign in accepts email or membership number. Activation confirms an existing member record (number + surname + email) before setting a password. Lapsed members are never at a dead end: renew, book as a visitor, or contact the club. Session expiry returns the member to the same page after signing in.

## 5. Still open

- **Facility page (2.6), opening and holiday hours (3.5, 3.6) and functions (3.7)** are still to design.
- **Flow 4 mobile:** the tee sheet and booking steps are desktop only.
- **Tablet breakpoint** and the **Flow 12 email layout** are still to do.
- **Admin custom views:** 9.3, 10.4, 10.7 and 11.1 are still to design.
- **Carried from doc 12:**
  - house-account billing for activities;
  - WHS handicap sync, which drives 8.5 and the "updated from WHS" line on Profile;
  - member search privacy (7.7 assumes name only, with a profile opt-out);
  - waitlist offer rules.
