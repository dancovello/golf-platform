# Marketing site: claims register

Every factual claim on the marketing site has a row here **before it ships** (hand-off §9, doc 19 honesty rules). A claim with no evidence doesn't ship.

**The test for every line:** if a club secretary screenshotted it and sent it back in six months, could we point to it working in production?

- **Status:** ✅ evidence in place · ⏳ not true yet, held back · ❓ needs checking
- **Test:** where an automated test proves it, name it. The test fails if the product stops matching the claim.

Seeded 2026-10-21 from the hand-off's list. **Doc 18's rows are still to add** (open question N2). Updated 2026-10-21 (evening) for Dan's decisions after the product grilling: paid setup, no free homepage, no fixed switching timeline, pricing under review.

| Claim | Page | Evidence | Status | Test | Owner | Recheck |
|---|---|---|---|---|---|---|
| Unlimited editors | Pricing | No limit on editor accounts per club in the code (`src/collections/Users.ts`) | ❓ check no limit is planned for the price | To add: none needed if nothing limits it | Dan | Each pricing change |
| Hard-to-read colours are fixed for you | Website builder | Text colours swap to a passing one (WCAG AA 4.5:1), `src/theme/colour.ts` | ✅ (wording waits on Q5) | `tests/unit/theme-colour.spec.ts`, `tests/unit/curated-colours.spec.ts` | Claude | Each theme change |
| Photo descriptions (alt text) required | Accessibility, Website builder | **Not true for club sites:** optional since 17 Oct (open question N8) | ⏳ don't claim | — | Dan | — |
| Old addresses forward to the new site | Switching, FAQ | Switching no longer promises a four-week plan (21 Oct); this claim is only about redirects. Extra domains forward to the main one (`forwardToMainAddress`, `src/site/routes/views.tsx`). **Old page addresses don't yet** (N7) | ⏳ partly | Domain forwarding: isolation and domain tests | Dan | Before Switching ships |
| Restore to any point in the last 7 days | Trust | Needs Neon Launch plan (Q6) | ⏳ | — | Dan | When the plan changes |
| Stored in London | Trust | Needs Neon, Vercel functions (`lhr1`) and R2 all set to London/UK (N6) | ⏳ | — | Dan | Each infrastructure change |
| Pages keep drafts until published | Website builder | Club pages have drafts with autosave (`src/collections/Pages.ts`) | ✅ | `tests/int/page-drafts.int.spec.ts` | Claude | — |
| Price £149 a month + VAT, 12-month minimum, then 90 days' notice, plus a one-off setup fee agreed with each club | Pricing, FAQ | **Pricing is under review** (hand-off Q11 and Q12, 21 Oct): public prices may be replaced by per-club quotes, and the contract terms aren't final. VAT wording waits on Q2. The setup fee never has a number on the site | ❓ waits on Q11, Q12 and Q2 | Shown only from `marketingSettings` | Dan | Each price change |
| Update in minutes (home hero) | Home | Editing a block and publishing is a few fields and a button; not timed yet | ❓ time a real edit (e.g. green fees) and record it | — | Dan | Before launch |
| Tee-time booking is coming next | Home, nav | Bookings is an optional paid add-on in phase 2 (21 Oct); until then a club's site links to its current booking system. Shown with the Coming next clock | ✅ | Nav test checks the clock | Claude | Each release |
| AI copies your pages, news, photos and PDFs | Home, Switching | Part of the paid setup (hand-off §3, 21 Oct): AI copies the content, Dan builds the site with the club and supports it until live. No timeline promised | ✅ (service, not software) | — | Dan | — |
| Week moments: course status, news, green fees, hole guide are live blocks | Home | `courseStatus`, `newsFeed`, `rateTable`, `holeGrid` blocks exist and are tested | ✅ | Block integration tests | Claude | — |

## Never use

These claims are withdrawn (Dan, 21 Oct, hand-off §9). They must not appear on any page, in any button, email, meta description or alt text. Code that still uses them must be changed before launch.

| Wording | Why |
|---|---|
| "Free homepage", "Get your free homepage", or calling the example homepage free | The example homepage is shown in the demo only. It's never sent and isn't the club's until they sign |
| "No setup fee" | Setup is a paid, one-off fee agreed with each club |
| "Four weeks", "Weeks 1–4", "in two working days", or any other fixed switching timeline or date | No timeline is promised. Dan supports the club until the site is live |
| "Send it straight to you" | The example homepage is never sent |
| A "works with" list of booking systems, or any provider's name | Clubs without the Bookings add-on get a link to their current system, nothing more |

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
