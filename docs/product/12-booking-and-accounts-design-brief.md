# Booking, accounts and site chrome — design brief (v1)

> **Scope note for Claude Code:** booking, member login and accounts are **out of scope for v1** (see CLAUDE.md). This brief is kept for planning and so early schema decisions don't block it later.

Figma file: AI-Testing (`GXzYibwnWKKyTeUkwRn8Of`), page **Flows**, board **Golf site flows** (12 flows, every step numbered). This brief holds the rules the flows can't show. Colour rules stay in `08-brand-colour-contract.md`. Where this brief and an older doc disagree, this brief wins for booking and accounts.

Step numbers below (4.1, 7.3 …) match the step cards in Figma. A green card means the screen can be assembled from existing blocks; a dashed card needs new design.

## 1. Direction change: native booking

Earlier docs (02, 11) assume tee times hand off to a third-party provider. The platform now has its **own booking engine** with member login.

- **Booking Integration global** gets a mode: `Native` (this brief) or `External provider` (the existing hand-off behaviour, kept for clubs locked into BRS, IntelligentGolf and similar).
- **Tee-Time Booking block:** option B (Slot picker) becomes the native tee sheet, step 4.1. Options A and C stay as the external-provider variants.
- Reuse and extend the existing **Tee Slot** and **Date Chip** components rather than redrawing them.

## 2. Locked decisions

| Decision | Rule |
|---|---|
| Slot hold | A selected slot is held for **10 minutes** while the booker fills in details and pays. A visible countdown starts at step 4.3. |
| Hold warning | Required for WCAG 2.2.1 (Timing Adjustable). At 2 minutes left, show a "Need more time?" prompt that extends the hold once by 10 minutes, announced via `aria-live`. On expiry, go to 4.10 Hold expired and keep the filters. |
| Card guarantee and no-show fee | **Per-club settings, both off by default.** When on, "Pay on the day" captures a card without charging it (4.5). Staff can charge the no-show fee from 11.7. When off, step 4.5 is skipped. The design must show both states. |
| Calendar files | Every booking email attaches an `.ics` file. When a booking changes, the new file reuses the same event UID with a higher SEQUENCE number, so calendar apps update the existing event instead of adding a duplicate. A cancelled booking sends `METHOD:CANCEL`. This is standard iCalendar behaviour, so the build cost is low. |

## 3. Who uses the site

| Role | Sees | Notes |
|---|---|---|
| Visitor (signed out) | Visitor slots and rates, guest checkout | Must pay now, or pay on the day if the club allows it |
| Member | Member slots and rates, playing partners, dashboard | Usually no payment for tee times; activities may be charged |
| Lapsed member | Visitor view plus a renew prompt (5.10) | Never a dead end |
| Guest via manage link | One booking only (4.12) | Uses a magic link from the email, no account |
| Club staff | Payload admin plus custom booking views | Roles: Club admin (everything), Front desk (flow 11 only), Competition secretary (flow 10 only) |
| Super admin | Every tenant | Existing Payload super-admin UI |

## 4. Configurable rules (per club)

Design for these as **settings, never hard-coded copy**. The defaults are for mock-ups only.

| Setting | Mock-up default | Where it shows |
|---|---|---|
| Advance booking window | Members 14 days, visitors 7 days | Tee sheet date strip greys out dates beyond the window |
| Tee interval | 8 or 10 minutes, per course | Tee sheet rows |
| Players per slot | 1–4 | Player picker, 4.2 |
| Holes | 9 / 18, per course | Filter and price |
| Amend and cancel cut-off | 24 hours before | 7.10 shown inside the cut-off |
| Refund policy | Full refund outside the cut-off | Shown before confirming (7.8) |
| Payment options | Pay now on; pay on the day on; card guarantee off; no-show fee off | 4.3, 4.5, 6.3 |
| Member-only time bands | e.g. weekends before 10:00 | Locked slot state |
| Opening hours | Per facility, by season, with exceptions | Footer, contact, activity availability |

## 5. Bookable things

- **Tee times:** per course, slot-based, fixed interval. Price is per player and varies by member/guest/visitor and by peak, off-peak, twilight and season.
- **Activities** (one engine, different resources):
  - Range bay and simulator: duration-based (30/60/90 minutes), optional ball buckets.
  - Snooker and pool table: duration-based.
  - Spa: treatment first (fixed duration), then therapist (any or named), then time.
  - Lessons: a pro is the resource; duration is set by lesson type.
- **Competitions:** block a time range on one course. Blocked slots are bookable only by entering the competition (8.3). Everyone else sees them greyed out with the competition name. Entry is either **book own time** or **ballot draw**. Unused slots can be released back to general play (10.8).

## 6. Slot states (extend the Tee Slot component)

Available · Selected · Held by you (with countdown) · Full · Members only (lock icon) · Competition (name shown) · Closed (course or facility) · Past.

Every state needs text or an icon as well as colour. Status colours come from `color/status/*`.

## 7. Prices and payment

- Show **price per player and the total**, VAT inclusive, in £ with pence only when it isn't .00.
- Member savings can be shown to signed-out users ("Members pay £X, sign in").
- Payment is Stripe Checkout through each club's own **Stripe Connect** account (9.15). Name Stripe before the hand-off.
- Amendments show old vs new and the price difference: a top-up, or a refund amount and timing (7.4).

## 8. Screen inventory (new templates)

| Template | Steps | States to design |
|---|---|---|
| Header and mega menu | 1.1, 1.2 | Signed out, signed in, sticky, course status chip |
| Mobile menu drawer | 1.3, 1.4 | Closed, open, sub-level |
| Footer | 1.10 | Hours, contact, newsletter (idle, success, error), legal |
| Search | 1.7–1.9 | Typing, results, no results |
| System pages | 1.15, 1.16 | 404, 500, maintenance, loading skeletons |
| Enquiry form (one, with a purpose selector) | 2.13, 3.1–3.4, 3.8 | Idle, inline errors plus summary, sending, sent |
| Booking steps | 4.2–4.12, 6.3–6.8 | Hold timer, hold warning, payment failed, empty, closed |
| Sign-in and account | 5.1–5.10 | Errors, lapsed, session expired |
| Member dashboard and bookings | 5.2, 7.1–7.12 | Empty (no bookings yet), upcoming, past |
| Competitions | 8.1–8.9 | Open, full with reserves, not eligible, ballot pending, results |
| Admin custom views | 9.3, 10.4, 10.7, 11.1 | Use the Payload admin look, **not** the tenant brand |
| Emails | Flow 12 | One shared layout in the tenant brand, plain-text fallback |

Everything else in the admin (lists, settings forms) is standard Payload collection UI. Don't design those screens.

## 9. Still open (don't block design, flag in the work)

- **Member account charges:** do clubs bill activities to a member's house account, or always by card?
- **Handicaps:** entered manually, or synced from England Golf / WHS? This affects competition eligibility (8.5).
- **Member search privacy:** when adding playing partners (7.7), show name only, or name plus membership category?
- **Waitlist (4.9):** automatic offer to the first in the queue, or notify everyone and first to book wins?
