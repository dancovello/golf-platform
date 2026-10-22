# Marketing site: open questions for Dan

One running list (hand-off §13). Update as answers come in; move answered items to the bottom with the date.

Each has a safe default so building isn't blocked. The default is what ships until Dan answers.

## Open

| # | Question | Needed by | Default until answered |
|---|---|---|---|
| Q2 | **VAT registered?** Decides how every price is written | Phase 5 (Pricing) | "+ VAT" from one setting (`priceVatLabel`) |
| Q3 | **Second course price.** The calculator has a one/two courses stepper | Phase 5 (Pricing) | Price from settings, flagged in the claims register |
| Q4 | **Demo booking calendar.** Which calendar, and your real weekday availability | Phase 5 (Book a demo) | Cal.com behind our own screens, checked for cost first. Until wired: the email address |
| Q5 | **Colour copy on Website builder.** See the finding below | Phase 6 (Website builder) | The line stays hidden |
| Q6 | **Neon plan.** The Trust page's "restore to any point in the last 7 days" needs the Launch plan (about £5–£20 a month) | Phase 6 (Trust, held) | Value from settings; not published until confirmed |
| Q7 | **Changelog at launch?** | Phase 6 | Built, unpublished, kept out of nav and footer |
| Q8 | **Product film** on Website builder: is there a video? | Phase 6 | Section left out |
| Q9 | **Analytics.** Vercel Analytics only (no cookies)? | Phase 8 | Vercel Analytics only, so no consent banner. Cost on Pro checked first |
| Q10 | **Founder Card:** photo, a first-person line under 60 words, phone or calendar link | Phase 4 | Placeholder initial; links from settings |
| Q11 | **Public prices or per-club quotes?** Pricing isn't final and may differ by club. Quotes would mean removing the £149, the calculator and the Pricing page (21 Oct) | Phase 5 (Pricing, nav, CTA bands, FAQ) | Built as designed, every price from `marketingSettings`, with one switch (`showPublicPricing`) that hides the Pricing page, its nav link and every price mention. The one-off setup fee is stated wherever a price appears, never with a number |
| Q12 | **Contract terms.** The 12-month minimum and 90 days' notice aren't final (21 Oct) | Phase 5 (Pricing, FAQ) | From `marketingSettings`; flagged ❓ in the claims register |
| N1 | **Company name and domain** | Phase 10 (go live) | "Brandname" and `hello@brandname.golf`, in one file |
| N2 | **Docs 15 and 18** (golf ball; marketing review and claims) | Doc 18: claims register. Doc 15: phase 7 | Register seeded from the hand-off's list only |
| N3 | **`golf_ball.glb` and `golf-ball-generator.py`** | Phase 7 | — |
| N4 | **Company privacy policy, cookie notice and terms** wording | Phase 6 | Pages built, unpublished |
| N5 | **Image licences** for the hero, two-column and accessibility photos | Phase 4 | Clearly licensed stock or demo pictures, captioned as demo clubs |
| N6 | **Vercel functions in London?** Needed before the Trust page can say "Stored in London" (doc 03) | Phase 6 (Trust, held) | The line stays out |
| N7 | **Old page addresses.** The Switching page and FAQ promise old page addresses forward to the new ones. Today the platform forwards a club's *extra domains* (e.g. without `www`), but not old page addresses like `/about-us.php`. Build page forwarding, or soften the copy? | Phase 5 (Switching) | Claim held back until decided |
| N8 | **"Alt text required."** For club photos, the description is optional (your decision, 17 Oct); the library marks missing ones "Needs description". The marketing site's own Media block will require it. | Before any copy says it | Not claimed for club sites |
| N9 | **Search in the nav.** Figma's nav has a Search button, but the marketing site has no search for it to open. Add site search later, or remove it from Figma? | Phase 8 | Left out |

### Finding for Q5 (from the code, 2026-10-21)

Club sites **never block a save** over colour. If a text colour would be hard to read on its background, the site swaps it for the club's other text colour, or white or black, so it passes WCAG AA (`src/theme/colour.ts`). The Branding page also suggests curated shades that never need swapping. So doc 08's "blocked on save" doesn't match the product; "nudged" is closer. The copy should describe the swap.

## Design notes (Figma vs accessibility)

Places where the build differs from Figma to meet WCAG 2.2 AA. Update Figma or tell me to change them back.

| # | Where | Figma | Built | Why |
|---|---|---|---|---|
| D1 | Tenant Chip, selected: the style label ("Heritage") | `text-tertiary` #8a968f on `surface-hover` #173327 | `text-secondary` #a3ada6 | Tertiary is under 4.5:1 on that surface |
| D2 | Home proof stats | Claim wording from Figma, sources slightly different | Figma's claim wording, the hand-off's exact source lines (§9: "use exactly these") | The hand-off ranks above Figma for sources; Figma's claim wording reads better |
| D3 | Home "Your content comes with you" | Example windows on `ashgroveparkgc.co.uk` | On `ashgrovepark.golf`, labelled "Demo club" | A realistic `.co.uk` could be a real club; the counts are an example |
| D4 | Home "Edit and live" | Live hero headline on two lines | Three lines | The club hero limits headlines to 16 characters a line; the card grows to fit |
| D5 | Home "A week at the club" header | Bold "Whoever's on duty can post it" | Plain text | Section Header bodies are plain text (CMS rules) |

## Answered

| # | Question | Answer | Date |
|---|---|---|---|
| Q1 | Run the marketing site inside the platform? | Yes (decision A) | 2026-10-21 |
| — | Committee summary A4 | Removed. Not built | 2026-10-21 |
