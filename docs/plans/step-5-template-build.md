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
- Open decisions: email provider (newsletter, contact form), site search (wanted?)
