# Step 5: the template, block by block

Agreed with Dan on 12 Oct 2026: build continuously, one PR per section, merged to staging when
CI is green. Dan reviews everything at the end (list below).

Every block is **one block with a Design style choice (A / B / C)** from the Figma file
(`GXzYibwnWKKyTeUkwRn8Of`). Out of v1: member login, booking widget/pages, billing.

## Order
1. ✅ 5.1 Foundations: branding, font sets, logo, header + menu, footer, photo library (R2)
2. ✅ 5.3a Hero block (three styles) and photo sizes
3. 5.3b Picture check (block-regression CI job)
4. Core blocks: CTA Card Grid · Two-Column Image + Text · Rich Text · Rate / Pricing Table ·
   Gallery · Document List · Map / Location
5. Golf and story blocks: Pull-Quote · Timeline · Partner / Logo Strip · FAQ · Team / Staff ·
   Membership · Hole-by-Hole + Scorecard · Course Status
6. Site-wide: Announcement Bar · Cookie Consent
7. Templates (doc 14): News · Events · Contact

## For Dan to review at the end
- All header, footer and Hero styles on staging, in both colour themes
- Font sets: Heritage, Editorial, Contemporary (swap any later)
- Hero C uses the club's booking button instead of the tee-time search bar
- Editorial font set: Fraunces headings look heavier than Cormorant at the same size
- Price table C on phones: booking panel sits below the prices (spec wanted a fixed bottom bar)
- Gallery C is an on-page viewer (Figma's C is the full-screen viewer that A and B open)
- Map: drawn, colour-themed map by default; the interactive map is OpenStreetMap (free, loads on click). A real styled map image needs a provider (Mapbox or Google, paid): decide later
- Map pin label is small on phones (the drawing scales down): polish later
- Timeline A: the optional "fade in on scroll" effect is left out (steadier; can add)
- FAQ answers are plain text inside the block (no links yet; spec suggested a shared FAQ collection with rich text)
- Team: people live in a new "Team & staff" list (name, role, department, photo, bio, email, phone, one qualification tag). Departments are a fixed list (Golf, Course, Club & membership, Clubhouse, Committee); say if clubs need their own
- Team: staff emails never appear whole in the page source (the "@" is added in the browser), to limit spam scraping
- Membership: categories are typed into the block (like the price table), not a separate shared list. Doc 02 suggested a "Membership Tiers" collection; worth it only if the same categories appear on several pages
- Membership C: the enquiry card links to the contact page for now. Figma's built-in form (qualifying question, email, "Request a call back") waits for the email provider decision
- Hole by hole: courses (holes, tees, rating/slope) are a new "Courses" list. The first tee listed is the club's main tee (Figma mentions a "Default tee" setting; this does the same job). Hole cards open a details pop-up; there are no separate hole pages
- Scorecard A on phones scrolls sideways with the row names fixed (as its Figma note says), rather than the separate phone layout drawn with a tee picker; style C does that job. Scorecard C on tablets scrolls sideways instead of splitting into two strips
- Scorecard: "Download scorecard" uses a PDF uploaded to Documents (no PDF is generated automatically)
- Course status: set in a new "Course status" record (one per club, created with the club); after 24 hours without a change the site says "not updated today" and asks visitors to call. Weather in the band (Figma B) is left out until a weather provider is chosen (e.g. the free Open-Meteo, no key) — **open decision**. The embeddable <course-status> widget for newsletters is not built
- Announcement bar: set in Club Settings → Announcement (style, colour, up to 3 notices with start/end dates). Dismissing hides it for the visit. Header style B over a hero now starts below the bar
- Header fix found along the way: on pages only just long enough to scroll, the header's top row could flicker; it now only comes back after a real scroll up
- **Cookie banner not built (open decision):** the sites set no tracking or advertising cookies today, so UK rules don't require a banner and one would mislead visitors. Needed once an analytics tool is chosen (which one? per club?)
- News: the archive and article are fixed templates at /news and /news/<address>; the archive heading ("Club news") and intro are fixed text for now
- Events: the archive at /events shows every upcoming event via "Show more"; Figma's quarter pager ("October – December" with arrows) is left out. Events have no pages of their own: Book / Enquire goes straight to the link set on the event (a booking site or one of the club's pages)
- Open decisions: email provider (newsletter, contact form), site search (wanted?)
