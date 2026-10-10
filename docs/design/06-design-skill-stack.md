# Design & Build Skill Stack

Which Claude skills this project uses, what each one is for, and which were considered and rejected. Researched 30 Sep 2026 from the skills.sh registry (install counts below are from there), the source repos, and hands-on tests in a Claude workspace.

## The principle

One skill per job, and never two skills fighting over taste. The project docs (`02`, `04`, `05`) are the design authority. Skills add craft and checks around them; they don't override them.

## The stack

| Job | Skill | Source | Status |
|---|---|---|---|
| Build Payload correctly (collections, fields, hooks, access control, queries) | `payload` | `payloadcms/skills` (official, Payload team) | Have |
| Figma frame → faithful block | `design-to-block` | Custom, in `.claude/skills/design-to-block/` | Have |
| Read Figma properly before coding | `figma-design-to-code` | `figma/mcp-server-guide` (official, Figma) | Have |
| Aesthetic direction, anti-generic rules | `design-taste-frontend` | `leonxlnx/taste-skill` (541K installs) | Have |
| Code-level UI review (a11y, forms, focus, typography) | `web-design-guidelines` | `vercel-labs/agent-skills` (685K) | Have |
| Live-page audit: accessibility, Core Web Vitals, SEO | `web-quality-audit` + `accessibility`, `core-web-vitals`, `seo` | `addyosmani/web-quality-skills` (MIT) | Have |
| React / Next.js performance patterns | `vercel-react-best-practices` | `vercel-labs/agent-skills` (759K) | Have |
| Club onboarding: pull brand colours/fonts from a club's current site | `extract-design-system` | `arvindrk/extract-design-system` (130K) | Have |
| Real browser: screenshots, tests, rechecks | `playwright-cli` | Microsoft, `@playwright/cli` | Have |
| Motion and interaction polish | `emil-design-eng` | `emilkowalski/skills` (MIT) | Have |

## Why each addition earns its place

- **payload** - the single most important gap. Written by the Payload team; its reference files cover access control in depth, which is exactly where doc 04 says a multi-tenant bug would end the business.
- **figma-design-to-code** - Figma's own instructions for using its design-context tool well. Runs underneath `design-to-block`, not instead of it.
- **web-quality skills** - `web-design-guidelines` reviews code; these audit the rendered page. SEO matters here: visitors find green fees through Google, and a faster, better-indexed site is a real selling point against the `intelligentgolf` incumbents.
- **vercel-react-best-practices** - keeps block components fast (server components, no waterfalls, bundle size) across every club's site at once.
- **extract-design-system** - tested on wentworthclub.com: it pulled Wentworth's sage-green palette and display typeface in about a minute. That is onboarding step 2 in doc 04 (entering a club's branding into Site Settings) turned into a starting point instead of manual eyedropping. Output still needs a human check against the club's brand guidelines.
- **emil-design-eng** - optional. Useful for the small amount of motion the design direction allows (hovers, carousels, reveals) to feel considered rather than stock.

## Considered and rejected

- **ui-ux-pro-max** (377K) - a large database of styles, palettes and font pairings. Pushes toward picking from a catalogue, which conflicts with each club's own brand being the source of truth.
- **impeccable** (303K) - high quality, but overlaps heavily with `design-taste-frontend`. Two taste rulebooks give conflicting instructions. Revisit only if the taste skill disappoints.
- **Other taste-skill variants** (minimalist, soft, brutalist, image-gen) - aesthetic presets, and the image-gen ones need an image tool Claude doesn't have here.
- **shadcn / Tailwind skills** - hold until the component stack is decided. If Tailwind v4 is chosen, add the matching skill then.
- **"payload-cms" by Membrane** - for reading and writing data in an existing Payload site, not for building one.
- **anthropics `frontend-design`** - already built into Claude.
- **daisyUI skill** - promotes a component library the template won't use.

## How they work together on one block

1. Design in Figma → `figma-design-to-code` + `design-to-block` build it, following doc 05.
2. `payload` shapes the block's fields and access rules.
3. `vercel-react-best-practices` and `design-taste-frontend` keep the component fast and non-generic.
4. `playwright-cli` screenshots it against the Figma frame, with a second club's tokens swapped in.
5. `web-design-guidelines` reviews the code; `web-quality-audit` audits the rendered page.

## Keeping skills available

Skills installed in a chat last only for that chat. For use in every conversation, each needs uploading in Claude's Skills settings. The custom `design-to-block` skill lives in this repo at `.claude/skills/design-to-block/SKILL.md`.
