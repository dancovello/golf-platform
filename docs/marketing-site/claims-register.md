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
| Stored in London | Trust | Database: Neon, London (`aws-eu-west-2`) ✅. Website functions: Vercel London (`lhr1`, `vercel.json`, 22 Oct) ✅. Photos, documents and backups: Cloudflare R2, Western Europe, **not UK-only** ❓ | ⏳ until R2 is answered, or say "Stored in the UK and Western Europe" | — | Dan | Each infrastructure change |
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
| Your homepage in your inbox within two working days | Switching | A service: requests are saved with the promised date (`homepage-requests`, two UK working days) and emailed to the requests inbox | ❓ confirm you can keep this promise | `tests/unit/working-days.spec.ts`, `tests/int/homepage-requests.int.spec.ts` | Dan | Before Switching ships |
| Nothing on your live site changes | Switching | We build from a copy; the platform never touches a club's old site | ✅ | — | Claude | — |
| Four weeks, start to finish | Switching | Onboarding process (Gather, Shape, Review, Launch) | ❓ confirm the timescale | — | Dan | Each onboarding |
| We flag PDFs screen readers can't read; accessible versions on request | Switching (FAQ) | A service promise, done by hand | ❓ confirm you'll offer this | — | Dan | Before Switching ships |
| We switch over on a quiet weekday morning and check the site straight after | Switching (FAQ) | Process (domain routing, `/health` check) | ✅ (process) | — | Dan | — |
| We keep your page titles | Switching (FAQ) | Pages are rebuilt from the club's content with their titles | ✅ (process) | — | Dan | — |
| We'll show you the platform with your own homepage on it | Book a demo | A service: we rebuild the club's homepage before the call | ❓ confirm you'll do this for every demo | — | Dan | Before Book a demo ships |
| Send times by email and we'll send a video call invite | Book a demo | Manual until a calendar is connected (Q4) | ❓ confirm | — | Dan | When Q4 is answered |
| I run every demo myself | Book a demo | Your statement | ✅ (yours) | — | Dan | If anyone else runs demos |
| Text on your colour switches to stay readable; your colour stays as picked | Website builder | `src/theme/colour.ts` (readable, onAccent); the Token Dial uses the same functions | ✅ | `tests/unit/token-dial.spec.ts`, `tests/unit/theme-colour.spec.ts` | Claude | Each theme change |
| Photos missing a description are flagged | Website builder | The library marks them "Needs description" (N8) | ✅ | — | Claude | If descriptions change |
| The last 50 versions of every page are kept | Website builder | `versions.maxPerDoc: 50` on Pages (`src/collections/Pages.ts`) | ✅ | — | Claude | If the history limit changes |
| Backed up every night, encrypted, kept 30 days | Website builder | `.github/workflows/backup.yml` (database; objects deleted after 30 days) | ✅ | Backup workflow | Claude | Each infrastructure change |
| Photos are resized for you | Website builder | Image sizes on upload (`src/collections/Media.ts`) | ✅ | — | Claude | — |
| Course status shows when it was last updated | Website builder | Course Status block shows the time (`src/site/blocks/CourseStatus.tsx`) | ✅ | — | Claude | — |
| Anyone with access can post the course report | Website builder | Club editors can update Course Status | ✅ | Isolation tests | Claude | If roles are added |
| The right access for each person | Website builder | Not built: badged Coming next | ⏳ (badged) | — | Dan | When roles ship |
| Your new site links to the booking system you use today | Bookings | The "Book a tee time" button links to any address (Club Settings → header booking link) | ✅ | — | Claude | — |
| Built-in booking is coming next (tee sheet, settings, facilities) | Bookings | Not built; every preview is labelled "Coming next · not live yet" | ⏳ (labelled) | `tests/e2e/marketing-bookings.spec.ts` checks the label | Dan | When booking ships |
| Designed to meet WCAG 2.2 AA | Trust, Accessibility | Blocks built to the hand-off's accessibility rules; axe checks on every marketing page in CI. "Designed to", not "built to", until each block has a recorded test | ✅ (wording) | `tests/e2e/marketing-info.spec.ts` and the other marketing axe checks | Claude | Phase 9 |
| We're recording a keyboard, screen reader and 400% zoom test for every block, and publishing the results | Trust, Accessibility | Planned for phase 9 (quality pass). **Nothing published yet** | ❓ a promise: needs the phase 9 log | — | Dan | Before Accessibility ships |
| Ask us for the full list of companies we use | Trust | Suppliers listed in doc 04 and `docs/architecture/decisions.md` (Vercel, Neon, Cloudflare, Resend, GitHub, Sentry) | ✅ (on request) | — | Dan | Each new supplier |
| Backed up every night, encrypted, kept 30 days | Trust | As the Website builder row above (`.github/workflows/backup.yml`) | ✅ | Backup workflow | Claude | Each infrastructure change |
| We sign a data processing agreement with every club, and send it before you commit | Trust, Pricing (FAQ) | Draft agreement in the admin (`src/agreement/text.ts`, decisions 15 Oct); every club must accept it. **Still a draft awaiting your solicitor** (N11) | ❓ needs the solicitor's sign-off | `tests/int/agreement.int.spec.ts` | Dan | Before Trust ships |
| UK GDPR throughout | Trust | Club privacy policy (`src/site/privacy/policy.ts`) and the agreement above | ❓ a data-protection adviser should review (decisions 15 Oct) | — | Dan | Before Trust ships |
| We flag untagged PDFs when you switch, and can supply accessible versions | Accessibility | A service promise, part of moving a club across | ❓ confirm you'll do this | — | Dan | Before Accessibility ships |
| We review this statement every six months and whenever we ship a new block | Accessibility | A process promise; the "Last reviewed" date shows when it was last done | ❓ confirm | — | Dan | Every six months |
| We reply within two working days | Accessibility (CTA) | A service promise, the same as homepage requests | ❓ confirm | — | Dan | Before Accessibility ships |
