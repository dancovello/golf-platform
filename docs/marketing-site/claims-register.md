# Marketing site: claims register

Every factual claim on the marketing site has a row here **before it ships** (hand-off §9, doc 19 honesty rules). A claim with no evidence doesn't ship.

**The test for every line:** if a club secretary screenshotted it and sent it back in six months, could we point to it working in production?

- **Status:** ✅ evidence in place · ⏳ not true yet, held back · ❓ needs checking
- **Test:** where an automated test proves it, name it. The test fails if the product stops matching the claim.

Seeded 2026-10-21 from the hand-off's list. **Doc 18's rows are still to add** (open question N2).

| Claim | Page | Evidence | Status | Test | Owner | Recheck |
|---|---|---|---|---|---|---|
| Unlimited editors | Pricing | No limit on editor accounts per club in the code (`src/collections/Users.ts`) | ❓ check no limit is planned for the price | To add: none needed if nothing limits it | Dan | Each pricing change |
| Hard-to-read colours are fixed for you | Website builder | Text colours swap to a passing one (WCAG AA 4.5:1), `src/theme/colour.ts` | ✅ (wording waits on Q5) | `tests/unit/theme-colour.spec.ts`, `tests/unit/curated-colours.spec.ts` | Claude | Each theme change |
| Photo descriptions (alt text) required | Accessibility, Website builder | **Not true for club sites:** optional since 17 Oct (open question N8) | ⏳ don't claim | — | Dan | — |
| Old addresses forward to the new site | Switching, FAQ | Extra domains forward to the main one (`forwardToMainAddress`, `src/site/routes/views.tsx`). **Old page addresses don't yet** (N7) | ⏳ partly | Domain forwarding: isolation and domain tests | Dan | Before Switching ships |
| Restore to any point in the last 7 days | Trust | Needs Neon Launch plan (Q6) | ⏳ | — | Dan | When the plan changes |
| Stored in London | Trust | Needs Neon, Vercel functions (`lhr1`) and R2 all set to London/UK (N6) | ⏳ | — | Dan | Each infrastructure change |
| Pages keep drafts until published | Website builder | Club pages have drafts with autosave (`src/collections/Pages.ts`) | ✅ | `tests/int/page-drafts.int.spec.ts` | Claude | — |
| Price £149 a month + VAT, 12-month minimum, then 90 days' notice | Pricing, FAQ | Dan's decision, 21 Oct (hand-off §3); VAT wording waits on Q2 | ✅ (Q2 pending) | Shown only from `marketingSettings` | Dan | Each price change |

## Researched proof stats

Used exactly as written, with the footnote (hand-off §9).

| Stat | Source | Status |
|---|---|---|
| 84% of visiting golfers are highly likely to visit a club's website before they visit | Golfshake survey, reported by The Golf Business, 13 Jan 2022 | ✅ |
| 64% of golfers research a course online before booking; around 75% of under-65s | Golfshake survey of 800+ golfers, 24 Jul 2026 | ✅ |
| Members rated their own club's website 3.44 / 5 | Golfshake member survey, via The Golf Business, Jan 2022 | ✅ |
| 46.1% of comments about a site's credibility were about its visual design | Stanford Persuasive Technology Lab (Fogg et al.), 2002 | ✅ |
| 53% of mobile visits are abandoned if a page takes over 3 seconds | Google, The Need for Mobile Speed, 2016 | ✅ |

Retired, never use: the top-100 audit stat (26 of 93), and "0 of 4 providers publish prices".
