# Proposal: replacing the "free homepage", "no setup fee" and "four weeks" wording

Drafted 28 Oct 2026 for Dan's approval. **Nothing on any page has been changed.** This is launch gate item 11 (`launch-gate.md`).

**Source of every rule below:** `HANDOFF.md`, 21 Oct evening update and §3, §9 and §10. In short: setup is a paid one-off fee agreed with each club, and Dan supports them until live; the example homepage is built for the demo, shown there, and never sent or called free; no fixed timeline; "Book a demo" is the only primary action. Voice follows doc 19 (plain, outcome first, no hype).

## Part A: wording only (one small PR, no behaviour change)

### A1. The second button, everywhere

| Now | Proposed |
|---|---|
| "Get your free homepage" → `/switching` (Home, Pricing, Switching, Website builder, Bookings CTA bands; defaults in the block library) | **"See how switching works"** → `/switching` |
| Nav button "Free homepage" | **Removed.** "Switching" is already a nav link, and the hand-off's nav is: Website builder · Bookings · Pricing · Switching · Club log in · Book a demo |

Alternative for the button: "See pricing" (the hand-off allows it), but it would break if you hide pricing under Q11. I prefer "See how switching works" because it always has somewhere true to go.

### A2. Home

| Where | Now | Proposed |
|---|---|---|
| Meta description | "…See a demo club, then book a demo or get your homepage rebuilt free." | "Golf club websites your team can update in minutes. See a demo club, then book a demo." |
| Proof line under the hero | "{price} a month · No setup fee · Your homepage rebuilt free in two working days" | "{price} a month · One-off setup fee agreed with your club · Your demo includes your club’s own homepage" |

### A3. Pricing

| Where | Now | Proposed |
|---|---|---|
| Meta description | "…unlimited editors included. No setup fee." | "One price per club, with hosting, every live block and unlimited editors included, plus a one-off setup fee agreed with your club." |
| Price card line | "{price} a month {vat} for your website, on a {term}-month term. No setup fee, and no charge per editor." | "{price} a month {vat} for your website, on a {term}-month term, plus a one-off setup fee agreed with your club. No charge per editor." |
| Small print (also the block default) | "Prices exclude VAT. No setup fee. {notice} days’ notice after the first {term} months." | "Prices exclude VAT. The one-off setup fee is agreed with your club. {notice} days’ notice after the first {term} months." |
| CTA band | "We’ll rebuild your homepage in your colours and send it straight to you, free." | "Your demo includes your own club’s homepage, rebuilt on the platform." |

### A4. Switching

| Where | Now | Proposed |
|---|---|---|
| Meta description | "Send us your club’s website and we’ll rebuild your homepage on our platform, free, within two working days. Then four weeks from first call to live site." | "We set your club up on our platform for a one-off fee, agreed with you, and support you until your site is live." |
| Eyebrow | "Free homepage" | "See it on your club" |
| Subhead | "…We’ll rebuild your homepage on our platform and send it straight to you, free." | "Tell us your club and your current website. In your demo, we’ll show you your own homepage on our platform." |
| Tick point 2 | "In your inbox within two working days" | "Shown to you in your demo" |
| Tick point 3 | "No call needed, and no commitment" (it is now a demo call) | "No commitment until you decide to sign up" |
| Form button | "Rebuild my homepage" | "Book my demo" |
| Form "sent" title | "On its way." | "Thanks." |
| "The switch" subhead | "Four weeks, start to finish. We do the heavy lifting, and your committee signs off before anything goes live." | "We set you up for a one-off fee, agreed with your club, and support you until the site is live. Your committee signs off before anything goes live." |
| Weeks 1 to 4 (Gather, Shape, Review, Launch) | Four cards | **Removed from the page** (the hand-off says the timeline goes). The block stays in the library, unused |
| CTA band subhead | "Start with a free homepage, or talk it through with us first." | "See your own club on the platform, or talk it through with us first." |

### A5. Admin screens

"Free homepage request(s)" in the admin list becomes "Demo request(s)". Labels only; no data changes.

### A6. A test so it can't come back

A unit test scans the marketing source (copy, block defaults, nav) and fails on: "free homepage", "rebuilt free", "no setup fee", "four weeks", "send it straight to you", and "Week 1" to "Week 4". It runs on every PR. (Doesn't scan the docs, which describe the old wording.)

### A7. Claims register

Rewrite: "Homepage rebuilt free in two working days" (retire), "No setup fee" (retire), "Four weeks, start to finish" (retire), "We move your old site across (included in the price)" (now: covered by the one-off setup fee, amount agreed per club). Add: "One-off setup fee, agreed with each club" (Dan's decision, 21 Oct) and "Your demo includes your own club’s homepage" (a service, ❓ Dan to confirm he will do this for every demo).

## Part B: behaviour (separate PR, needs your OK)

The form still behaves like the old offer. Changing it alters emails prospects receive, so it needs its own approval:

- **Success message** (`src/marketing/site/switching/RequestForm.tsx:172`) says "We’ll email your homepage on the new site to {email} by {date}". The hand-off says: "Thanks. We’ll be in touch.", "We’ll email {email} to arrange your demo", **no date promised**, and the example is never emailed or linked.
- **Confirmation email to the prospect** and **your alert email** (subject "Homepage request: {club} (due {date})") use the same two-working-days promise.
- **The two-working-days date logic** (`working-days.ts`) would no longer be shown to anyone.
- **Tests** for those messages and the working-days promise change with it.
- It does not touch the database or the spam protection.

## Decisions I need from you

1. Approve Part A as written, or tell me which lines to change.
2. Second button: "See how switching works" (my pick) or "See pricing"?
3. Part B: go ahead as a separate PR?
4. Also noticed, not changed: the Home proof line shows "{price} a month" with no "+ VAT" beside it (launch gate item 3, waits on Q2).
