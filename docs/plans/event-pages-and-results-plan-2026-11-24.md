# Plan: event pages and built-in results

Written 24 Nov 2026. **Approved by Dan (24 Nov), with the recommended answers to the four questions. Part 1 built (#389); part 2 built (results).** Dan's idea: an event works like a news article. It has its own page where the club can write about it, and after a competition the club adds the results to that same page. Golfers then find everything in one place.

## Where we are today

- An event is a **card only**. It has no page of its own. Its button goes wherever the club points it, which is often the Contact page, and the form there knows nothing about the event.
- Competition details (who can enter, entry rules, format, entry window, ballot) exist already (G3, 15 Nov).
- **Results can only be a link** to a PDF, a page or another website. The events page lists past events that have one.

## What real clubs publish (research)

I used the 21 results-publishing clubs from the 50-site audit (`docs/product/15-feature-gap-register.md`), plus results pages and files from Westridge, Kirkbymoorside, Balmore, Carlyon, Whinhill, Pannal, Cavendish and Heworth. Results come out of club software (HandicapMaster, IntelligentGolf, HowDidiDo, BRS) as PDFs or plain tables, or are written up as a short report.

Almost every result is one of these:

| Kind | What it looks like | Typical columns |
|---|---|---|
| **Individual, one round** (stableford, medal, par/bogey) | An overall list, often split into **divisions by handicap index** ("Division 1: up to 18.0") | Position, name, handicap, score (points, nett or +/−), sometimes gross, countback note ("Last nine") |
| **Gross and nett side by side** | "Best gross" as a separate prize or column | Gross, handicap, nett, e.g. "87 − 20 = 67" |
| **Pairs and teams** (better ball, foursomes, greensomes, Texas scramble, Am-Am) | One line per pair or team, with the players' names and often their home clubs | Position, players, home club, team score (scrambles use decimals, e.g. 46.7) |
| **Several rounds** (36-hole club championship, qualifiers) | Round scores plus a total | R1, R2, total |
| **Match play** (club championship knockout, pairs knockout) | A draw, then the results round by round | Round, player or pair A, player or pair B, result ("3 & 2", "1 up", "at 19th") |
| **Separate sections** | Ladies, seniors, juniors, guests, visitors, mixed | Same columns as the main list |
| **Side prizes** | Nearest the pin, longest drive, twos sweep, best front nine | Prize, winner, detail ("Hole 7, 2 ft 3 in") |
| **Extras** | Field size ("52 cards returned"), NR and DQ, playing handicap allowance (95%), ties on countback | Notes rather than columns |

Anything rarer (an Eclectic over the summer, an order of merit, a one-off charity format) gets a **write-up and, if the club likes, its own PDF**. We don't build a special tool for it.

## The plan

### Part 1: every event gets its own page (like news)

**For editors:**
- New **"About this event"** box using the same editor as news articles (text, photos, headings, links). It is optional.
- A **web address** filled in from the title, as news does: `/events/spring-open-2027`.
- Everything else stays where it is: date, price, places, button, competition details.

**On the website:**
- A new event page at `/events/<address>`. Top section: title, date and time, where, price and member price, places left, who can enter, entry rules, format, entry window and the button. Below that: the write-up, then the results (Part 2) once added.
- **Cards and the "What's on" list open the event page.** The page carries the Book, Enter or Enquire button.
- **Enquire is filled in for the visitor.** It opens the club's contact form with the purpose already set to "Events" and the message started as "About: Spring Open, Sat 12 Apr 2027". Only the event's address goes in the link, never anything personal. The visitor still types their own details.
- Event pages show up in site search and the sitemap, and get proper link previews (title, summary, photo).
- **Old events:** a past event's page keeps working at its address, so links shared on social media don't break. The events page still lists only past events that have results.

**Data:** a new web address column (existing events get one made from their title and date) and the write-up. New columns only.

### Part 2: results built into the event

A **"Results"** section on the event, filled in after the day. It is the same page, so nothing new appears on the website until the club adds results.

**For editors:**
1. **Results write-up (optional):** a short report with photos ("Glorious sunshine for the Spring Open…").
2. **Results tables (optional, up to 10):** each table has:
   - **Title**, e.g. "Overall", "Division 1", "Best gross", "Ladies", "Seniors".
   - **Note (optional)**, e.g. "Handicap index 0 to 18.0" or "Playing handicap 95%".
   - **Who:** individuals, pairs or teams. For pairs and teams each row holds the players' names, one per line.
   - **Score shown as:** points, nett, gross, or to par (+/−). This only sets the column heading; the score itself is typed as written, so "46.7", "NR" and "DQ" all work.
   - **Extra columns, ticked on when wanted:** home club, handicap, gross beside nett, rounds (R1 to R4 plus total), countback or note.
   - **Rows:** position, name or names, and the ticked columns. Position fills itself in (1, 2, 3…) unless the club types its own (for example "=2"). Rows show in the order entered, because club software already sorts them.
   - **Paste from a spreadsheet:** copy the rows out of HowDidiDo, IntelligentGolf or Excel and paste them into the table. This is how most clubs will fill it in. Up to 200 rows per table.
3. **Match results (optional):** for knockouts, rows of round (e.g. "Quarter-final"), side A, side B, the result ("3 & 2"), and who won. Shown round by round, final first. **No drawn bracket graphic**, which would be overkill.
4. **Prize winners (optional):** prize, winner, detail. Covers nearest the pin, longest drive, twos sweep and so on.
5. **Results file or link:** what we have today stays, for clubs that would rather upload the PDF from their software.

**On the website:**
- The event page shows a **winner line** at the top of the results (from the first row of the first table, e.g. "Winner: J. Smith, 42 pts"), then the write-up, the tables (as tabs when there are several, as the price table does), the match results, and the prize winners.
- Long tables scroll inside their own box on phones, like the scorecard.
- The events page's results list links to the event page instead of straight to a PDF.
- The site doesn't sort or check scores. It shows what the club entered. That keeps it working for every format.

**Data:** new tables for results tables, rows, matches and prizes, all held inside the event, so they belong to the event's club and nobody else. Covered by the isolation tests.

### Also in each part

- Demo club: two events with write-ups, plus one open with full results (two divisions, best gross, twos sweep) and one knockout, so the pages can be seen and screenshotted.
- The import tool learns the new fields.
- Editor guide (`docs/club-guides/`): a short "Adding results" section.
- Tests: the event page, the prefilled enquiry, results showing, club A's results never appearing for club B, and paste handling.

## How it ships

| PR | What | Size | Database change |
|---|---|---|---|
| 1 | Event pages, write-up, cards open the page, prefilled Enquire | M | New columns |
| 2 | Results tables with paste, match results, prize winners, winner line | M | New tables |

Each lands on staging first, as usual.

## Questions for Dan

1. **Design:** there is no Figma frame for an event page or results tables. My suggestion: the event page borrows the news article layout, and the tables borrow the price table look. Alternatively, you draw them first. (Our rule is to build from Figma, so this needs your call.)
2. **Should every event get a page, or only those with a write-up?** I recommend every event: one place for the button, the details and later the results. A card with no write-up just opens a short page.
3. **Past events without results:** keep their pages working at their address but not listed (my recommendation), or take them down after the day?
4. **Enquire purpose:** competitions would use the existing "Events & weddings" purpose. Alternatively, add a separate "Competitions" purpose so they reach a different inbox?
