# Marketing site: delivery plan (proposed 2026-10-21)

**Status: approved by Dan, 2026-10-21** (decisions A–D and F as recommended; the committee summary is removed).

Built from Dan's hand-off (`MARKETING-SITE-HANDOFF.md`, 21 Oct) and doc 19 (tone of voice). The older brief (`marketing-site-plan.md`, 13 Oct: founding clubs, Clubhouse page, URL reskin, ⌘K menu) is replaced by the hand-off and is not used.

Each phase is one or more branches and PRs, in order. About 17–21 PRs in total. As in step 5, I keep going phase after phase and you review each preview link as it comes.

---

## 1. What I need from you before I start

### Decisions (the first three block phase 1)

| # | Question | My recommendation |
|---|---|---|
| A | **Does the marketing site run inside the platform (same app, edited in Payload)?** (hand-off Q1) | **Yes**, as the hand-off recommends. One codebase, one set of safety checks, and the "live block" demos use the real club blocks. |
| B | **Where do the live demos get their content?** The hand-off suggests demo clubs (tenants). But the demo club is deliberately kept off production, and fake clubs in the production database would sit inside the tenant-isolation tests. | **Sample content written in code**, fed into the real club block components, with each demo club's colours and fonts. Same code clubs get, so it's still "not a picture", but no fake clubs in the database and nothing a visitor can change. The "edit and live" demo changes the block in the visitor's browser only; nothing is saved. |
| C | **Which address does "Club log in" go to?** | Marketing site on `brandname.golf` and `www.`; the admin on its own address, `app.brandname.golf`. Keeping them apart means a problem on the public marketing pages (which load the 3D ball, analytics and the calendar) can't touch an editor's login. On staging, the marketing site shows at the staging address's home page, with the admin at `/admin` as now. |
| D | **One home for the company name.** The code already uses "Clubhouse" as a placeholder name (privacy policy, agreement). The hand-off wants "Brandname" in the marketing settings. | Move the name, email and domain into **one file in the code**, used by the marketing site, privacy policy and agreement. The rename is then a one-line change. Prices, VAT label and other values stay editable in Payload, as the hand-off says. |
| E | **Committee summary (A4 PDF).** | **Removed** (Dan, 2026-10-21). Not built. |
| F | **How long we keep homepage and demo requests.** These hold prospects' names and emails. | 12 months after the last contact, deleted by the existing nightly clean-up job. Your company privacy policy then says so. |

The hand-off's own open questions (Q2–Q10: VAT, second-course price, calendar, colour nudge, Neon plan, changelog, product film, analytics, Founder Card) all have safe defaults behind settings. I'll keep them in `docs/marketing-site/open-questions.md` and ask each one when its page is reached, not now.

### Files and content I don't have

- **Doc 15** (hero golf ball) and **doc 18** (marketing review and claims register): not on this machine. Doc 18 seeds the claims register.
- **`golf_ball.glb`** and **`golf-ball-generator.py`** (needed for phase 8 only).
- **Founder Card:** your photo and a first-person line under 60 words (phase 4; a placeholder initial until then).
- **Company privacy policy, cookie notice and terms** (phase 7). These differ from the club privacy policy: the company is in charge of prospects' data here.
- **Image licences** for the hero, two-column and accessibility photos. Until confirmed, I'll use clearly licensed stock or demo pictures, captioned as demo clubs.

---

## 2. Conflicts I found (please confirm)

1. **Demo clubs on production.** See decision B.
2. **"Stored in London"** (Trust page) needs Vercel's function region moved to London. Doc 03 still lists that as undecided. The Trust page is held anyway.
3. **"Restore to any point in the last 7 days"** needs the Neon Launch plan. That's agreed but not yet done (doc 03). This needs your go-ahead because it's paid, about £5–£20 a month.
4. **Production email:** `RESEND_API_KEY` exists only on staging and previews. The forms can't email you from production until production has its own key and a verified sending address on the company domain.
5. **Doc 19 still has founding-clubs examples** (a reference block and the "Apply for a founding place" button). The hand-off overrules them. I'll ignore them, and doc 19 could drop them when you next edit it.
6. **Cloudflare Turnstile allows 10 addresses per widget.** The company domain uses one more, so one widget now lasts for 7 clubs, not 8 (open question in doc 03).
7. **Bookings is out of scope for v1** (CLAUDE.md). The Bookings page is a **preview only**: in-page simulations with made-up times, labelled "Coming next". No real booking is built.

---

## 3. The phases

### Phase 0: Paperwork (1 PR, docs only)

- Put the hand-off at `docs/marketing-site/HANDOFF.md` and doc 19 next to it, plus docs 15 and 18 when you send them. Link them from `CLAUDE.md`.
- Create `open-questions.md` and `claims-register.md`, the register seeded from doc 18.
- Record decisions A–F in `docs/architecture/decisions.md`.

### Phase 1: Foundations (3 PRs)

1. **Addresses and routing**
   - The company domain (from a setting) serves the marketing site. Club domains never reach marketing pages, and the company domain can never be treated as a club.
   - The admin moves to its own address once the domain exists.
   - Staging and previews are `noindex`.
   - Its own content security policy, which allows the 3D ball's decoder and nothing more.
   - **Isolation tests added:** a club's domain can't reach marketing pages, and the marketing site never shows any club's data.
2. **Content model**
   - `marketingSettings` holds every number and fact the site states (price, VAT label, term, restore window, emails, Founder Card).
   - A `marketingPages` collection with drafts and live preview, made from the five marketing blocks: Section Header, CTA Band, Media (alt text required), Rich Text and Feature Card.
   - `homepageRequests` and `demoRequests` collections.
   - **Only you can see or edit any of these.** Club editors can't find them in the admin or the API, and tests prove it. One reviewed migration.
3. **Look and feel basics**
   - Marketing colours (`--mk-*`), kept apart from club colours.
   - Newsreader and Hanken Grotesk, self-hosted.
   - The 1200px layout and section spacing.
   - The interaction rules: focus ring, press, hover only on mouse devices, reduced motion.

### Phase 2: Components (2 PRs)

1. **Controls, with every state from Figma:**
   - Button, the link styles, Pill Tab, Segment, Tenant Chip, Filter Chip
   - Switch, Icon Button, Time Slot, Field, FAQ Item
   - Availability Badge (text plus icon, never colour alone)

   Shown on a review page at `/dev/components`, behind your login.
2. **The building blocks of every page:**
   - Nav (top and scrolled, mobile drawer) and Footer
   - The five marketing blocks
   - Proof Stat, Founder Card and Browser Chrome

### Phase 3: Live demo engine (1 PR)

- Real club blocks (course status, news, green fees, hole guide, hero) shown inside Browser Chrome with the sample content from decision B.
- Three demo clubs: Heritage, Coastal and Booking-led. Each is scaled to fit and labelled "Demo club".
- Club colours stay inside each frame, and frames below the fold load only as they scroll in.
- Any block that isn't built yet stays hidden.

### Phase 4: Home page, without the intro (1–2 PRs)

- Hero with Tenant Morph and the club chips.
- The three proof stats with footnotes.
- "Edit and live": you type on the left and the block updates on the right.
- "A week at the club" (a swipeable carousel on mobile), "Your content comes with you", the Founder Card and the CTA band.
- Desktop and mobile together.

### Phase 5: The pages that win clubs (3 PRs)

1. **Pricing:**
   - The calculator, with the price, "+ VAT" and the term shown together, and digits that roll.
   - Coming next rows switched off with their badge.
   - Committee questions, including the export format and migration limits.
2. **Switching to us, with the homepage request form working end to end:**
   - Saves to Payload, emails you and sends the prospect a plain confirmation.
   - Protected by Turnstile, a hidden spam trap and rate limits.
   - "We'll send your homepage by {date}" uses two UK working days, skipping weekends and bank holidays. The bank holiday list is a saved copy, with a test that fails before it runs out.
3. **Book a demo:**
   - Details → Pick a time → Booked, plus the Founder Card.
   - The calendar is wired up only after you answer Q4. Before then, it falls back to the email address.

### Phase 6: The other pages (3 PRs)

1. **Website builder:**
   - Block Flipper at desktop, tablet and mobile widths.
   - Token Dial, which reuses the colour and contrast rules club sites already have.
   - Course guide and course status demos, and the feature cards.
   - The contrast line stays hidden until Q5, and there's no product film until Q8.
2. **Bookings preview:**
   - The tee sheet, club settings and facilities simulations, all labelled Coming next.
   - The "works with" list of booking systems, as text only.
3. **Trust** (built, not published), **Accessibility statement**, **privacy, cookies and terms** (your wording), **404** and **Changelog** (built, not published, and kept out of the nav).

### Phase 7: Golf ball intro (1 PR)

- Your approved ball file, with its decoder hosted on our own site.
- Loads after the page appears, so the hero never waits for it.
- Plays once per visit and can be skipped. There's no intro at all when the visitor's device asks for reduced motion.
- A simple fallback for devices without 3D graphics.
- A switch to compare bounce rates with and without it.
- The 3D code loads on the home page only.
- **New dependencies:** `three` and `@react-three/fiber`.

### Phase 8: Search engines and analytics (1 PR)

- A unique title and description for every page, share images, `sitemap.xml`, `robots.txt` and the company details for search engines.
- Vercel Analytics, which uses no cookies, so no consent banner (Q9). I'll check its cost on Pro before switching it on.

### Phase 9: Quality pass and launch gate (1–2 PRs, plus a walkthrough with you)

- Accessibility checks on every page in CI, plus a keyboard-only pass and a 400% zoom check. The results feed the Accessibility statement.
- Tablet screenshots for you, since tablet isn't designed.
- A speed check on a mid-range phone.
- Every row in the claims register checked, and turned into a test where possible.
- A security check in a separate chat (`docs/operations/security-checks.md`).
- The hand-off's launch gate, walked through with you item by item.

### Phase 10: Going live (mostly your steps, one checklist)

Needs the company name and domain. Each item needs your go-ahead:

- Buy the domain.
- Add it in Vercel, with `app.` for the admin.
- Verify the domain in Resend and add a production email key.
- Add the domain to the Turnstile widget.
- Production settings.
- Neon plan (if not already done), plus the London region if the Trust page will say "Stored in London".
- The uptime monitor on production, which becomes possible once the domain exists.
- The release PR.

---

## 4. What's new, in one place

- **New dependencies:** `three` and `@react-three/fiber` (phase 7), and `@vercel/analytics` (phase 8). Nothing else planned. Motion uses CSS, and the calendar uses its web address directly with no extra library.
- **Migrations:** one in phase 1 (new collections and settings). Each will be reviewed. None deletes data.
- **Paid:** only things that already need your go-ahead: the domain, the Neon plan, possibly Vercel Analytics above the included amount, and the calendar if Cal.com's free plan doesn't allow it. I'll check each before asking.
