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
| color/overlay/scrim · clear | Dark at 55% · 0% |
| color/overlay/lightbox | Dark at 95% — full-screen media viewer |
| color/action/accent | = Accent (primary CTA, link underline, active tab; ≤10% of any screen) |
| color/action/on-accent | auto: Light or Dark, whichever has higher contrast on Accent |
| color/action/solid | = Primary |
| color/action/on-solid | auto: Light or Dark, whichever has higher contrast on Primary |
| color/text/primary | = Dark |
| color/text/secondary | color-mix(in srgb, Dark 68%, Light) |
| color/text/brand | color-mix(in srgb, Secondary 70%, Dark) — eyebrows on light |
| color/text/on-inverse | = Light |
| color/text/on-inverse-muted | Light at 80% |
| color/text/accent | color-mix(in srgb, Accent 75%, white) — eyebrows on dark and imagery |
| color/border/subtle | color-mix(in srgb, Dark 12%, Light) |
| color/border/strong | = Dark |
| color/border/on-inverse · on-inverse-subtle | Light at 40% · 16% |
| color/status/open · restricted · closed | system, not brandable |
| color/tee/white · yellow · red · blue | system, not brandable — real-world tee colours. Always paired with a text label. |

There are 29 roles in total. Image gradients (hero, cards, hole cards) and the static map are built from the tenant tokens too, so they follow the brand.

## Rule 4 — validate on save
The Branding page must check contrast before saving:
- text/primary, text/secondary and text/brand on canvas: at least 4.5:1
- on-accent on accent, and on-solid on primary: at least 4.5:1

If a check fails, block the save and explain why. Both tenants in the file pass; the lowest pairing is 5.17:1.

## Implementation notes
- **CSS.** Emit the five `--brand-*` values per tenant on `:root`. Define every `--color-*` role once in the base stylesheet using the formulas above. The on-colours are computed server-side when the branding is saved.
- **Figma.** Each tenant is a mode on the Theme collection. Derived roles store pre-computed values per mode; the formula lives in each variable's description. To add a tenant, add a mode, set the five `brand/*` values, then run the derive script, which uses the same formulas.
- **Proof.** Every page has "Tenant preview" frames locked to the second mode, *Demo · Coastal links*, showing a full re-theme with no component edits. Colour audits across all 19 component pages: 3,438 bindings — all bound to roles.
