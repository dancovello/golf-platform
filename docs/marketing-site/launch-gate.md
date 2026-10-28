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
| 10 | Pricing shown or hidden per Q11, with the setup fee stated wherever a price appears | ⚠️ | Setup fee is now stated beside every price (28 Oct). Q11 itself (show prices or quote per club) is still undecided and is not in the open-questions list |
| 11 | No "free homepage", "no setup fee" or fixed switching timeline anywhere | ⚠️ | Pages, buttons, nav and block defaults fixed on 28 Oct (PR #206) and guarded by `tests/unit/marketing-wording.spec.ts`. **Still open: the request form's success message and the two emails (Part B).** Pages already saved in a database keep their old text until edited (see below) |

## Item 11 in detail

**Fixed on 28 Oct (PR #206, Part A of `wording-proposal-free-homepage.md`):** the second button, the nav button, every "no setup fee", "free" and "four weeks" line in the starter pages, the block defaults, the Week 1 to 4 cards, and the admin labels. A unit test fails if any of that wording returns.

**Not yet fixed:**
- **The request form's success message and emails** (Part B): they still promise the example homepage "by {date}" and say "Your free homepage is on its way".
- **Pages already saved in a database.** The starter pages only apply when a page is first added; existing pages are left alone. Staging (and production, once released) keep their old text until each page is edited in the admin, or a one-off update script is run. Running that against staging changes staging data, so it needs your go-ahead.

## Questions for Dan (all the ❓ rows, grouped)

1. **Confirm you will keep these promises** (they are services, not software): homepage within two working days; we flag untagged PDFs and supply accessible versions; reply to access requests within two working days; demo on your own homepage for every call; review the accessibility statement every six months.
2. **Pricing:** is "we move your old site across" included in £149? Is there an editor limit planned? Time one real edit to back "update in minutes".
3. **Contract and legal:** the contract terms (term, notice), the data processing agreement (N11), a data-protection adviser's view of "UK GDPR throughout".
4. **Stored in London:** photos, documents and backups are Cloudflare R2 "Western Europe", not UK-only. Say "Stored in the UK and Western Europe", or move R2?
5. **Leaving a club:** content export is by hand today (N10). Keep the wording?

## What I could not do

- A real screen-reader test and a real mid-range phone. The CI checks are automatic and cover only part of the problems; the accessibility statement should keep "designed to meet" until a person has used a screen reader. The speed check is a stand-in (see the quality log).
- The separate-chat security check. It is designed to run in its own chat; the prompt is in `docs/operations/security-checks.md`.
