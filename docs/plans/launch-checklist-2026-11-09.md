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
| Setup fee wording (9 Nov, later) | The setup fee stays, with no price on the site, worded as depending on the size and needs of the club |
| Leaving wording (9 Nov, later) | Sound like a normal subscription, not a threat: "like any subscription, your site stays live while your plan runs; you can cancel with notice; your domain stays yours" |
| Data processing agreement | Dan says it is approved. The admin flag stays "Draft" until the company details in `src/agreement/text.ts` are filled in |
| Course selector | **Remove** the one/two courses stepper from the pricing calculator. Course count is reflected in Dan's personal setup fee per club (makes Q3 moot) |
| Leaving a club | **No export.** If a club stops paying it loses its site. This is a subscription service; they can leave, but there is no website to take with them. Wording must say so plainly (answers N10) |
| Golf ball logo | The real logo is in the golf ball intro ✅ |
| Marketing content | Dan reviews all marketing content himself before launch |
| Cookie notice | Wording was worked on via Google Ads on staging. Dan has not seen it since. It must appear **after** the golf ball animation, never over it |

## Build work for Claude 🔨

| # | Job | Notes |
|---|---|---|
| B1 | ✅ built 9 Nov, fine (Dan, 14 Nov). Also 14 Nov: the banner now shows on club previews and demos (Google still never loads there), so a club's banner can be seen before it goes live. It only appears when the club has a Google Analytics ID. Original note: cookie banner appears only after the golf ball intro has finished (and straight away when the intro is skipped or already seen this session) | Check on staging with the intro on a fresh session, on reload (the intro replays) and with reduced motion. Dan to look at the wording once it is visible |
| B2 | ✅ built 9 Nov: removed the course selector from the pricing calculator | `src/marketing/site/pricing/CalculatorClient.tsx`, `pricingBlocks.ts`, `MarketingSettings.ts` (second-course price setting). Remove the matching claims-register rows and tests |
| B3 | ✅ built 9 Nov: prices: monthly cost only, no VAT label, no setup fee beside any price | Reverses the 28 Oct "setup fee beside every price" rule. Update `priceVatLabel`, `tests/unit/marketing-wording.spec.ts` and the Pricing FAQ |
| B4 | ✅ built 9 Nov (FAQ now "What happens if we cancel?"): leaving wording: "no export, you lose the site if you stop paying" | Pricing FAQ, Switching page, Trust page, claims register. Do not promise Markdown, CSV or original files (N10) |
| B5 | ✅ Done and fine (Dan, 23 Nov): the old marketing wording is all fixed. Nothing to run | `pnpm fix-marketing-wording` stays in the repo but is not on the to-do list |
| B6 | ✅ Bearwood Lakes is a demo only. Its leftovers are not tracked here until the club goes live (Dan, 22 Nov). Built: branded video player (14 Nov); storage allowance per club dropped | Nothing to do |
| B7 | ✅ A1 Demo Club is live on production at `demo-club.a1engine.co` (23 Nov), kept out of search engines. Still to do: Dan's contact-form email test and walkthrough | `club-imports/a1-demo-club`; never re-import |
| B8 | ✅ 14 Nov: going live is one save (untick Public demo and add the web address together). Demo pages are `noindex` only because of the `/demo/` route, so nothing needs removing; the live site is indexable on production. Tested in `tests/int/prospect-demo.int.spec.ts` | `docs/operations/prospect-demos.md` |

## Dan's jobs 👤

| # | Job | Status |
|---|---|---|
| D1 | **ICO registration** and the yearly data protection fee (small-business tier). Needed before the first club | ✅ registered (Dan, 19 Nov). ICO number ZC307933 is now saved in production Marketing settings → Contact and shows in the footer (written directly into the database, 22 Nov, because the script timed out; checked on the live site). The security number is never published |
| D2 | ✅ Data processing agreement approved by Dan; details filled in 9 Nov (PR #301, merged). Dan is a sole trader, not a registered company. One thing to glance at: Resend's row says "as set out in Resend's data processing agreement" because I could not confirm its transfer safeguard | ✅ |
| D3 | Marketing site terms of use and cookie policy wording final | ✅ Terms and cookie policy are live on the production marketing site (Dan, 19 Nov). Cookie notice: see B1 |
| D4 | GitHub: move production keys into GitHub environments, delete the repo-wide copies (the High finding from the security audit), required checks | ✅ Production keys are in the `release-production` and `release-staging` environments; only the two non-secret Vercel IDs remain repo-wide; required checks set on `main` and `production` (checked in GitHub, 19 Nov) |
| D5 | Production admin → Settings → Requests: inbox daniel@a1engine.co | ✅ Done (Dan, 19 Nov); contact forms tested and fine |
| D6 | Cloudflare Turnstile: add `a1engine.co` to the widget | ✅ Done (Dan, 19 Nov): Turnstile shows challenges from `a1engine.co`; contact forms tested and fine |
| D7 | Vercel Production: `MARKETING_GA_ID`. Google Analytics: retention 14 months, Google signals off | ✅ Done (Dan, 19 Nov): `MARKETING_GA_ID` set, analytics seen working, retention and Google signals done |
| D8 | Neon Launch plan (7-day history) | ✅ Neon upgraded to Launch (Dan, 24 Nov). Resend's paid plan still waits for 2 paying clubs |
| D9 | **First restore drill** (`docs/operations/restore-runbook.md`, record in `restore-drills.md`) | ✅ Done (Dan, 24 Nov): all three methods passed on 23 Nov (#382) |
| D10 | Penetration test budget, booked before the first paying clubs | 👤 |
| D11 | Image licences for the marketing photos, founder photo and short bio, share image | ✅ Done (Dan, 19 Nov): licensed photos handled in a separate chat |
| D12 | Editor help guide for clubs ✅ done (Dan, 23 Nov, `docs/club-guides/`). Still to do: delete the old merged GitHub branches | 👤 |
| D13 | Confirm the service promises | ✅ Done and fine (Dan, 22 Nov). Homepage promise stays removed |
| D14 | Photo storage wording: "UK and Western Europe", or move R2 | ✅ "UK and Western Europe" is right (Dan, 19 Nov) |
| D15 | ISO 27001 is not needed for launch. If clubs ask for a certificate, Cyber Essentials is the cheap UK option | Info only |

## Update, 19 Nov

Checked against GitHub, Neon and the repo, and Dan's answers. Real-device checks are done (Dan). Still open: D9 restore drill (no row in `restore-drills.md`), D10 penetration test, D12 editor help guide and old branches, the ICO number on the site, and the D13 access-request promise. The audit fix plan's steps 1 to 5 and 7 to 14 are done; the feature gaps G1 to G7, G15 and G16 and the 16 Nov system-test fixes are merged to main.

## Testing before launch

- Real send test of both marketing forms after D5 and D6.
- A screen-reader pass and a real mid-range phone (automatic checks cover only part of this).
- The separate-chat security check (`docs/operations/security-checks.md`).
- Dan's own walkthrough on the production test club (B7).

## Update, 22 Nov

Dan: D13 done, the screen-reader and phone check done, Bearwood Lakes is a demo: its leftovers stay off this list until it goes live. ICO number is live. Still open: D9 restore drill, D10 penetration test, D12 editor help guide and old branches, B5 (`pnpm fix-marketing-wording` on staging and production), B7 production test club, and the separate-chat security check.

## Update, 23 Nov

Dan: B5 is fine, the editor guide is done, the demo club is live on production, the ICO number is live. Still open: D9 restore drill, D10 penetration test, deleting old merged GitHub branches, the separate-chat security check, and Dan's contact-form email test and walkthrough on the demo club (B7).

## Update, 24 Nov

Dan: D9 restore drill done, Neon is on the Launch plan. Still open: D10 penetration test, deleting old merged GitHub branches, the separate-chat security check, and Dan's contact-form email test and walkthrough on the demo club (B7).

## How later chats use this

Start a new chat, point it at this file, and say which rows to take. Claude should do one group per chat, plan first, one branch per change, and update the row's status here in the same pull request.
