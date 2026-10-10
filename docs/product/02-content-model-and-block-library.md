# Content Model & Block Library (Payload CMS)

Full designed version of this doc: Clubhouse Blueprint artifact (https://claude.ai/code/artifact/3ed00485-8ff1-4c13-8982-46e65edf382f). This is the durable text reference for the same content.

## The core idea

Nearly every club needs the same handful of pages (Home, The Course, Visitors & Green Fees, Membership, History, Contact), which argues for **one flexible `Pages` collection** built from the block library below, rather than a rigid page-per-template scheme. A second kind of content — things that repeat or get added to over time (news, competitions, staff, documents, testimonials) — becomes **dedicated collections** that feed structured data into blocks on the flexible pages. A third layer, **globals**, carries branding: logo, colour tokens, typeface pairing, booking-provider config. That's the mechanism that turns this into "one system, N distinct club sites" instead of "one template, forked N times."

## Flexible pages (`Pages` collection, block-built)

| Page | Typical purpose | Seen on |
|---|---|---|
| Home | Hero, headline offer, card-grid map to everything below | 93/93 |
| About & History | Founding story, architect, notable championships | Most clubs |
| The Course | Overview, design philosophy, links into hole-by-hole guide | Most clubs |
| Visitors & Green Fees | Rates, dress code, how to book, group/society terms | Near-universal |
| Membership | Categories, pricing or enquiry flow, how to join, junior/ladies routes | Near-universal |
| Societies & Groups | Package pricing for group/society bookings | Common |
| Golf Breaks / Stay & Play | Bundled accommodation + golf offers | Resort-style clubs |
| Clubhouse & Dining | Restaurant, bar, catering | Common |
| Weddings & Private Events | Venue hire as secondary revenue | ~1 in 5 clubs |
| Corporate & Business Golf | Day packages for companies | Several |
| Pro Shop | Retail teaser, often linking to separate e-commerce | Common |
| Coaching & Academy | Lessons, fitting, junior programmes | Common |
| Sustainability & Environment | Ecological reports, SSSI/AONB status | Growing/emerging |
| Contact & Location | Map, directions, enquiry routes by department | 93/93 |
| Policies & Compliance | Safeguarding, EDI, privacy, terms | 93/93 |

## Structured collections (repeatable, fielded content)

| Collection | Key fields | Feeds |
|---|---|---|
| Course Holes | Hole number, par, yardage, description, image, tips | Hole-by-Hole block, Scorecard block |
| News / Posts | Title, date, author, body, cover image, category | News list block, homepage feed |
| Events & Competitions | Title, date/time, entry terms, result attachment | Event calendar block |
| Testimonials | Quote, attribution, role, photo, source (press/player/guest) | Testimonial block, quote strip |
| Team & Staff | Name, role, department, photo, bio | Team grid block |
| Documents | File, category (policy/scorecard/form), version date | Document-list block |
| Gallery Media | Image/video, caption, album/tag | Gallery grid block, carousel |
| Job Openings | Title, department, description, closing date | Careers list block |
| Membership Tiers | Name, price, billing period, benefits list, CTA | Membership pricing block |

## Globals (set once per club — the branding layer)

| Global | Controls |
|---|---|
| Site Settings | Club name, logo (light/dark), primary & accent colour, display & body typefaces, favicon, social links, footer text |
| Booking Integration | Which third-party tee-time provider is connected (IntelligentGolf, BRS Golf, ClubV1, GolfGenius) and its embed/link config |
| Navigation | Primary menu structure, footer menu, announcement bar on/off |

**Why this split matters:** every block below reads its colours, type, and logo from Site Settings instead of hard-coding them. A club sets its palette and typefaces once; every hero, card grid, and pricing table inherits it automatically.

## Block library

### Marketing & hero
- **Hero (image or video)** — full-bleed background, heading, subheading, 1-2 CTAs. Video-poster and static variants. (Wentworth, Woburn, Woodhall Spa)
- **Announcement Bar** — dismissible strip for time-sensitive notices. (Royal Ashdown Forest, East Devon)
- **CTA Card Grid** — 3-6 tiles linking to Course/Visitors/Membership/Heritage; the dominant homepage pattern in the field. (Moortown, Beau Desert, Cleeve Hill)
- **Partner/Logo Strip** — accreditation and sponsor badges. (Lindrick, Yelverton, Hillside)

### Storytelling
- **Two-Column Image + Text** — alternating media/copy sections, one per facility or story beat. (Wentworth)
- **Rich Text** — general prose fallback. (Universal)
- **Pull-Quote** — a single historic/editorial quote as hero overlay or mid-page break. (Sheringham)
- **Timeline** — chronological club history. (Woodhall Spa, Royal Lytham)
- **Ambassador/Spotlight Profile** — dedicated feature on a touring pro or notable member. (Woburn — Ian Poulter)

### Golf-specific data
- **Hole-by-Hole Card Grid** — one card per hole (photo, par, yardage, description), pulls from Course Holes collection. (Hillside, Formby, Coombe Hill)
- **Scorecard Table** — multi-tee yardage/par table, tabular numerals, horizontally scrollable on mobile. (Hillside, The Berkshire)
- **Course Status Widget** — live open/closed, buggy/trolley rules, timestamp. The single most common live-data block in the field. (Hollinwell, Prestbury, Ferndown)
- **Rate/Pricing Table** — seasonal/dated green-fee tables, supports multiple season tabs. (Hayling — 2026 & 2027 published together)
- **Membership Tier Cards** — priced tiers + CTA; supports an "enquire, no public price" variant for private clubs. (Hadley Wood, Moortown)

### Social proof
- **Testimonial (single or carousel)** — quote, attribution, photo. (Cavendish, Little Aston)
- **Review/Rating Badge** — Google/TripAdvisor/Top 100 rating as compact badge. (Royal North Devon, Ipswich)
- **Press/Media Quote Strip** — multiple short press mentions in a row. (Goswick Links)
- **Social Feed Embed** — live Instagram/X feed in page flow. (Burnham & Berrow, Bearwood Lakes)

### Media
- **Image Carousel/Slider** — homepage or gallery slider, swipe-enabled. (Swinley Forest, Little Aston)
- **Gallery Grid + Lightbox** — tag/album-based photo grid, full-screen viewing. (Appleby, Cleeve Hill)
- **Video Embed** — promo films, course flyovers. (Prestbury, Sutton Coldfield)
- **Virtual Tour/360°/Webcam** — embedded 360° tour or live webcam. (Trevose, Kington, St Enodoc)

### Booking & integration
- **Tee-Time Booking Widget** — embed/deep-link to connected provider; config lives in Booking Integration global. (Near-universal)
- **Flexible Enquiry Form** — one form with a purpose selector (membership/visitor/event/press) instead of five separate forms. (Stoke Park)
- **Event Calendar** — competitions and opens, optionally .ics-exportable. (Prince's)
- **Newsletter Signup** — email capture with GDPR consent checkbox. (Wentworth, Moortown)

### Utility & navigation
- **Map/Location** — embedded map with directions, parking notes. (The Wisley, Appleby)
- **FAQ/Accordion** — for genuine FAQs, not a substitute for a rate table. (Denham)
- **Tabs** — switches between related views (two courses, member vs visitor pricing). (The Berkshire — Red/Blue)
- **Document List** — downloadable PDFs (scorecards, rules, safeguarding policy). (Kington, Ashridge)
- **Team/Staff Grid** — committee, professionals, club officers. (Sutton Coldfield)
- **Stat/Ranking Band** — a row of numbers as a credibility signal (world ranking, founding year, course record). (Ipswich, Royal West Norfolk)
- **Weather Widget** — live local conditions, often paired with Course Status. (Hunstanton, Knole Park)
- **Cookie Consent Banner** — granular GDPR control, not just accept-all. (Wentworth, The Grove)

## Suggested build order

- **Phase 1 (MVP, covers ~80% of pages seen):** Hero, CTA Card Grid, Two-Column Image+Text, Rich Text, Rate/Pricing Table, Testimonial, Tee-Time Booking Widget, Gallery Grid, Document List, Map.
- **Phase 2 (differentiators):** Hole-by-Hole Card Grid, Scorecard Table, Course Status Widget, Membership Tier Cards, Press Quote Strip, Event Calendar.
- **Phase 3 (premium tier):** Virtual Tour/Webcam, Social Feed Embed, Ambassador Spotlight, Timeline, Flexible Enquiry Form.
