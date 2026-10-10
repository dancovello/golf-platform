# Course Status → Cookie Consent — Figma build spec (desktop, v1)

Figma file: AI-Testing (`GXzYibwnWKKyTeUkwRn8Of`). Colour rules are in `08-brand-colour-contract.md`. Each component's Figma description holds its full dev spec: layout, responsive behaviour, behaviour/accessibility and CMS fields. Every page has one Desktop frame per option plus a Tenant preview in the *Demo · Coastal links* theme. Colour audit across these 13 pages: 1,466 bindings, all bound to roles and none broken.

> Note: the Tee-Time Booking block assumes a third-party provider hand-off. `12-booking-and-accounts-design-brief.md` adds a native booking mode, which is out of scope for v1.

**Shared additions** (on the Shared components page):
- **Icons:** Plus, Minus, Check, File, Download, Pin, Clock, Search, Mail, Expand, Sun, Cloud, Wind, Lock.
- **Components:** Toggle, Tag (Accent / Neutral / Outline) and Text Input.

| Page | A | B | C | New building blocks |
|---|---|---|---|---|
| Course Status | Board: headline state, reason, who/when, facility list | Band: brand strip under the hero, 4 statuses + weather | Widget: 380px sidebar card, `Status = Open / Restricted / Closed` | — |
| Membership | Tier cards: 3-up, one recommended in the brand colour | Compare: feature matrix, recommended column tinted | Enquire: no public prices, availability tags, qualifying question + call-back | Membership Tier Card (`Recommended`) |
| Tee-Time Booking | Search: shared Booking Bar + provider note + phone + quick picks | Slot picker: date strip, course filter, slot grid, sticky summary | Drawer: 480px from the header CTA, 3 steps + provider hand-off | Tee Slot (`Available / Selected / Full`), Date Chip |
| Gallery | Masonry with album tabs | 1:1 grid + Load more | Lightbox: full-screen, thumbnails, keyboard + swipe | — |
| Document List | Grouped by category | Cards (3-up) for the visitor essentials | Searchable table + category tabs | Document Row |
| Map / Location | Split: map + address/contact | Full-bleed map + floating card | Getting here: car/train/air cards + map strip | Static Map (token-driven, re-themes per tenant) |
| Rich Text | Article: 680px column | With contents: sticky table of contents | Editorial: lead + drop cap + aside | — |
| Pull-Quote | Centred | Over image (uniform scrim) | Split with press source tag | Quote/L and Quote/M text styles |
| Timeline | Alternating spine with images | Horizontal scroll on the brand colour | Ledger: sticky intro + ruled list | — |
| Partner / Logo Strip | Row (≤6) | Ruled 3×2 grid + intro | Marquee on the brand colour | Logo Slot (On light / On dark). Wordmarks are placeholders |
| FAQ / Accordion | Centred | With contact card | Search + topic tabs | Accordion Item (`Closed / Open`) |
| Team / Staff | 4-col portrait grid | Directory by department | Featured lead + side list | Portrait (`Card / Avatar`), with an initials fallback until photos exist |
| Cookie Consent | Bottom bar | Floating card | Preferences modal with category toggles | — |

## Rules worth flagging for the build
- **Booking:** always name the provider before the hand-off and keep the phone fallback visible. B (Slot picker) needs a provider availability API; without one, fall back to A.
- **Course status:** status dots use the system `color/status/*` colours, always alongside words. If the status is more than 24h old, replace it with an honest "not updated today" message.
- **Documents:** policies require a "last reviewed" date. Rows older than 12 months are flagged, never hidden.
- **Cookies (UK GDPR / PECR):** nothing non-essential loads before consent, and categories are off by default. "Reject all" and "Accept all" are equal prominence in every option. Consent lasts 6 months and is re-requested when the policy version changes.
- **Lightbox:** the backdrop uses the new role `color/overlay/lightbox` (tenant Dark at 95%).
- **Map:** production renders a static map image styled from the tenant tokens. The interactive map loads on click only.

## Still needed from clubs
- Staff portraits
- Partner logos (SVG)
- Real map tiles/style key
- Booking provider API access (for Tee-Time B/C)
