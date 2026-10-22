# Marketing site: handoff to Claude Code

**From:** Dan (product, design) · **Date:** 21 October 2026 · **Repo:** `golf platform`
**In the repo at** `docs/marketing-site/HANDOFF.md`, linked from `CLAUDE.md`.

> **Changes since this hand-off** (newest first; these win over the text below):
> - **2026-10-21 (evening), Dan's decisions after the product grilling:** setup is a **paid, one-off fee agreed with each club**, with Dan supporting the club until the site is live. **No free migration and no four-week plan.** The **example homepage** is built with AI and **shown in the demo**, not sent to the club. **"Get your free homepage" is gone**; "Book a demo" is the only primary action. **Bookings is an optional paid add-on (phase 2)**; until then a club's site links to its current booking system, so the **Works With Strip is removed**. **Pricing is reopened** (Q11). The sections below and the Figma page are updated to match; see the Figma note *Review 21 Oct · Dan's decisions after the grilling* (`312:38533`).
> - **2026-10-21:** the committee summary A4 is **removed**. Don't build it. The delivery plan (`docs/plans/marketing-site-plan.md`) and its decisions (`docs/architecture/decisions.md`, 21 Oct) were approved the same day.

This is everything you need to build the company marketing site: what it is, what's decided, what isn't, where the designs are, and the rules every page has to pass. Read it top to bottom once before writing code.

---

## 1. Read this first

**What you're building:** the public website for the company that sells the golf club platform. It sells to club managers and secretaries, and to the committees they have to convince. It is *not* a club site. Club sites speak in each club's voice; this one speaks in ours.

**The look:** Linear-style. It sits between a sleek product site and the product itself: real product UI everywhere, techy craft without feeling techy. Dark green canvas, warm "dawn" accent, Newsreader display type, Hanken Grotesk for everything else.

**The one rule that overrides everything:** *If a club secretary screenshotted any line and sent it back in six months, could we point to it working in production?* If not, it carries a **Coming next** badge or it comes out. No invented numbers, customers, dates, uptime or features. This is a launch blocker, not a style note.

**Company name:** not chosen. Use the placeholder **Brandname** and `hello@brandname.golf`, defined **once** in a site config so the rename is a one-line change. No logo exists yet either (see §6, intro animation).

---

## 2. Sources of truth, and which wins

When two sources disagree, the higher one wins. Where you find a conflict not listed in §12, stop and ask Dan.

| Rank | Source | What it covers |
|---|---|---|
| 1 | **This handoff** | Decisions made up to 21 Oct 2026, conflicts resolved |
| 2 | Project doc **19 · Marketing tone of voice** (`docs/marketing-site/19-marketing-tone-of-voice.md`) | Voice, copy rules, banned words, researched proof stats, CTA labels. Updated 20 Oct with Dan's amends |
| 3 | Figma **AI-Testing** (`GXzYibwnWKKyTeUkwRn8Of`), page **Marketing site** (`170:28407`) | Layout, components, tokens, states, interaction rules |
| 4 | Project doc **18 · Marketing site review and brief** | Truth audit, claims register, competitor research. **Partly superseded:** ignore everything about founding clubs, the sandbox demo editor, the Clubhouse page, the free homepage sent to prospects, the four-week switching plan and the Works With strip |
| 5 | Doc **15 · Hero golf ball asset** | The approved 3D ball for the intro |
| 6 | Doc **04 · Infrastructure and guardrails** | Stack, CI gates, security. Applies to this site like any other code in the repo |
| 7 | Doc **08 · Brand colour contract** | Club colour rules (relevant to the Website builder page's colour demo) |

Use the Figma MCP (`get_design_context`, `get_variable_defs`, `get_screenshot`) on the node IDs below. **Never build from** anything in the section *"Archived · removed 20 Oct"* or any component prefixed **⚠ Deprecated**.

---

## 3. Decisions already made (don't reopen)

- **No founding-clubs offer.** No founding price, counter, application form or "places left". It makes the company look small.
- **No demo sandbox / hands-on editor** for prospects.
- **No Clubhouse page and no "browse every block" page.** Show a few blocks in real depth, Linear-style.
- **No money-back or exit guarantee** at this stage.
- **Don't name Dan's past companies.** Use "more than 8 years delivering and scaling sports platforms".
- **Copy is plain and professional, not clever.** Doc 19 rules apply to every string, including errors, meta descriptions and alt text.
- **Primary CTA everywhere: "Book a demo".** No "Get your free homepage" button anywhere (removed 21 Oct). A CTA band may keep a plain secondary such as "See pricing". Book a demo page is itself the CTA, so it has no CTA band.
- **Example homepage, shown in the demo** (21 Oct). Built by an AI agent from the club's current site, then checked by Dan. It's an example of what the club gets if it signs, **not a deliverable**: it isn't sent to the club, and it isn't theirs until they sign up. Nothing else is built before signing. Never call it "free".
- **Switching is paid** (21 Oct). A **one-off setup fee, agreed with each club** (no number on the site). AI copies the club's existing content; Dan builds the new site with them and **supports them until it's live**. **No fixed timeline**: no "four weeks", no week-by-week plan. Never write "no setup fee".
- **Bookings is Coming next, as an optional paid add-on (phase 2).** Clubs that don't buy it keep their current booking system and the site links to it; that link is all we offer, so no "works with" list. No stored-value cards or clubhouse spending. In the nav, Bookings carries the clock icon only. Bookings, members area, facilities, competitions, function rooms and handicaps are all Coming next.
- **Golf ball intro on the homepage stays**, behind strict rules (§6).
- **Pricing as designed, under review (Q11):** £149 a month **plus VAT**, billed monthly, 12-month minimum, then rolling with 90 days' notice, **plus the one-off setup fee**. No annual toggle. Build it from `marketingSettings` so it can be hidden or changed in one place.

---

## 4. Open decisions: ask Dan before you build these parts

Build everything else first. Each has a default you can scaffold against, kept behind config so it's cheap to change.

| # | Question | Blocks | Default until answered |
|---|---|---|---|
| 1 | **Does the marketing site run on the platform itself (Payload)?** Three headline claims depend on it ("what you type is what members see", live blocks, "nothing on this page is a picture") | Architecture | Yes, see §5. Confirm before scaffolding |
| 2 | **VAT registered?** Decides how every price is written | Pricing, FAQ, PDF | "+ VAT" from one config value (`priceVatLabel`) |
| 3 | **Per-course pricing.** The calculator has a course stepper (one/two courses). What does a second course cost? | Pricing calculator | Stepper visible, second-course price from config, flagged in claims register |
| 4 | **Demo booking: which calendar?** The Demo Booking component has a real "Pick a time" step. Needs Dan's real weekday availability | Book a demo | Cal.com API behind our own UI. Ask before wiring |
| 5 | **Colour nudge vs block.** Builder copy says low-contrast colours get nudged; doc 08 Rule 4 says the save is blocked | Website builder copy | Hide that line until Dan decides |
| 6 | **Neon plan.** Trust copy says "restore to any point in the last 7 days" (Launch plan) | Trust | Value from config; don't ship until confirmed |
| 7 | **Changelog at launch?** It has an empty state plus roadmap cards. Doc 19 says don't draw attention to what doesn't exist yet | Changelog | Build it, keep it out of nav and footer, unpublished |
| 8 | **Product film** on Website builder: is there a video? The frame overlaps the Token dial section in Figma | Website builder | Leave the section out |
| 9 | **Analytics.** Vercel Analytics and maybe Google Analytics | Consent banner | Vercel Analytics only (cookieless), so no consent banner needed at launch |
| 10 | **Real contact targets:** Dan's photo, phone or calendar link for the Founder Card | Home, Book a demo | Card built with placeholder initial; links from config |
| 11 | **Public prices or per-club quotes?** Pricing isn't final and may differ by club, which could mean removing the £149, the calculator and the Pricing page (21 Oct) | Pricing, nav, CTA bands, FAQ | Build as designed, every price from `marketingSettings`, with one switch (`showPublicPricing`) that hides the Pricing page, its nav link and every price mention |
| 12 | **Contract terms** (12-month minimum, 90 days' notice) aren't final either (21 Oct) | Pricing, FAQ | From `marketingSettings`; flagged ❓ in the claims register |

---

## 5. Architecture (recommended)

**Same repo, same Next.js + Payload app, served on the company domain.** Reasons: the "live block" demos must render real club block components, the copy promises that editing works the way the product does, and one codebase is one set of CI gates.

- **Routing:** the domain middleware that resolves club tenants (doc 04 §5) maps the company domain to the marketing site instead of a tenant. Use a Next.js route group, e.g. `app/(marketing)/`. The marketing site must never be resolvable as a club, and no club host may reach marketing routes.
- **Content in Payload:** a `marketingPages` collection (or Pages with a `site: marketing` scope) built from the **Marketing · Blocks (CMS)** set only: Section Header, CTA Band, Media, Rich Text, Feature Card, plus the bespoke marketing sections below as blocks. Only Dan (super-admin) can edit it. Access control default-deny, same as everything else.
- **Globals:** `marketingSettings` holds company name, email, price, VAT label, contract term, Neon restore window, Founder Card data, footnote sources. Every number on the site comes from here or from a block field, never hard-coded in JSX.
- **Live demos:** `Browser Chrome` + a real club block rendered with a **demo tenant's** tokens, scaled inside the frame. Never a screenshot. Demo clubs are fictional and labelled "Demo club". If a club block isn't built yet, its section stays hidden; don't fake it with an image.
- **Tokens:** marketing tokens (`--mk-*`) live in their own scope so they can't leak into club sites, and club tokens inside a live demo can't leak out. Wrap each demo in a container that sets that demo tenant's CSS variables.
- **Forms:** Payload collection `demoRequests` (the Switching page form and Book a demo both create one), email to Dan via Resend, rate-limited and spam-protected at edge and app (doc 04 §8).
- **Caching:** static by default, revalidated on publish.

If Dan answers no to Q1, fall back to a standalone Next.js app in `apps/marketing` with MDX content, importing club blocks from the shared package. Drop the "what you type is what members see" claim if the site isn't editable that way.

---

## 6. Pages

All desktop frames are 1440 wide on a 1200 container. Mobile frames (390) exist only for Home, Pricing, Book a demo and Switching. Build the rest responsively using the same mobile patterns (stacked sections, full-width buttons at 44px, Nav Mobile drawer, Footer Mobile, Founder Card / Stack).

### Sitemap and nav

| Page | Route | Desktop | Mobile | Status |
|---|---|---|---|---|
| Home (+ intro) | `/` | `176:2178` · intro `198:7782` | `273:8954` | Build |
| Website builder | `/website-builder` | `183:3008` | — | Build |
| Bookings | `/bookings` | `184:3614` | — | Build as **Coming next preview** |
| Pricing | `/pricing` | `185:3821` | `274:9185` | Build |
| Switching to us | `/switching` | `186:6494` | `300:9636` | Build |
| Book a demo | `/book-a-demo` | `187:7336` | `275:9525` | Build |
| Trust & security | `/trust` | `187:6879` | — | Build, **hold publishing** (§10) |
| Accessibility statement | `/accessibility` | `212:8158` | — | Build |
| Changelog | `/changelog` | `187:6499` | — | Build, unpublished (Q7) |
| Privacy policy, cookies, terms | `/privacy` etc. | **Not designed** | — | Rich Text pages on the same template as Accessibility. Content from Dan |
| 404 | — | **Not designed** | — | Section Header + CTA band, plain copy |

**Nav** (`Marketing/Nav` `175:1875`, mobile `272:8990`): take labels from the component, don't invent. Expected: Website builder · Bookings (clock icon) · Pricing · Switching, then **Club log in** (goes to the Payload admin) and **Book a demo**. **No ⌘K hint and no command menu** (deprecated). Search, if kept, is the plain Search Trigger. Nav has Top and Scrolled states. Changelog, Trust, Accessibility and legal pages live in the footer (`175:1876`, mobile `272:8991`).

~~**Committee summary A4** (`295:38372`)~~: **removed by Dan, 21 Oct 2026. Don't build.**

### Home

1. **Intro** (first visit only, see below).
2. **Hero:** "Your club is better than your website." + subhead + Book a demo + proof line ("Your demo includes your own club's homepage, rebuilt on the platform."). **Tenant Morph** (`176:2177`): one set of blocks, three demo clubs (Heritage, Coastal, Booking-led), switched with **Tenant Chips**. This is the product story; make it the focus. Check the Booking-led variant shows no unbuilt booking feature, or badge it.
3. **First impressions:** three **Proof Stats** with footnotes, then "When it does the club justice" vs "When it lets the club down". Stats and sources in §9.
4. **Edit and live:** **Edit Live Split**. Editor fields on the left, the live block on the right updating as you type. Interactive if the site runs on the platform.
5. **A week at the club:** four **Timeline Moments** using **live blocks only** (course status, news post, green fees, hole guide). Swipeable carousel on mobile.
6. **Your content comes with you:** current site → new site visual, three numbered points.
7. **Who's behind it:** full-width **Founder Card**, first person, signed by Dan, under 60 words.
8. **CTA Band**, then footer.

**Intro animation** (spec frame `198:31761`, component `198:7777`, states Ball → Scroll cue → Launch → Arrive):
- Idle: ball spins (one turn per 8s, tilted axis), 4px bob on a 3s loop, contact shadow breathes. At 1.2s the tagline and scroll cue fade up.
- Any wheel, swipe, ↓ or Space launches it: the ball arcs up-left into the hole in the logo over 700ms, `cubic-bezier(.2,.7,.2,1)`, shrinking 260 → 7px while spin speeds up 6×, with a dawn trail. A dawn ring ripples from the mark (300ms). At +750ms the nav fades in and hero lines rise 24px with 60ms stagger. Scroll unlocks.
- **Rules:** once per session (`sessionStorage`); "Skip intro" and any key jump to the end; never traps scroll after launch; `prefers-reduced-motion` → no intro at all; mobile ball 180px, swipe up launches; no WebGL → pre-rendered poster and a CSS-only launch.
- **Use the approved GLB from doc 15**, not the procedural sphere the Figma spec mentions (doc 15 came later and was approved). `golf_ball.glb`, 91 KB, Draco. Material and lighting in doc 15: `MeshPhysicalMaterial` with clearcoat, soft studio HDRI, ACES tone mapping. **Self-host the Draco decoder.** Ask Dan for the GLB or regenerate it with `claude/assets/golf-ball-generator.py` (approved values: DEPTH 0.24, TOUCH 0.62, BLEND 0.30).
- React Three Fiber, **lazy-loaded after first paint**, so the hero's LCP never waits on WebGL.
- **No logo exists yet**, but the ball lands in "the hole in the logo". Build the target as a configurable anchor on the Wordmark (`174:1816`) so a real mark can drop in later.
- Measure bounce with and without the intro in the first month (feature flag).

### Website builder

Intro (Section Header + CTAs + **Block Flipper** with Desktop/Tablet/Mobile **Segment Options**), **Token dial** (club colours: pick, then adjusted), **Course guide** (live Hole Grid C block in Browser Chrome), **Course status** (live Course Status + News Post), **Features** (two rows of four Feature Cards), CTA band. Hide the Product film (Q8). Every Block Flipper variant must exist for real at all three widths before it ships. The Token dial copy about contrast waits on Q5.

### Bookings (Coming next preview)

Headline frames it as coming next, as an **optional add-on**. The intro says the site links to the club's current booking system until then (no provider list, no "works with" strip, no brand names). Label "Coming next · designs from our build. Not live yet. Prices and times are examples." **Tee Sheet Simulator** (Browsing / Held / Confirmed), **Club Settings Panel** (Guarantee off/on), **Facilities Carousel** (Range / Activities / Spa), CTA band. No brand names (no Toptracer). No "three taps", no "one basket". No-show fee copy: staff charge it in one click (it's manual).

### Pricing

**Pricing Calculator** (`185:3775`, configs One course / Two courses): price, "+ VAT", term together. Courses stepper. Only live modules toggle; Tee-time booking, Members area and Facilities booking render as **disabled rows with the Coming next badge** and "price confirmed at launch". Founding column stays hidden. Included list: hosting, security and backups · every live block, on every page · unlimited editors. Setup is a **one-off fee agreed with each club**, stated next to the price with no number; never "no setup fee". **Prices roll digit by digit** when the calculator changes. **Committee questions** FAQ (two columns desktop). Answers lead with yes/no. "Who owns our content" and "What happens if we leave" must name a concrete export format. The FAQ says what the setup fee covers (we move your content across and support you until the site is live). All pricing respects Q11 and Q12.

### Switching to us

Hero row: Section Header ("See your club on it") + three tick points + **Homepage Request Form** (`265:8785`), which now **requests a demo** (button "Book my demo"); the example homepage is shown in that demo. Below it an example demo-club homepage. **The desktop frame still contains a deprecated URL Reskin instance there.** Replace it with the static Demo club frame used on mobile (`Hero / A · Heritage`). Then: Your content comes with you, **The switch** (Section Header only: set up with you for a one-off fee, supported until live; the Weeks 1–4 timeline is removed), FAQ, CTA band. Same domain before and after. "Will we lose our place on Google?": promise redirects and preserved page titles, never rankings.

### Book a demo

Two columns: Section Header + "what to expect" ticks + email fallback, and the **Demo Booking** component (Details → Pick a time → Booked). Add a **Current website** field to Details so Dan can prepare the example homepage before the call. Weekday slots only, from Dan's real calendar (Q4). **Never state how long the call lasts.** Founder Card below. No CTA band.

### Trust & security

Intro + four Feature Cards (pillars) + CTA band. Documents use the **Document Row** "Available on request" state (mail action, not download) until the DPA, security overview and sub-processor list exist. No uptime bars, no "All systems normal" until fed by real monitoring. "Stored in London" only once Neon, Vercel functions (`lhr1`) and R2 jurisdiction are configured. "Who you're dealing with" is cut (doc 19).

### Accessibility statement

Section Header, "Last reviewed" date and read time, Rich Text + Media. Say **"designed to meet WCAG 2.2 AA"**, not "built to", until each block has a recorded test. Drop the caption under the greenkeeper photo.

### Proof slots (`296:9609`), do not build yet

Logo strip, case study, and "Homepages we've rebuilt" gallery are designed for later. Build them as blocks only when Dan has a real club to put in them. Never with placeholders.

---

## 7. Components

### Build (current)

| Component | Node | Notes |
|---|---|---|
| Nav / Nav Mobile | `175:1875` / `272:8990` | Top, Scrolled; drawer Closed/Open |
| Footer / Footer Mobile | `175:1876` / `272:8991` | Status line removed unless real |
| Button | `174:1846` | Primary, Secondary, Ghost × Default, Hover, Pressed, Focus, Disabled |
| Nav Link, Text Link, Pill Tab, Segment Option, Tenant Chip, Filter Chip | various | Default, Hover, Focus, Current/Active, Pressed |
| Switch, Icon Button, Time Slot | `219:8340` section | Full state sets |
| Field | `185:3608` | Default, Focus, Filled, Error, Hover, Disabled |
| FAQ Item | `185:3621` | Closed, Open, Hover, Focus |
| Browser Chrome | `176:1929` | Frame for live blocks, "Demo club" label |
| Tenant Morph | `176:2177` | Heritage, Coastal, Booking-led |
| Edit Live Split | `180:2587` | |
| Timeline Moment | `178:2450` | Past, Active, Upcoming; badge slot |
| Preview cards | Course Status, News Post, Green Fees, Hole Guide | Live data shapes only. **Not** Tee Sheet, Competition Results or Function Room Booking on Home |
| Block Flipper, Token Dial | `183:2796`, `183:2934` | |
| Tee Sheet Simulator, Club Settings Panel, Facilities Carousel | Bookings section | Coming next page only |
| Pricing Calculator | `185:3775` | See Pricing |
| Demo Booking | `187:6498` | Details, Pick a time, Booked |
| Availability Badge | `263:8726` | Live / Coming next / Beta × Default/Small. **Text plus icon, never colour alone.** Optional season text, hidden until Dan commits to dates |
| Proof Stat | `264:8700` | Number, one-line claim, footnote source and date |
| Founder Card / Stack | `264:8707` / `272:9022` | |
| Roadmap Card | `264:8753` | Changelog only |
| Homepage Request Form | `265:8785` | Default, Submitted. Now a demo request: "Book my demo", no date promised |
| Golf Ball, Intro | `197:31164`, `198:7777` | |
| Section Header, CTA Band, Media, Rich Text, Feature Card | `210:7925` section | The CMS blocks |

### Do not build

Command Menu and ⌘K overlay · Kbd hint · Score Dial · Changelog Entry (as designed) · Founding Counter · Sandbox CTA · Application Form · URL Reskin · Works With Strip and Provider Item (deprecated 21 Oct) · "Get your free homepage" buttons · Block Card and block thumbnails (Clubhouse only) · anything in the Archived section.

---

## 8. Design system

### Tokens (from Figma variables)

Pull the full set with `get_variable_defs` on `176:2178`. Expose as CSS custom properties; no raw hex in components.

| Group | Key values |
|---|---|
| Surfaces | `--mk-surface-canvas #091a13` · `--mk-surface-raised #0d2219` · `--mk-surface-elevated #11291f` · `--mk-surface-hover #173327` · `--mk-surface-tint #f3f1ea0a` |
| Text | `--mk-text-primary #f3f1ea` · `--mk-text-secondary #a3ada6` · `--mk-text-tertiary #8a968f` · `--mk-text-on-accent #091a13` |
| Accent | `--mk-accent-dawn #ebc07a` · `-wash #ebc07a14` · `-edge #ebc07a66` |
| Signal | `--mk-signal-live #7bd4a0` · `-wash #7bd4a029` |
| Borders | `--mk-border-hairline #f3f1ea14` · `-strong #f3f1ea29` · `-track #6b767066` |
| Radius | control 8 · window 12 · panel 14 · pill 999 |
| Space | 4, 8, 12, 16, 24, 32, 40, 64, 80, 96, 128 · container 1200 |

Club tokens (`--color-*`, `--brand-*`, Cormorant Garamond, DM Sans) belong to the live demo blocks only.

### Type

| Style | Font | Size / line-height / tracking |
|---|---|---|
| Display XL | Newsreader Regular | 80 / 1.02 / −2.2 |
| Display L | Newsreader Regular | 60 / 1.05 / −1.8 |
| Heading M | Newsreader Regular | 28 / 1.2 / −0.6 |
| Heading S | Hanken Grotesk SemiBold | 17 / 1.35 / −0.2 |
| Body L / M / S | Hanken Grotesk Regular | 19 / 1.55 · 16 / 1.55 · 14 / 1.5 |
| Label / Label S | Hanken Grotesk Medium | 15 / 1.3 · 12 / 16px, +0.2 |
| Eyebrow | Hanken Grotesk Medium | 14 / 1.3 |

Self-host fonts with `next/font`, subset, `font-display: swap`.

### Layout rules (from "CMS block rules", `212:8319`)

- 1200px container. 128px section padding top and bottom, 96px above a CTA band, 64px header to content, hairline between sections.
- Headings only via Section Header. Page size once per page; Section size elsewhere; Compact only in two-column layouts. Editors never pick a size. Titles under 8 words, body under 30.
- Rich Text: H2, H3, paragraphs, lists, links, quotes. No font/size/colour controls. 720px reading width.
- Media: 16:9, 3:2, 1:1, 4:5 only, cover-cropped with editor focal point. **Alt text required.** Plain frame for photos, Window frame for product UI.
- Feature Cards in equal rows of two or three (Website builder uses four), shared icon set.
- Every page ends with a CTA Band before the footer, except Book a demo.

### Interaction rules (from `220:8582`)

- **Press:** scale 0.97 (icon buttons 0.95), 120ms ease-out.
- **Hover:** colour and border only, 150ms. Only under `@media (hover: hover) and (pointer: fine)`. No lifts, no glows.
- **Focus:** `:focus-visible` only. 2px gap, then a 2px dawn ring, on every control. Never removed, never animated.
- **Details:** button arrows nudge 3px on hover; link underlines draw from the left; switch knobs stretch on press; prices roll digit by digit; the tee-time hold counts down in real seconds with tabular figures.
- **Curves:** enter `cubic-bezier(0.23, 1, 0.32, 1)`; move `cubic-bezier(0.77, 0, 0.175, 1)`; never ease-in. Springs (duration 0.35, bounce 0.15) for switches, tabs and anything dragged.
- **Speed:** UI under 300ms; popovers 180ms; drawers 240ms. Only the intro and scroll reveals run longer.
- **Keyboard-triggered things never animate.**
- **Entrances:** never from `scale(0)`; start at 0.95 and transparent; popovers grow from their trigger. Sections rise 24px and fade in once with 60ms stagger, never replay on scroll up.
- **Reduced motion:** keep fades, drop movement. No intro, no parallax, no rolling numbers.
- **Words:** confirmations use the person's name; errors say what to do next; no exclamation marks.

---

## 9. Copy

**All copy comes from Figma** (`get_design_context` returns the text). Don't rewrite it. If something is missing or reads wrong, check doc 19 and ask Dan rather than improvising. Any copy you must write yourself (errors, empty states, meta descriptions, alt text, 404) follows doc 19's checklist.

Headline rules in short: eyebrow (1–3 words) · headline (3–7 words, a claim about the club's world) · subhead (one sentence, under 20 words) · one hard specific per section. Use "your club", "blocks", "coming next", "club log in", "switching to us". Never "solution", "seamless", "platform" in headlines, "users", golf puns, scarcity, meeting lengths, or "Send us your website".

### Researched proof (use exactly these, each with its footnote)

| Stat | Source line |
|---|---|
| 84% of visiting golfers are highly likely to visit a club's website before they visit | Golfshake survey, reported by The Golf Business, 13 Jan 2022 |
| 64% of golfers research a course online before booking; around 75% of under-65s | Golfshake survey of 800+ golfers, 24 Jul 2026 |
| Members rated their own club's website 3.44 / 5 | Golfshake member survey, via The Golf Business, Jan 2022 |
| 46.1% of comments about a site's credibility were about its visual design | Stanford Persuasive Technology Lab (Fogg et al.), 2002 |
| 53% of mobile visits are abandoned if a page takes over 3 seconds | Google, The Need for Mobile Speed, 2016 |

The top-100 audit stat (26 of 93) and "0 of 4 providers publish prices" are retired.

### Things that must not appear anywhere

Added 21 Oct: "free homepage", "Get your free homepage", "no setup fee", "four weeks" or any fixed switching timeline, "send it straight to you", a "works with" provider list.

Lighthouse scores or "every club site scores 100" · load-time comparisons (4.8s vs 0.6s) · uptime figures · customer counts, logos or testimonials · pre-dated changelog entries · "Toptracer" or any real course named or captioned as a fictional club · roles that don't exist (captain drafts, greenkeeper posts) · "handicaps" · "nothing breaks" · "checked as you edit" for focus states.

### Claims register

Create `docs/marketing-site/claims-register.md` and add a row for every factual claim before it ships: claim, page, evidence, owner, recheck. Seed it from doc 18 (unlimited editors, contrast check on save, alt text required, old addresses redirect, restore window, London storage). A claim with no evidence row doesn't ship. Turn the register into a test where you can (e.g. alt text required on the Media schema, redirects collection exists, `versions: { drafts: true }` on marketing pages).

---

## 10. Forms and integrations

**Homepage Request Form** (Switching page; requests a demo):
- Fields: club name, current website, email. Validate URL loosely (accept without `https://`).
- Success state: "Thanks. We'll be in touch." plus "We'll email {email} to arrange your demo." **No date promised.** Use the person's name if collected.
- Creates a `demoRequests` record, emails Dan, sends the prospect a plain confirmation. Rate-limit; honeypot plus Cloudflare Turnstile.
- The example homepage is shown in the demo. It is never emailed or linked to the prospect.

**Demo Booking:** Details → Pick a time → Booked. Availability from Dan's real calendar (Q4). Weekdays only. Confirmation email with a calendar invite.

**Club log in:** links to the Payload admin. The marketing site holds no club sessions.

**Analytics:** Vercel Analytics (Q9). If GA is added later, it needs the consent banner and must default off.

---

## 11. Quality bar (definition of done for every page)

- **Accessibility:** WCAG 2.2 AA target. Semantic landmarks, one H1, skip link, visible focus, keyboard-operable everything (tenant chips, calculator, carousel, FAQ, demo booking, Block Flipper). Badges and status never by colour alone. Live regions for calculator totals and form results. 400% zoom without loss. Test with axe in CI plus a manual keyboard pass; log results for the Accessibility statement.
- **Performance:** hero LCP must not wait on the intro or WebGL. Target green Core Web Vitals on mid-range mobile. Images via `next/image` with explicit sizes. Live demo blocks lazy-hydrate below the fold. Keep the 3D bundle off every page except Home.
- **SEO:** unique titles and meta descriptions (doc 19: one benefit, one proof, under 155 characters), Open Graph images, `sitemap.xml`, `robots.txt`, canonical URLs, Organization JSON-LD using the config name. Staging and previews are `noindex`.
- **Responsive:** 390, 768, 1024, 1440. Tablet isn't designed; derive it, then screenshot it for Dan.
- **Images:** licences for the hero, Two-column thumbnail and accessibility photos are **unconfirmed**. Ship with clearly licensed stock or demo imagery, captioned "Demo club · Heathland course" style. Ask Dan before using any of the "Images for use" photos.
- **Guardrails (doc 04 §7):** branch → CI (types, lint, tests, secrets scan, dependency scan) → preview link → Dan's visual sign-off → production. Nothing direct to prod. With each PR, give Dan the plain-English summary: what changed, why it's safe, which checks passed, preview link.

### Launch gate (all must be true)

- [ ] No claim on any page lacks a claims-register row with evidence
- [ ] Every unbuilt feature carries the Coming next badge; Bookings nav item shows the clock
- [ ] Prices show VAT treatment and term next to the number (Q2 answered)
- [ ] No uptime, status or Lighthouse figures unless fed by real data
- [ ] Trust documents set to "Available on request" or the real documents exist
- [ ] Image licences confirmed; no real course captioned as a fictional club
- [ ] Mobile works for every page; intro respects reduced motion and once-per-session
- [ ] Privacy policy and cookie notice published
- [ ] Forms deliver to Dan end to end
- [ ] Pricing shown or hidden per Q11, with the setup fee stated wherever a price appears
- [ ] No "free homepage", "no setup fee" or fixed switching timeline anywhere

---

## 12. Known conflicts and Figma issues

| Issue | Resolution |
|---|---|
| Intro spec says procedural dimple normal map on a sphere | Use the approved GLB from doc 15 |
| Interaction rules say "⌘K opens instantly" | ⌘K and the command menu are deprecated. Ignore |
| Doc 18 recommends a founding offer, sandbox and Clubhouse page | Overruled by Dan on 20 Oct. Don't build |
| Doc 18 suggests "Who's behind this" plus "Who you're dealing with" on Trust | Founder Card yes (Home, Book a demo); "Who you're dealing with" cut |
| Switching desktop still embeds a deprecated URL Reskin | Replace with the static demo club frame, as on mobile |
| Website builder: Product film frame overlaps Token dial (both at y 1359) | Leave the film out until Dan confirms (Q8) |
| Builder colour copy (nudge) vs doc 08 (block on save) | Hide the line until Q5 is answered |
| Home Tenant Morph has a "Booking-led" club | Check it shows nothing unbuilt; badge if it does |
| Figma review note mentions "Thursday 23 October" | No dates on the request form any more (21 Oct) |
| Doc 19 examples still use "free homepage", "Four weeks, start to finish" and "£149" as the hard specific | This hand-off wins. Doc 19 is updated 21 Oct; if a copy still differs, follow §3 |
| Doc 12 describes native booking as part of the platform | Booking is an optional paid add-on, phase 2 (doc 12 updated 21 Oct) |

---

## 13. Suggested build order

1. Read docs 19, 18, 15, 04 and this file. List anything unclear for Dan in one message.
2. Confirm Q1 (architecture) with Dan, then scaffold: marketing route group, domain routing, `marketingSettings` global, marketing pages collection, access control, tokens and fonts.
3. Primitives and controls with full state sets; Storybook or a `/dev/components` route behind auth for Dan to review.
4. Nav, footer, Section Header, CTA Band, Media, Rich Text, Feature Card.
5. Home without the intro (hero, Tenant Morph with live blocks as they exist, proof, edit and live, week at the club, content, founder, CTA). Mobile alongside.
6. Pricing (behind `showPublicPricing`, Q11), Switching (with the demo request form wired end to end), Book a demo.
7. Website builder, Bookings preview, Trust, Accessibility, legal pages, 404.
8. Intro animation, behind a flag.
9. SEO and analytics.
10. Launch gate walkthrough with Dan.

Keep Dan's open questions in one running list in `docs/marketing-site/open-questions.md` and update it as answers come in.
