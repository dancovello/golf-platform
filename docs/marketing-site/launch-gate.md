# Marketing site: launch gate

Prepared 28 Oct 2026 for the walkthrough with Dan (plan phase 9). The eleven items are from `HANDOFF.md` §11. **Nothing here is ticked unless I ran a test or read the code; the status says which.** ✅ met · ⚠️ partly met · ❌ not met · 👤 only Dan can decide or confirm.

| # | Gate item | Status | Evidence, and what is left |
|---|---|---|---|
| 1 | No claim lacks a claims-register row with evidence | ⚠️ | Every file and test the register cites exists (checked 28 Oct). 19 rows are still ❓ and 8 are ⏳ (held back). Doc 18's rows are still to add (N2). The ❓ rows are all Dan's to confirm: see "Questions for Dan" below |
| 2 | Every unbuilt feature has the Coming next badge; Bookings nav shows the clock | ✅ | `tests/e2e/marketing-bookings.spec.ts` checks the label and the clock |
| 3 | Prices show VAT treatment and term next to the number | 👤 | Built from one setting (`priceVatLabel`); the wording waits on Q2 (are you VAT registered?) |
| 4 | No uptime, status or Lighthouse figures unless fed by real data | ✅ | Searched the marketing copy and blocks on 28 Oct: none found |
| 5 | Trust documents "Available on request" or real | 👤 | Suppliers list is "on request"; the data processing agreement is still a draft awaiting your solicitor (N11) |
| 6 | Image licences confirmed; no real course captioned as a fictional club | 👤 | Open question N5 |
| 7 | Mobile works for every page; intro respects reduced motion and once per session | ✅ | New `tests/e2e/marketing-quality.spec.ts` (every page at phone width: axe clean, no sideways scroll at 320 px, keyboard pass); intro tests in `tests/e2e/marketing-intro.spec.ts`. Speed check: `phase-9-quality-log.md` |
| 8 | Privacy policy and cookie notice published | ❌ | They are drafts with placeholder wording until you supply it (N4). They cannot be published as they are |
| 9 | Forms deliver to Dan end to end | ⚠️ | Requests are saved in the admin. Nothing is emailed to you until you set the requests address and add the company domain to Turnstile (N12). Needs a real send test on staging once those are set |
| 10 | Pricing shown or hidden per Q11, with the setup fee stated wherever a price appears | ❌ | Q11 is not in the open-questions list yet, and the Pricing page still says "No setup fee" (see item 11) |
| 11 | No "free homepage", "no setup fee" or fixed switching timeline anywhere | ❌ | **Found on main on 28 Oct, contradicting the 21 Oct evening decision.** Listed below |

## Item 11 in detail: wording the 21 Oct evening decision removed, still in the code

All of these ship as the starting copy for the marketing pages. None is in a test, so nothing stops them going live.

- **"Get your free homepage"** as the second button: `src/marketing/starter/pages.ts` (lines 28, 190, 276, 473, 620), the default in `src/marketing/blocks.ts:104`, `homeBlocks.ts:64` and `builderBlocks.ts:43`. Also the nav button "Free homepage" (`src/marketing/site/chrome/Nav.tsx:53`) and the Switching page eyebrow "Free homepage" and "Start with a free homepage".
- **"No setup fee"**: home proof line (`pages.ts:29`), Pricing (`pages.ts:200, 207, 230`; `src/marketing/pricingBlocks.ts:67`).
- **"Four weeks, start to finish"** and the "Week-by-week plan" block: `pages.ts:287, 357`; `src/marketing/switchingBlocks.ts:124`.
- **"Rebuilt free in two working days"**: home proof line and Switching. This is also in the claims register as ✅, which disagrees with the hand-off's "never call it free".

Why I have not changed it: this is the headline offer on four pages, and the replacement wording, and what happens to the "homepage request" form and its admin list, are your decisions. I will draft the replacement copy and a test that fails if any of these phrases come back, as soon as you say how the offer should read.

## Questions for Dan (all the ❓ rows, grouped)

1. **Confirm you will keep these promises** (they are services, not software): homepage within two working days; we flag untagged PDFs and supply accessible versions; reply to access requests within two working days; demo on your own homepage for every call; review the accessibility statement every six months.
2. **Pricing:** is "we move your old site across" included in £149? Is there an editor limit planned? Time one real edit to back "update in minutes".
3. **Contract and legal:** the contract terms (term, notice), the data processing agreement (N11), a data-protection adviser's view of "UK GDPR throughout".
4. **Stored in London:** photos, documents and backups are Cloudflare R2 "Western Europe", not UK-only. Say "Stored in the UK and Western Europe", or move R2?
5. **Leaving a club:** content export is by hand today (N10). Keep the wording?

## What I could not do

- A real screen-reader test and a real mid-range phone. The CI checks are automatic and cover only part of the problems; the accessibility statement should keep "designed to meet" until a person has used a screen reader. The speed check is a stand-in (see the quality log).
- The separate-chat security check. It is designed to run in its own chat; the prompt is in `docs/operations/security-checks.md`.
