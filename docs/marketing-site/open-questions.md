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
| N1 | **Company name and domain** | Phase 10 (go live) | "Brandname" and `hello@brandname.golf`, in one file |
| N2 | **Docs 15 and 18** (golf ball; marketing review and claims) | Doc 18: claims register. Doc 15: phase 7 | Register seeded from the hand-off's list only |
| N3 | **`golf_ball.glb` and `golf-ball-generator.py`** | Phase 7 | — |
| N4 | **Company privacy policy, cookie notice and terms** wording | Phase 6 | Pages built, unpublished |
| N5 | **Image licences** for the hero, two-column and accessibility photos | Phase 4 | Clearly licensed stock or demo pictures, captioned as demo clubs |
| N6 | **Vercel functions in London?** Needed before the Trust page can say "Stored in London" (doc 03) | Phase 6 (Trust, held) | The line stays out |
| N7 | **Old page addresses.** The Switching page and FAQ promise old page addresses forward to the new ones. Today the platform forwards a club's *extra domains* (e.g. without `www`), but not old page addresses like `/about-us.php`. Build page forwarding, or soften the copy? | Phase 5 (Switching) | Claim held back until decided |
| N8 | **"Alt text required."** For club photos, the description is optional (your decision, 17 Oct); the library marks missing ones "Needs description". The marketing site's own Media block will require it. | Before any copy says it | Not claimed for club sites |

### Finding for Q5 (from the code, 2026-10-21)

Club sites **never block a save** over colour. If a text colour would be hard to read on its background, the site swaps it for the club's other text colour, or white or black, so it passes WCAG AA (`src/theme/colour.ts`). The Branding page also suggests curated shades that never need swapping. So doc 08's "blocked on save" doesn't match the product; "nudged" is closer. The copy should describe the swap.

## Answered

| # | Question | Answer | Date |
|---|---|---|---|
| Q1 | Run the marketing site inside the platform? | Yes (decision A) | 2026-10-21 |
| — | Committee summary A4 | Removed. Not built | 2026-10-21 |
