---
name: design-to-block
description: Build golf-platform Payload blocks and pages from Dan's designs. Use when given Figma frames, screenshots or reference-site images and asked to build, match or implement them in the club template, or when asked to turn a design into a block.
---

# Design to Block (Golf Websites platform)

Turns a supplied design (Figma frame, screenshot, or a reference-site capture) into a faithful, production-ready block for the multi-tenant golf club template. Adapted for Claude from the MIT-licensed `image-to-code` skill (github.com/Leonxlnx/taste-skill): same analysis discipline, but it works from designs Dan supplies instead of generating its own images.

## Project context to load first

Read these project docs before building anything. They win over anything in this skill if they disagree:

- `docs/product/02-content-model-and-block-library.md` - which block this is, its fields, which collection feeds it, its build phase.
- `docs/design/05-block-design-direction.md` - system rules (8px spacing, 1.25 type scale, one accent at ~10%, fixed crop ratios, motion timings, accessibility) and the do/avoid list for this block.
- `docs/architecture/04-infrastructure-architecture-and-guardrails.md` - only colours, fonts, logo and structured content vary per club. No custom CSS, no per-club scripts.
- `docs/design/08-brand-colour-contract.md` - components use `color/*` roles only, never raw hex or the five brand inputs.

## 1. Get the design

Accept, in order of preference:

1. **Figma frame** - if the Figma connector is available, use it: `get_screenshot` for the visual, `get_design_context` for structure and measurements, `get_variable_defs` for colour and type tokens. Measured values beat estimates from a picture.
2. **Attached image or screenshot** - one image per section, large enough to read the text. If several sections are squeezed into one small image, ask for them separately.
3. **Audited reference site** (e.g. Woburn, Hillside from `docs/product/01-research-club-list.md`) - treat as inspiration for structure only; never copy its branding, copy or photography.

There is no image generation here. If a detail is unreadable or missing (a hover state, mobile layout, button padding), ask Dan for a closer frame or the specific state. Ask once, listing every gap together. Do not invent it silently.

## 2. Analyse before coding

Treat the design as a spec, not a mood. Write short extraction notes covering:

- **Purpose** - which block from the library this is, and the one job it does on the page.
- **Text** - every readable string: headline, subhead, CTA labels, labels. Mark which are CMS fields and which are fixed UI copy.
- **Type** - size relationships, weights, line counts, line-height feel, display vs body face. Map to the 1.25 scale steps rather than one-off sizes.
- **Spacing** - gaps between headline, body, buttons; section padding; gutters; card padding. Snap to the 8px grid.
- **Components** - button shape, fill/outline hierarchy, radius, borders, dividers, shadows, icon use, card structure.
- **Colour** - which colours are brand (become Site Settings tokens) and which are neutral system colours. Note where the accent is used.
- **Media** - crop ratio of every image slot, checked against the fixed ratios in doc 05.
- **Responsive** - how it collapses on mobile, if shown; if not shown, flag it as a gap.
- **Unclear** - anything you cannot read or infer confidently.

## 3. Translate into the platform, not a one-off page

- **Tokens, never hard-coded brand values.** Every brand colour, typeface and logo reference reads from the tenant's Site Settings global via CSS variables. The design's specific green or serif is just one club's values; the block must look right when another club's tokens are swapped in.
- **Content lives in fields.** Headline, body, images, CTAs, and list items become Payload block fields (or come from the relevant collection). Alt text is a required field on every image.
- **Structure.** Each block is a Payload block config (fields) plus one React component. Server Component by default; motion or interaction goes in an isolated `'use client'` leaf.
- **Respect doc 05's rules.** One dominant CTA, accent at ~10% of the screen, carousels no faster than 5s with pause, reduced-motion honoured, 4.5:1 contrast, 44px tap targets.

## 4. Build faithfully (anti-drift)

The common failure is a strong design that turns generic in code. During implementation:

- Keep the layout logic, spacing rhythm, text/image balance and type contrast of the design.
- Don't simplify into a default template, tighten generous spacing, or flatten strong typography.
- Don't add things that weren't in the design: extra pills, badges, eyebrows, status dots, decorative labels, or cards nested inside cards.
- Use boxes only when they carry hierarchy; prefer open layouts and whitespace.

When a design detail conflicts with doc 05 (for example, three competing CTAs, or text below contrast), follow doc 05 and say so in one line.

## 5. Check the result

1. Render the block (or the page containing it) and screenshot it at desktop and mobile widths.
2. Compare side by side with the source design. List any visible differences and fix them, or explain why they're intentional.
3. Swap in a second, contrasting set of test tokens (different accent and typefaces) and confirm it still looks deliberate. This is the multi-club test.
4. If the `web-design-guidelines` skill is available, run it on the new files.

## 6. Report back

Keep it short:

- One line: which block, built from which design.
- Deviations from the design, and why.
- Open gaps you had to ask about or assumed.
- Screenshots of the result.
