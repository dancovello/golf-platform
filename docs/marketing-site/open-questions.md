# Marketing site: open questions for Dan

One running list (hand-off §13). Update as answers come in; move answered items to the bottom with the date.

Each has a safe default so building isn't blocked. The default is what ships until Dan answers.

## Open

| # | Question | Needed by | Default until answered |
|---|---|---|---|
| Q2 | **VAT registered?** Decides how every price is written | Phase 5 (Pricing) | "+ VAT" from one setting (`priceVatLabel`) |
| Q3 | **Second course price.** The calculator has a one/two courses stepper | Phase 5 (Pricing) | Price from settings, flagged in the claims register |
| Q4 | **Demo booking calendar.** Which calendar, and your real weekday availability | Phase 5 (Book a demo) | Cal.com behind our own screens, checked for cost first. Until wired: the email address (built: D10) |
| Q5 | **Colour copy on Website builder.** See the finding below | Phase 6 (Website builder) | Reworded to describe the swap (D12) |
| Q6 | **Neon plan.** The Trust page's "restore to any point in the last 7 days" needs the Launch plan (about £5–£20 a month) | Phase 6 (Trust, held) | Value from settings; not published until confirmed |
| Q7 | **Changelog at launch?** | Phase 6 | Built, unpublished, kept out of nav and footer |
| Q8 | **Product film** on Website builder: is there a video? | Phase 6 | Section left out (built page has none) |
| Q9 | **Analytics.** Vercel Analytics only (no cookies)? | Phase 8 | Vercel Analytics only, so no consent banner. Cost on Pro checked first |
| Q10 | **Founder Card:** photo, a first-person line under 60 words, phone or calendar link | Phase 4 | Placeholder initial; links from settings |
| N1 | **Company name and domain** | Phase 10 (go live) | "Brandname" and `hello@brandname.golf`, in one file |
| N2 | **Docs 15 and 18** (golf ball; marketing review and claims) | Doc 18: claims register. Doc 15: phase 7 | Register seeded from the hand-off's list only |
| N3 | **`golf_ball.glb` and `golf-ball-generator.py`** | Phase 7 | — |
| N4 | **Company privacy policy, cookie notice and terms** wording | Phase 6 | Pages built as drafts with a [[placeholder]] line; they can't be published until it's replaced, and the footer hides their links until then |
| N5 | **Image licences** for the hero, two-column and accessibility photos | Phase 4 | Clearly licensed stock or demo pictures, captioned as demo clubs |
| N6 | **Vercel functions in London?** Needed before the Trust page can say "Stored in London" (doc 03) | Phase 6 (Trust, held) | The line stays out |
| N7 | **Old page addresses.** The Switching page and FAQ promise old page addresses forward to the new ones (softened for now: D8). Today the platform forwards a club's *extra domains* (e.g. without `www`), but not old page addresses like `/about-us.php`. Build page forwarding, or soften the copy? | Phase 5 (Switching) | Claim held back until decided |
| N8 | **"Alt text required."** For club photos, the description is optional (your decision, 17 Oct); the library marks missing ones "Needs description". The marketing site's own Media block will require it. | Before any copy says it | Not claimed for club sites |
| N9 | **Search in the nav.** Figma's nav has a Search button, but the marketing site has no search for it to open. Add site search later, or remove it from Figma? | Phase 8 | Left out |
| N10 | **Leaving: exporting a club's content.** The Pricing FAQ (Figma) says a leaving club takes "pages and news as Markdown, every photo and PDF in its original file, and form entries as CSV". No self-service export exists. Build one, or do it by hand on request? | Before Pricing ships | Wording kept; we do it by hand (a script) if a club leaves |
| N11 | **Data processing agreement.** The FAQ and Trust promise to send one before a club signs. A draft exists in the admin (`src/agreement/text.ts`), awaiting your solicitor. Is it ready to send? | Before Pricing ships | Wording kept, flagged in the claims register |
| N12 | **Where homepage requests are emailed.** Set an address in Company website → Settings → Requests. Turnstile's widget also needs the company domain added in Cloudflare | Before Switching ships | Requests are saved in the admin; nothing is emailed to you |

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
| D5 | Home "A week at the club" header; Pricing intro | Bold "Whoever's on duty can post it"; bold "£149 a month plus VAT" | Plain text | Section Header bodies are plain text (CMS rules) |
| D6 | Pricing calculator, "Coming next" rows | Whole text dimmed to 72% | Only the module name dimmed | The dimmed description fell to 3.5:1 contrast (needs 4.5:1) |
| D7 | Pricing, VAT wording | "plus VAT" in sentences, "+ VAT" beside the price | "+ VAT" everywhere | One VAT setting (Q2). If you prefer "plus VAT", change it once in Settings |
| D8 | Switching: week 4 and "Will we lose our place on Google?" | "…and redirect your old page addresses"; "We redirect your old page addresses" | "We switch the domain over and check every page straight after"; "Your domain stays the same and we keep your page titles…" | The platform doesn't forward old page addresses yet (N7). Restore Figma's lines if you build page forwarding |
| D9 | Switching example, desktop | The deprecated URL Reskin, 504px tall | The demo club's real homepage hero, full height (about 770px at 1200 wide) | Figma has no desktop frame for the replacement; the hand-off says use the mobile one's demo club. Say if it should be cropped shorter |
| D10 | Book a demo panel | Demo Booking: Details → Pick a time → Booked | "Pick a time by email" with an email button. The full component is on the review page with sample times | No calendar yet (Q4). Swaps in once connected |
| D11 | Demo Booking, "Your role" | Shown filled | Optional | Not everyone has a committee role; name, club and email are enough to book |
| D12 | Website builder, Token Dial and its header | "#F2E28C → #7A6A12", "AA, nudged", "We've deepened it"; header "we tell you why before it goes live" | The picked colour stays; the readout shows which text colour sits on it and its contrast. Header: "Text on it switches to stay readable, and your colour stays as you picked it" | That's what club sites do (Q5 finding). Nothing tells editors "why" before publishing yet |
| D13 | Website builder, "Readable for everyone" and "Undo any change" cards | "Alt text is required, and club colours are contrast-checked before they save"; "Roll a page back in one click" | "Text is checked against what it sits on, and photos missing a description are flagged"; "The last 50 versions of every page are kept. Bring an earlier one back from its history" | Descriptions are optional (N8) and colours aren't blocked on save (Q5). Restoring takes a couple of clicks |
| D14 | Website builder, "Old links keep working" card | Old page addresses redirect | Replaced by "Backed up every night" (pages, news and settings, encrypted, kept 30 days) | Page forwarding doesn't exist yet (N7). Swap back if you build it |
| D15 | Bookings, Works With strip | In the hand-off; marked deprecated in Figma | Left out | Figma: "name only providers we have actually linked to in production". No club is live yet. Add it once one is |
| D16 | Bookings, Tee Sheet Simulator | The page frame shows the Held state | Starts at Browsing ("Pick a time") | So visitors can tap a slot and see the hold start (the component's own first state) |
| D17 | Bookings, Facilities pictures | Photos | The demo clubs' drawn pictures | The photos' licences aren't confirmed (N5) |
| D18 | Trust, Hosting card | "Your club’s database and files are stored in London" and a "Where data lives" link | "Ask us for the full list of companies we use, and where each one keeps your club’s data." Link: "Ask for the list" (email) | Photos are in Western Europe and Vercel's functions run in Washington, D.C. (N6), and there's no page for the link to go to |
| D19 | Trust, Backups card | "Point-in-time restore to any moment in the last 7 days" and "How restores work" | "Backed up every night, encrypted and kept for 30 days." No link | The 7 days needs the Neon Launch plan (Q6); nightly backups are true today. No restores page to link to |
| D20 | Accessibility statement | Greenkeeper photo; CTA "Email access@brandname.golf" and "Back to Trust & security" | No photo; "Email hello@brandname.golf"; one button | Photo licence unconfirmed (N5): add it as a Photo block once it is. There's one company address (`src/brand.ts`). Trust isn't published yet, so the second button would lead nowhere: add it back when Trust is |
| D21 | Changelog | "Get updates by email" sign-up | Left out | There's no mailing list to sign people up to. Add one if you want it (it would need a privacy notice line) |
| D22 | Trust CTA | Second button "Committee summary (PDF)" | Left out | The committee summary was removed (21 Oct) |
| D23 | Accessibility statement read time | "4 minute read" | Worked out from the text ("1 minute read" today) | So it's always right |

## Answered

| # | Question | Answer | Date |
|---|---|---|---|
| Q1 | Run the marketing site inside the platform? | Yes (decision A) | 2026-10-21 |
| — | Committee summary A4 | Removed. Not built | 2026-10-21 |
