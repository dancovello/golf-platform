# Brand colour contract (tenant theming)

This contract applies to every component on every page of the Figma file (AI-Testing, `GXzYibwnWKKyTeUkwRn8Of`) and to the built site. The living reference is the **Branding — tenant inputs & component roles** board on the Figma **Colours** page.

## Rule 1 — a club sets five colours
The backend Branding page (Site Settings global) exposes exactly these fields:

| Field | CSS variable | Default tenant |
|---|---|---|
| Primary | `--brand-primary` | #1B2A22 forest |
| Secondary | `--brand-secondary` | #717E6A sage |
| Accent | `--brand-accent` | #B39462 brass |
| Light | `--brand-light` | #FAF7F1 cream |
| Dark | `--brand-dark` | #111814 ink |

## Rule 2 — components never use the brand inputs or raw hex
Every fill, stroke and text colour binds to a `color/*` role in the Figma **Theme** collection. The brand inputs are hidden from Figma's pickers. A component bound to `brand/*`, or to a hard-coded hex value, is a defect.

## Rule 3 — every role is either an alias, a derivation or a system colour
| Role | Rule |
|---|---|
| color/surface/canvas | = Light |
| color/surface/raised | system white |
| color/surface/subtle | color-mix(in srgb, Secondary 12%, Light) |
| color/surface/brand | = Primary |
| color/surface/glass | Light at 10% (+ 16px backdrop blur) |
| color/overlay/scrim · clear | Shade at 55% · 0% (never less than the photo's own shade, see Rule 5) |
| color/overlay/lightbox | Shade at 95% — full-screen media viewer |
| color/action/accent | = Accent (primary CTA, link underline, active tab; ≤10% of any screen) |
| color/action/on-accent | auto: Light or Dark, whichever has higher contrast on Accent (Rule 4 fallback) |
| color/action/solid | = Primary |
| color/action/on-solid | auto: Light or Dark, whichever has higher contrast on Primary (Rule 4 fallback) |
| color/text/primary | = Dark (Rule 4 fallback) |
| color/text/secondary | color-mix(in srgb, Dark 68%, Light), else text/primary |
| color/text/brand | color-mix(in srgb, Secondary 70%, Dark) — eyebrows on light; else text/primary |
| color/text/on-inverse | On photos: the lighter of Light and Dark. On brand surfaces: = on-solid |
| color/text/on-inverse-muted | on-inverse at 80% (on brand surfaces, only if it still passes) |
| color/text/accent | color-mix(in srgb, Accent 75%, white) — eyebrows on dark and imagery; else Accent, then a mix towards on-inverse, then on-inverse |
| color/border/subtle | color-mix(in srgb, Dark 12%, Light) |
| color/border/strong | = text/primary |
| color/border/on-inverse · on-inverse-subtle | on-inverse at 40% · 16% |
| color/status/open · restricted · closed | system, not brandable |
| color/tee/white · yellow · red · blue | system, not brandable — real-world tee colours. Always paired with a text label. |

There are 29 roles in total. Image gradients (hero, cards, hole cards) and the static map are built from the tenant tokens too, so they follow the brand.

## Rule 4 — every text colour is contrast-checked (changed 2026-10-20)
Clubs can save any five colours. Each text role is checked against the background it sits on, at WCAG AA (4.5:1). If the designed colour fails, the next candidate in its Rule 3 formula is tried, and if every candidate fails, white or black is used, whichever reads better. One of white and black always reaches 4.5:1, so every palette gives a legible site.

| Text on… | Checked against |
|---|---|
| The page, white cards and the light tint (text/primary, secondary, brand) | Light, white and surface/subtle, all three |
| Brand surfaces: bands, the dark footer, recommended tiers, solid buttons (on-inverse, muted, accent, on-solid) | Primary |
| Accent buttons and tags (on-accent) | Accent |
| Photos (on-inverse, muted, accent) | The photo after shading (Rule 5) |

The "Shade" in Rule 3 is the darker of Light and Dark, or black if the two are too close to tell apart.

In code, a surface sets its own text colours with a class: `.on-brand` for the brand colour and `.on-image` for a photo (which also carries that photo's shade). The old save check, which refused palettes that failed, has been removed.

Logos are chosen the same way. Each uploaded logo's average colour is measured, and the logo that reaches 3:1 (AA for graphics) on the actual background is used: the one uploaded for that background first, then the other. If neither reaches it, the logo is shown in white or black.

## Rule 5 — photos are shaded until their text reads
Every photo's brightest areas (the 90th percentile of a 24 × 24 sample) are measured on upload. A photo with text over it is never shaded less than the amount that brings on-inverse, its 80% version, and a glass button up to 4.5:1 over those areas. Darker photos keep the designed gradients unchanged. Photos uploaded before this was added are measured the first time a page shows them. Until then they are treated as white, the safe extreme.

**Check:** `tests/visual/contrast.spec.ts` runs axe's contrast rule over every block and template page for three clubs, one with a pale brand colour and too-faint text. `tests/unit/theme-colour.spec.ts` checks 2,000 random palettes and photos.

## Implementation notes
- **CSS.** Emit the five `--brand-*` values and the contrast-checked `--ink-*` text colours per tenant (`src/theme/colour.ts`). Define every `--color-*` role once in the base stylesheet (`src/theme/theme.css`).
- **Figma.** Not yet updated for Rules 4 and 5: the Theme collection still uses the fixed text formulas. The two Figma tenants are unaffected (every designed colour passes), but a third tenant with a pale Primary would need the fallbacks applied by hand. Each tenant is a mode on the Theme collection. Derived roles store pre-computed values per mode; the formula lives in each variable's description. To add a tenant, add a mode, set the five `brand/*` values, then run the derive script, which uses the same formulas.
- **Proof.** Every page has "Tenant preview" frames locked to the second mode, *Demo · Coastal links*, showing a full re-theme with no component edits. Colour audits across all 19 component pages: 3,438 bindings — all bound to roles.
