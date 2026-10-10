# Hero — Figma build spec (desktop, v1)

Figma file: AI-Testing (`GXzYibwnWKKyTeUkwRn8Of`), page **Hero (image or video)**. Every component set has the full dev spec in its Figma description. This doc is the summary that AI build agents should read alongside them.

## Foundations (variables + styles in the file)
- **Colour**: see `08-brand-colour-contract.md`. The **Theme** collection holds 5 tenant inputs (`brand/*`) and 24 component roles (`color/*`). Components bind only to roles. Each mode is one tenant.
- **Layout** (mode = Desktop): `space/4…160` (8px base), `radius/*`, `size/container` 1200, `size/nav-clearance` 136, `size/hero-height` 880, `size/control` 48.
- **Text styles**: Display/XL (Cormorant Garamond Light 96), Display/L (76), Display/Caps (Cormorant Regular 68, uppercase), Eyebrow (DM Sans Medium 12, +18%, uppercase), Body/L, Body/M, Label/Button, Label/S, Data/*, Caption (Cormorant Light Italic 18). These are the default tenant pair; typefaces are swapped per club through Site Settings.

## Building blocks
Icon set (24px line), Button (Style: Accent / Solid / Outline / Link × Surface: Light / Dark), Media Control (Playing/Paused), Scroll Cue, Carousel Arrow, Pager, Status Chip (Open/Restricted/Closed), Booking Field, Booking Bar.

## Hero options (each a component set with `Media = Image | Video`)
| Option | Inspiration | Composition | Primary CTA |
|---|---|---|---|
| A · Heritage | Wentworth | Full-bleed, uppercase serif headline bottom-left above a hairline rule, controls bottom-right | Outline (Dark) + Link |
| B · Resort | Cabot, Meritage | Centred serif headline on `color/surface/brand`, inset 1200-wide media straddling into the canvas, caption + pager | Accent + Link |
| C · Booking-led | Masters | Full-bleed, live course-status chip, Display/XL headline, embedded tee-time search bar | Booking Bar (only CTA) |

## Shared rules (from doc 05)
- Hero height `clamp(640px, 85vh, 960px)`. Option B hugs its content.
- Container max-width 1200, centred; min side gutter 40. Top padding is 136 so a transparent header can overlay.
- Media is absolutely positioned with `object-fit: cover`. Video is muted, looping, `playsinline`, 6–12s, with a poster. The play/pause control is mandatory. Under `prefers-reduced-motion`, show the poster only.
- Scrim on full-bleed heroes: `linear-gradient(180deg, color-mix(in srgb, var(--brand-dark) 40%, transparent) 0%, transparent 22%, color-mix(… 25% …) 45%, color-mix(… 82% …) 100%)`. It's for legibility only, never a colour tint. (Strengthened in doc 13 — see there.)
- Copy is max 4 elements: an optional eyebrow, a 5–8 word headline (max 2 lines), and max 2 CTAs. No stats or trust strips inside the hero.
- Option C requires a connected Booking Integration; otherwise fall back to A or B.

## Imagery
Media slots use photos from the file's **Images for use** page: A uses the heathland pines shot, B the lakeside resort at sunset, and C the clubhouse aerial.

## Open items
- Tablet and mobile variants are not built yet (mobile: see `13-mobile-components-spec.md`).
