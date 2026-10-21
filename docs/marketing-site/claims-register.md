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
| Update in minutes (home hero) | Home | Editing a block and publishing is a few fields and a button; not timed yet | ❓ time a real edit (e.g. green fees) and record it | — | Dan | Before launch |
| No setup fee (home proof line) | Home, Pricing | Pricing decision; not yet in the hand-off's list | ❓ Dan to confirm | — | Dan | Each price change |
| Homepage rebuilt free in two working days | Home, Switching | Manual service, decided (hand-off §3); the date shown skips weekends and bank holidays (phase 5) | ✅ | Phase 5 form tests | Dan | — |
| Tee-time booking is coming next | Home, nav | Bookings is out of scope for v1; shown with the Coming next clock | ✅ | Nav test checks the clock | Claude | Each release |
| AI copies your pages, news, photos and PDFs | Home, Switching | Switching service decided (hand-off §3) | ✅ (service, not software) | — | Dan | — |
| Week moments: course status, news, green fees, hole guide are live blocks | Home | `courseStatus`, `newsFeed`, `rateTable`, `holeGrid` blocks exist and are tested | ✅ | Block integration tests | Claude | — |

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
| Hosting, security and backups included | Pricing | Nightly encrypted backups (`.github/workflows/backup.yml`), restore drill (`docs/operations/restore-runbook.md`) | ✅ | Backup workflow runs nightly | Claude | Each infrastructure change |
| Every live block, on every page | Pricing | No block is limited by plan or club (`src/blocks`) | ✅ | `tests/unit/access-guard.spec.ts` (no per-club gating) | Claude | When plans are added |
| We move your old site across (included in the price) | Pricing | A service, not a feature: Claude builds each club's pages from their content (onboarding approach) | ❓ confirm it's included at £149 | — | Dan | Each pricing change |
| {term}-month term, then rolling; {notice} days' notice | Pricing | Values from Settings; must match the contract terms (N4) | ❓ needs the terms | — | Dan | Each contract change |
| Leaving: pages and news as Markdown, files as originals, form entries as CSV | Pricing (FAQ) | **No self-service export exists** (N10). Possible as a manual export by us | ⏳ wording kept, delivered by hand until an export is built | — | Dan | Before Pricing ships |
| We follow UK GDPR; DPA sent before signing | Pricing (FAQ) | Privacy policy for club sites exists (`src/site/privacy/policy.ts`). **No data processing agreement document yet** | ❓ needs the DPA | — | Dan | Before Pricing ships |
| Your club email stays where it is | Pricing (FAQ) | The platform only serves the website; it never hosts or changes email (MX) records | ✅ | — | Claude | If email hosting is ever added |
| What moves across: public pages, news, PDFs and photos | Pricing (FAQ) | Manual onboarding service (Claude builds pages from the club's content) | ✅ (process) | — | Dan | — |
