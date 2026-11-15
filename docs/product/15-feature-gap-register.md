# Feature gap register: what real club sites have that we don't yet cover

Written 15 Nov 2026 (two rounds, 50 sites). Purpose: stop us importing a club and only then finding a missing feature, as happened with women's tees at Cottrell Park. The build plan for every gap is in `docs/plans/feature-gaps-plan-2026-11-15.md`.

## How this was done

- **50 sites audited** in two rounds of 25. Round 1 leaned towards well-known and resort venues; round 2 leaned towards ordinary members' clubs, our main customers. Twelve further sites could not be read and were replaced.
- **Spread:** England 21, Scotland 15, Wales 7 (Conwy, Royal St David's, Aberdovey, Radyr, Tenby, Wrexham, Aberystwyth), Northern Ireland 6, Jersey 1. Members' clubs, visitor-led links, resorts and council courses.
- **Golfworking:** exactly one Golfworking site (Conwy), since they are all alike. While picking round 2, eight more candidates turned out to be Golfworking builds, four of them Welsh: Llanishen, Newport, Ashburnham, Pennard, Delamere Forest, Harrogate, Alnmouth, Hayling.
- **Method:** each site's menu plus 6 to 10 inner pages, read as text. Pictures, PDFs and logins were **not** read, so each count means **"at least this many of 50"**.
- **Importance:** **High** = blocks or distorts a core page (scorecard, fees, competitions) or forces a workaround on most imports. **Medium** = clubs would notice and ask. **Low** = nice to have, or workable today.

## The ranked list

| # | Gap | Seen on (of 50) | Importance |
|---|---|---|---|
| G1 | Tee sets: more than four, more colours, separate women's tees, winter tees | **21** | High |
| G3 | Open competitions: entry rules, entry windows, results | **37** | High |
| G4 | Course notices: dated closures, winter mats, reduced holes; weekly visitor times | **26** dated, **18** weekly | High |
| G2 | Price lists with dates that switch over by themselves | **21** | High |
| G6 | Membership: joining fee, "full / waiting list", payment by instalments | **26** | Medium |
| G7 | Course handicap tables worked out from rating and slope | **21** | Medium |
| G16 | Course status for each course (multi-course clubs) | **19** multi-course clubs | Medium |
| G15 | Warnings when content goes out of date | stale or conflicting content on **22** | Medium |
| G5 | Extra enquiry fields (hire, caddies, catering, address) | **14** | Medium |
| G17 | Weather on the site | **10** | Low–Medium |
| G10 | Vacancies list | **15** | Low–Medium |
| G13 | Honours boards (past captains, champions, hole-in-ones) | **9** | Low–Medium |
| G14 | Society and golf-day package cards | **11** | Low |
| G11 | Webcam embed | **6** | Low |
| G12 | Courses of 6, 10, 12 holes, and 27-hole "three nines" | **5** | Low |
| G8 | A third header button | **6** | Low |
| G18 | "Add to my calendar" on events | **2** | Low |

**Dropped after review:** testimonials (Dan: covered by the quote block; note one quote per block, and 18 of 50 sites show testimonials, often three to five at once). Header with "Book" plus "Members' login" turned out to be **already covered** (main button plus second button); only a third button is new (G8).

**Decisions rather than builds:** D1 resorts (8 of 50), D2 pulling competitions from IntelligentGolf and similar (used by at least 23 of 50), W1 Welsh and other languages (1 of 50).

---

## Evidence for each gap

### G1. Tee sets (21 of 50) · High

Our courses allow **four tees in five colours** (white, yellow, red, blue, black), with women's par, stroke index, rating and slope stored on the same tee as the men's.

- **More than four tees:** Knole Park (six), Littlestone (six), Trevose (six), Worplesdon (eight: four men's, four women's), Radyr (seven including winter and "Rainbow"), Wrexham (six including winter), Royal St David's (five men's plus three women's), Kingsbarns, Gleneagles and Rockliffe (five each), Panmure (five, counting the women's yellow).
- **Colours we don't have:** green (Sandiway, Ludlow, Elie, Knole, Littlestone, Kingsbarns, Royal St David's), gold (Worplesdon, Portstewart), purple (Worplesdon), orange (Radyr, Trevose), silver (Aberdovey). Bude names tees by **number** (60, 57, 54), not colour.
- **Separate women's tees with their own yardages:** Conwy, Royal St David's, Sandiway, Littlestone, Purbeck, Ludlow (ability-based tees, rated for men and women), Worplesdon, Elie, Portstewart, Bude.
- **Winter tees:** Conwy, Radyr, Wrexham, Kedleston Park, Castlerock.

### G3. Open competitions (37 of 50) · High

Our events have a date, price, member price, capacity, booking link and category. Missing:
- **Entry rules:** handicap limit (Worplesdon 1.0 or less; Littlestone 9.9; Bude max index men 25.9, ladies 31.5; Gullane; Crail), age and gender (Crail: men 50+, ladies 55+, juniors 15 and under; Littlestone men 55+), CDH number required (Clitheroe, Brora).
- **Entry windows:** "sign-up opens 10:00 on 15/01/2027" at Sandiway, Ely, Knole, Copt Heath, Blairgowrie, Aberdovey, Crail; "bookable until" at Ludlow; closing dates at Worplesdon and Littlestone.
- **Ballot and caps:** Worplesdon (60 entries, ballot if oversubscribed), Littlestone, Shiskine, Royal Dornoch, Carnoustie.
- **Format and tee:** Frilford ("Best 2 of 4", "Black Tee"), Bude, Crail.
- **Filters** for men, ladies, juniors and seniors: Sandiway, Knole, Castlerock, Royal County Down.
- **Results (21 of 50):** PDFs (Conwy, Royal St David's, Cruden Bay, Crail, Blairgowrie, Portstewart, Purbeck), results tables (Wrexham, Castlerock), pictures (Ludlow), outside systems (Trevose, Brora, Bramshaw, Copt Heath and more).
- Entry itself always happens on an outside system (IntelligentGolf, BRS, HowDidiDo, Golf Genius), so we only need to **show and link**, not take entries.

### G4. Course notices (26 dated, 18 weekly) · High

- **Dated seasonal changes:** winter mats (Aberdovey, Carnoustie, Cruden Bay, Purbeck 1 Nov to 31 Mar, Sandiway, Clitheroe, North Berwick, Blairgowrie, Copt Heath); closed for winter (Royal St David's to visitors 19 Oct to 1 Feb, Kingsbarns, Dunbar Nov to Feb, Panmure April to October only, Brora); holes closed (Radyr holes 3 to 5, sold as a 15-hole round; Portstewart Strand down to 16 then 14 holes from 1 Dec); buggies medical-only in winter (Wrexham, Clitheroe); special weeks (Crail during The Open 2027); Gleneagles' closure calendar to Dec 2027.
- **Weekly visitor times:** Worplesdon (Monday to Thursday only), Copt Heath (Monday and Thursday, lunch break 1 to 2pm), Dunbar (Thursdays members only), Littlestone (no groups Tuesday and Saturday), Frilford (no visitors before 1pm summer weekends), Elie (11:00 to 12:30 and 14:30 to 16:00; members only mid-July to mid-August), Blairgowrie, Portstewart, Portrush, Trevose, Cruden Bay, Knole, Kedleston and others.
- Today our course status is "open, restricted, closed" **right now**, set by hand, and nothing is scheduled.

### G2. Price lists that switch over by themselves (21 of 50) · High

**Dan asked why we would show two years together.** We don't have to. The point is **dates**, not two tables:
- Clubs publish next year's fees months ahead because visitors and societies book a year out: Portrush opens 2028 bookings in Feb 2027; Kingsbarns opens next year's tee times on 1 June. North Berwick, Portstewart, Royal St David's and Elie show both years for that reason.
- More often, clubs **forget to switch**: Castlerock still shows winter 2025/26 prices in November 2026, Wrexham's society page says "Summer 2025", Tenby shows only summer 2026, Dunbar quotes 2024 rates, and Gleneagles labels prices "for 2025".
- Our rate table knows only **months**, so it cannot tell "Nov to Feb 2026" from "Nov to Feb 2027", and it cannot switch over by itself.

Sites with dated price lists: Radyr, Aberystwyth, Purbeck, Clitheroe, North Berwick, Elie, Portstewart, Bude, Castlerock, Blairgowrie, Ballycastle, Royal St David's, Aberdovey, Rockliffe, Gleneagles, Stoke Park, Brora, Cruden Bay, Carnoustie, Gullane, Royal Dornoch.

### G6. Membership details (26 of 50) · Medium

- **Joining fee** separate from the subscription: Tenby (£280), Wrexham (£200), Sandiway (£3,000, or £1,500 for women because of ladies' vacancies), Copt Heath (£2,200), Knole (1.5 times the subscription), Littlestone (equal to the first year), Clitheroe (couples 20% off), Royal St David's, Aberdovey, Brora, Conwy. Purbeck advertises "no joining fees" as a selling point.
- **Full, closed or waiting list per category:** Radyr (not accepting applications), Wrexham (several categories closed), North Berwick (500 cap, waiting list closed), Crail (full, waiting list suspended), Dunbar, Portstewart, Castlerock, Littlestone, Knole (junior closed), Royal St David's, La Moye, Cruden Bay, Trevose, Kingsbarns.
- **Instalments and direct debit:** Wrexham (12 monthly payments), Blairgowrie, Aberystwyth and Ballycastle (finance provider), Sandiway (entrance fee spread), Royal St David's.
- Age-banded fees appear on about 15 sites. The membership cards cope (one card per band), but a long list is easier as a rate table.

### G7. Course handicap tables (21 of 50) · Medium

Published as PDFs per tee, men's and women's, at Radyr (also 9-hole), Wrexham (at 100%, 95% and 85% allowances, plus winter and 9-hole), Sandiway, Knole, Bude, Littlestone, Purbeck, Clitheroe, Ludlow, Elie, Blairgowrie, Dunbar, Worplesdon, Royal St David's, Machrihanish, Carnoustie, Hawkstone, Belfry, Aberdovey, Trevose, Kingsbarns. Clubs keep these as PDFs that go stale whenever ratings change. We already store rating, slope and par, so we can **work the table out** and keep it current automatically.

### G16. Course status for each course (19 multi-course clubs) · Medium

Course status is one per club. Clubs with two or more courses include Frilford (three), Bramshaw, Littlestone, Purbeck, Crail, Blairgowrie, Portstewart, Castlerock, Malone (three nines with separate status), Gullane, Carnoustie, Trevose, Celtic Manor, Belfry, Royal Dornoch, Machrihanish, Royal County Down, Portrush, Hawkstone. Explicit per-course status seen at Frilford, Malone, Littlestone, Crail, Portstewart and Carnoustie. Ludlow and Bude also use short condition codes (preferred lies, fairway mats, no trolleys, no buggies, temporary greens), which our status rows can already show.

### G15. Out-of-date content (22 of 50) · Medium

Stale or contradictory content was everywhere: last year's prices (Castlerock, Wrexham, Dunbar, Gleneagles, Copt Heath), last year's fixtures (Crail, Ballycastle), the same price shown two ways on one page (Littlestone, Bramshaw, Knole), "© 2021" footers (Ely), template placeholder text live on the home page (Aberystwyth), broken links (Ballycastle), "coming soon" pages (Ballycastle, Trevose), an empty webcam page (Brora). This is both a **product feature** (the admin should nudge editors) and a **sales message**.

### G5. Extra enquiry fields (14 of 50) · Medium

Our enquiry asks purpose, name, preferred date, group size and message. Clubs also ask: caddies, trolleys and hire clubs (Royal County Down, Panmure); which course (Portrush); holes, inclusions and catering (Conwy, Aberdovey, Carnoustie); function type and start and finish times (Aberystwyth venue hire); group or society name (Wrexham); date of birth (Wrexham, La Moye); address (Radyr, Copt Heath); "how did you hear about us?" (Copt Heath); several interests at once (Rockliffe).

### G17. Weather (10 of 50) · Low–Medium

A three-day forecast or "on the course today" panel: Wrexham (every page), Purbeck, Knole, Clitheroe, Littlestone, Dunbar, Blairgowrie (wind and sunset), Castlerock, Portrush (header), Machrihanish (page). We already store each club's latitude and longitude.

### G10 to G18 (smaller)

- **G10 Vacancies (15):** Conwy, Brora, Cruden Bay, Belfry, Carnoustie, Trevose, Rockliffe, Gleneagles, Celtic Manor, Hartswood, Radyr, Tenby, Frilford, Worplesdon, Clitheroe.
- **G13 Honours boards (9):** Worplesdon, Panmure (home page), Ludlow, Littlestone (winners since 1894), Frilford, Radyr, Kingsbarns, Cruden Bay, Knole. Today they are pictures of the clubhouse boards or plain text.
- **G14 Society and golf-day packages (11):** Ely (Bronze to Platinum), Frilford (three corporate tiers), Purbeck (by group size and day), Aberystwyth (menus with prices), Aberdovey (Birdie, Eagle, Albatross), Wrexham, Belfry, Rockliffe, Conwy, Celtic Manor, Copt Heath (a Canva link).
- **G11 Webcam (6):** Royal Dornoch, Brora, Trevose, Carnoustie, Littlestone, Crail.
- **G12 Unusual hole counts (5):** Shiskine (12), Gullane children's course (6), Littlestone ladies' (10), Malone (27 holes as three nines), Brora (composite card).
- **G8 Third header button (6):** Bude (Enter an Open, Members Booking, Visitor Booking), Royal St David's, Littlestone, Wrexham, Tenby, Ely.
- **G18 Add to calendar (2):** Tenby, Sandiway (also planned in doc 02).

## Decisions for Dan

- **D1. Resorts (8 of 50):** Celtic Manor, The Belfry, Gleneagles, Rockliffe Hall, Hawkstone Park, Trevose, Stoke Park, and Carnoustie's multi-brand set-up. None of round 2's ordinary clubs were resorts. **Recommend:** out of scope for v1. Clubhouse functions, weddings and venue hire (Tenby, Knole, Aberystwyth, Purbeck, Radyr, Ely, Copt Heath) are already covered by pages and the enquiry form.
- **D2. Showing competitions and results from the club's own system:** IntelligentGolf appears on at least **23 of 50** sites (often as the whole website: "Created by intelligentgolf version 10.1.2"), then BRS, HowDidiDo, ClubV1, Golf Genius. Pulling a club's open list and results automatically would save editors retyping, but it is an integration with each supplier. **Recommend:** later, after G3; record it as a candidate.
- **W1. Languages:** only Gleneagles (French and German). Aberystwyth shows a bilingual club name and a Welsh Language Policy PDF, but no Welsh site. **Recommend:** watch only.

## Already handled (write onboarding guidance, no build)

Hole-by-hole pages with tips and videos (about 20 of 50, our course tour is a strength); fee, caddie and hire price lists (rate table); reciprocal clubs, county cards and partner tickets (15 of 50: text, FAQ or document list); sponsor logos (logo strip); outside booking, shop and voucher links; PDFs for scorecards, policies and application forms (document list); coaching and academies (team block and rate table); venue hire and functions (pages plus enquiry purpose); a "Book" plus "Members' login" pair in the header; testimonials (quote block).

## Pre-import check (run on a club's old site before agreeing to import)

1. How many tees per course? Separate women's or winter tees? Colours beyond ours? (G1)
2. Open competitions: entry rules, entry windows, ballot, results? (G3)
3. Seasonal closures, winter mats, holes out of play, weekly visitor times? (G4)
4. Are prices dated, and is next year's list already out? (G2)
5. Joining fees, full categories, instalments? (G6)
6. Handicap tables published? (G7)
7. More than one course? (G16)
8. What do their enquiry forms ask? (G5)
9. Weather, webcam, vacancies, honours boards, packages? (G10 to G17)
10. Courses other than 9 or 18 holes? (G12)
11. Which outside systems (booking, members, opens, results, shop)? (links only)
12. Hotel, spa or other businesses? Another language? (D1, W1)
13. Facts held only as pictures or PDFs? (we will type them in)

## Per-site log

| Site | Type | Notable |
|---|---|---|
| Conwy (Golfworking) | Welsh members | Separate women's tee sets, winter tee, four seasons, opens with PDF results |
| Royal Dornoch | Links, 2 courses | Balloted opens, webcams, visitor requests by email |
| Machrihanish | Links | Fees as pictures, 9-hole Pans, handicap table PDF, weather page |
| Royal County Down | Links, 2 courses | Caddie-heavy booking form, opens filters, sustainability |
| Gullane | Links, 3 courses + kids | 6-hole children's course, combination tickets, museum |
| Stoke Park | Club and hotel | Points-based packages, dated fee bands |
| Celtic Manor | Resort | Four courses, breaks, multi-brand |
| The Belfry | Resort | Three courses, corporate days, Toptracer range |
| Leeds council | Council | Golf as a council sub-page, season tickets |
| Brora | Small links | Composite 9-hole card, partner tickets, webcam |
| Shiskine | 12-hole island club | 12 holes, tennis and bowls, ballot |
| Trevose | Club and resort | Six tees, three courses, webcam and 360° tour |
| Hawkstone Park | Resort | Two courses, follies attraction |
| La Moye | Jersey | Reciprocal clubs, ladies' par, waiting list |
| Rockliffe Hall | Resort | Five tees, multi-interest enquiry |
| Gleneagles | Resort | Closure calendar, French and German |
| Cruden Bay | Links, 2 courses | Gents and ladies cards, PDF results, waiting lists |
| Royal Portrush | Links, 2 courses | Blocked visitor days, phone-only next-year booking |
| Royal St David's | Welsh links | Five men's and three women's tees, category full, winter closure |
| Aberdovey | Welsh links | Paired tee sets, winter mats, joining fee |
| Kingsbarns | Links | Five tees, honours board, season dates |
| Carnoustie | Links trust, 3 courses | Per-course status, webcams, handicap tables |
| Hartswood | Council | Loyalty card, employer discounts |
| Radyr | Welsh members | Seven tee sets, holes 3 to 5 closed, not accepting members |
| Tenby | Welsh links | Joining fees, ticketed events with calendar export, accommodation |
| Wrexham | Welsh members | Six tees with winter, results tables, weather, closed categories, DD |
| Aberystwyth | Welsh members | Dated fees, venue hire form, finance, placeholder text live |
| Sandiway | Members | Green tees, women's sets, entry windows, £3,000 entrance fee |
| Knole Park | Members | Six tees, entry windows, joining fee rule, weather |
| Bramshaw | Members, 2 courses | Gym memberships, external forms |
| Kedleston Park | Members | Winter tees, hole videos |
| Bude | Members | Tees named by number, entry rules, results, three header buttons |
| Littlestone | Links, 2 courses | Six tees, ballot, waiting lists, webcam, winners since 1894 |
| Isle of Purbeck | Members, 2 courses | Women's yardages, winter mats, no joining fee, simulator |
| Clitheroe | Members | Dated seasons, CDH rule, reciprocal clubs |
| Frilford Heath | Members, 3 courses | Per-course status, visitor times, corporate tiers |
| Ely City | Members | Entry windows, society tiers, "© 2021" |
| Ludlow | Members | Ability tees rated for men and women, results as pictures, honours |
| Worplesdon | Heathland members | Eight tee sets, strict entry rules, Monday to Thursday visitors |
| North Berwick | Links | Both years' fees, 500 cap, waiting list closed |
| Crail | Links, 2 courses | Entry rules, Open-week rules, all categories full |
| Elie | Links | Visitor time windows, summer members-only weeks |
| Panmure | Links | Honours boards on home page, April to October visitors |
| Dunbar | Links | Closed Nov to Feb, Thursdays members only, 2024 rates |
| Blairgowrie | Heathland, 3 courses | 9-hole course rated for 9 and 18, entry opening date, DD |
| Portstewart | Links, 3 courses | Gold tees, women's yardages, holes reduced in winter |
| Castlerock | Links, 2 courses | Winter tee, results list, stale winter prices |
| Malone | Members, 27 holes | Three nines, per-nine status |
| Copt Heath | Members | Monday and Thursday visitors, £2,200 joining fee |
| Ballycastle | Links | Dated seasons, 2025 fixtures still live |

Not readable (replaced): Muirfield, Pyle & Kenfig, Ashridge, Southampton, Moor Park, Burhill (domain now for sale), Dundonald, Royal Troon (expired certificate), Haste Hill, Woburn, Southerndown, Nefyn.
