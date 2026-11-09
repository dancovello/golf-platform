# Launch checklist (9 Nov 2026)

The single list of what is left before launch. Built from the original build order, the marketing site launch gate (`docs/marketing-site/launch-gate.md`), both open-questions lists and Dan's pending setup steps. **Dan's answers of 9 Nov are recorded here; later chats pick up the open rows.** Tick a row only when it is true, and say how you know.

Legend: ✅ done · 🔨 build (Claude) · 👤 Dan · ❓ undecided

## Settled on 9 Nov (Dan)

| Topic | Decision |
|---|---|
| Production release | Done in a separate chat, with Dan's go-ahead. Not part of this list |
| Demo booking | Demo timings and call link are set in the admin (answers Q4) ✅ |
| Suppliers' data terms | Dan has accepted them all (Vercel, Neon, Cloudflare, GitHub, Resend). Functions run in London |
| Privacy policy | Reviewed and approved by Dan's solicitor |
| VAT | Dan is **not** VAT registered. No "+ VAT" wording anywhere (answers Q2) |
| Prices | Show the **monthly cost** on the site. The setup fee is Dan's own per-club arrangement and stays **off the site** |
| Course selector | **Remove** the one/two courses stepper from the pricing calculator. Course count is reflected in Dan's personal setup fee per club (makes Q3 moot) |
| Leaving a club | **No export.** If a club stops paying it loses its site. This is a subscription service; they can leave, but there is no website to take with them. Wording must say so plainly (answers N10) |
| Golf ball logo | The real logo is in the golf ball intro ✅ |
| Marketing content | Dan reviews all marketing content himself before launch |
| Cookie notice | Wording was worked on via Google Ads on staging. Dan has not seen it since. It must appear **after** the golf ball animation, never over it |

## Build work for Claude 🔨

| # | Job | Notes |
|---|---|---|
| B1 | Cookie banner appears only after the golf ball intro has finished (and straight away when the intro is skipped or already seen this session) | Check on staging with the intro on a fresh session, on reload (the intro replays) and with reduced motion. Dan to look at the wording once it is visible |
| B2 | Remove the course selector from the pricing calculator | `src/marketing/site/pricing/CalculatorClient.tsx`, `pricingBlocks.ts`, `MarketingSettings.ts` (second-course price setting). Remove the matching claims-register rows and tests |
| B3 | Prices: monthly cost only, no VAT label, no setup fee beside any price | Reverses the 28 Oct "setup fee beside every price" rule. Update `priceVatLabel`, `tests/unit/marketing-wording.spec.ts` and the Pricing FAQ |
| B4 | Leaving wording: "no export, you lose the site if you stop paying" | Pricing FAQ, Switching page, Trust page, claims register. Do not promise Markdown, CSV or original files (N10) |
| B5 | Remove the "pages already saved in a database keep old wording" gap (launch gate item 11) | Needs Dan's go-ahead to run against staging or production |
| B6 | Bearwood leftovers | Gary Player repeated photos on the live demo (Dan's go), WebP for existing Bearwood photos (Dan's go), branded video player research (B-21), storage allowance per club (B-23) |
| B7 | Test club on production (Dan, 5 Nov) | Plan first, Dan approves. Own subdomain, kept out of search engines, clearly labelled |
| B8 | When a club goes live, its demo pages lose `noindex` automatically | Written down in `demo-sites-plan` memory; test it |

## Dan's jobs 👤

| # | Job | Status |
|---|---|---|
| D1 | **ICO registration** and the yearly data protection fee (small-business tier). Needed before the first club | ❓ not yet raised |
| D2 | ✅ Data processing agreement approved by Dan; details filled in 9 Nov (PR pending). Dan is a sole trader, not a registered company. One thing to glance at: Resend's row says "as set out in Resend's data processing agreement" because I could not confirm its transfer safeguard | ✅ |
| D3 | Marketing site terms of use and cookie policy wording final | Cookie notice: see B1. Terms: ❓ |
| D4 | GitHub: move production keys into GitHub environments, delete the repo-wide copies (the High finding from the security audit), required checks | 👤 |
| D5 | Production admin → Settings → Requests: inbox daniel@a1engine.co | 👤 |
| D6 | Cloudflare Turnstile: add `a1engine.co` to the widget | 👤 |
| D7 | Vercel Production: `MARKETING_GA_ID`. Google Analytics: retention 14 months, Google signals off | 👤. Only after B1 is true |
| D8 | Neon Launch plan (7-day history) before the first real club | 👤 |
| D9 | **First restore drill** with the devops friend (`docs/operations/restore-runbook.md`, record in `restore-drills.md`) | 👤 never done |
| D10 | Penetration test budget, booked before the first paying clubs | 👤 |
| D11 | Image licences for the marketing photos, founder photo and short bio, share image | 👤 |
| D12 | Editor help guide for clubs; delete the old merged GitHub branches | 👤 |
| D13 | Confirm the service promises (homepage in two working days, access requests answered in two working days, and so on) | 👤 |
| D14 | Photo storage wording: "UK and Western Europe", or move R2 | ❓ |
| D15 | ISO 27001 is not needed for launch. If clubs ask for a certificate, Cyber Essentials is the cheap UK option | Info only |

## Testing before launch

- Real send test of both marketing forms after D5 and D6.
- A screen-reader pass and a real mid-range phone (automatic checks cover only part of this).
- The separate-chat security check (`docs/operations/security-checks.md`).
- Dan's own walkthrough on the production test club (B7).

## How later chats use this

Start a new chat, point it at this file, and say which rows to take. Claude should do one group per chat, plan first, one branch per change, and update the row's status here in the same pull request.
