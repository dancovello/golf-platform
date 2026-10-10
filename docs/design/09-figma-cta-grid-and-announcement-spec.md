# CTA Card Grid + Announcement Bar — Figma build spec (desktop, v1)

Figma file: AI-Testing (`GXzYibwnWKKyTeUkwRn8Of`). Colour rules: `08-brand-colour-contract.md`. Every component binds to `color/*` roles only. Both pages were audited: 255 colour bindings, none unbound or broken. Each component set's Figma description holds the full dev spec.

Shared parts (icons, Button, Carousel Arrow, Status Chip and the rest) now live on the **Shared components** page.

## CTA Card Grid (page: CTA Card Grid)
**CTA Card** is one component set with `Style = Editorial | Immersive | Index`. Its properties are Title, Description, Show description, Eyebrow and Number. The whole card is one link.

| Option | Inspiration | Section bg | Card | Columns | Variants |
|---|---|---|---|---|---|
| A · Editorial | Cabot | color/surface/canvas | Raised card, 4:3 image, title, line, link | 3 | Count = 3 / 6 |
| B · Immersive | Wentworth, Meritage | color/surface/brand | 4:5 full-image card, scrim, uppercase serif title, glass arrow | 3 | Count = 3 / 6 |
| C · Index | Masters | color/surface/subtle | Square image (4:3 at 3-up), numbered title on a hairline rule | 4 (or 3) | Count = 3 / 4 |

Rules: 3–6 equal cards. Columns go 3 on desktop → 2 on tablet → 1 on mobile; B becomes a scroll-snap row on mobile. Gap 24; section padding 96/40. Titles are 2–4 words. CMS fields: eyebrow?, heading*, cards[3–6]{title*, description?, eyebrow?, image* + alt*, link*}.

## Announcement Bar (page: Announcement Bar)
| Option | Layout | Tones | Use when |
|---|---|---|---|
| A · Classic | Centred message + link, dismiss right | Brand / Accent / Subtle | One time-bound notice |
| B · Rotator | Accent tag, message, link, prev/next, count, dismiss | Subtle / Brand | 2–3 concurrent notices (auto-advance 6s, pauses on hover/focus or reduced motion) |
| C · Utility | Message + "until" chip on the left; live course status + phone on the right | Brand / Subtle | Clubs that want a permanent utility strip |

Rules: min height 44, one line, sits above the header (not sticky). Dismissal persists for the session (sessionStorage). `expiresAt` is required and the bar auto-hides after it. Message is capped at 90 characters. Accent tone uses `color/action/on-accent` for text.

## Frames
Each page has one Desktop frame per option, plus a "Tenant preview" frame locked to the *Demo · Coastal links* theme.
