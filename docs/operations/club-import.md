# Moving a club's existing website onto the platform

How we build a new club's site from their current website, so they see a finished site on day one. Runs so far: Cottrell Resort (28 October 2026, built on staging) and Bearwood Lakes (5 November 2026, the first demo club built on production).

**The one rule: never make up content.** Every fact, price, name and date comes from the club's own site, documents or what they tell us. Wording can be trimmed or restructured to fit a block, but never added to. If something is missing, leave it out and put it on the "ask the club" list.

## The decision: demo clubs are built on production, and only production

Dan's rule (5 Nov 2026): every demo club is built on **production** as a **demo club** (`demo` switched on), never on staging. A demo is easy to delete (30 days, one club) and easy to push live (switch the demo flag off and connect the club's domain; no content copy). Staging is for testing the platform itself. The staging steps at the end are kept for completeness; do not use them for a demo.

## What you get

- The club built on production as a demo, in the Payload admin: pages, menu, footer, branding, people, documents and the public demo link (`docs/operations/prospect-demos.md`)
- Three files, all **sent to Dan in chat** when the review is ready (not left in the folder, where they go unseen):
  - `REVIEW.md`: what was found, where it went, decisions made, platform gaps
  - `ASK-THE-CLUB.md`: what is missing, out of date or contradicts itself, plus anything needing the club's consent
  - `SUGGESTIONS.md`: what to add next and what the new site already improves

## Where things live

| | Where | In git? |
|---|---|---|
| The import tool | `src/import/clubImport.ts`, `scripts/import-club.ts`, `scripts/lib/importTargets.ts` | Yes |
| A club's copied content, photos and content file | `club-imports/<club>/` | **No**. The club owns it; `.gitignore` excludes the folder |
| The private settings files | `~/.golf-platform/*-import.env`, outside the project | **Never** |

## Steps

### 1. Copy their site

- Check their `robots.txt` and follow it. Copy slowly (one page a second).
- List every page from the sitemap (`/sitemap.xml`, `/wp-sitemap.xml`, `/sitemap_index.xml` or `/page-sitemap.xml`).
- WordPress sites often have a data feed (`/wp-json/wp/v2/pages`, `/posts`, `/media`). Bearwood's returned 401 (locked); then use the page HTML.
- Save each page's HTML, then turn it into plain text with its images, links and documents listed (jsdom is in the repo). Strip the repeated header, footer and "Read more" cards.
- Download the photos and documents. Photo links often carry a size (`-768x512`); try the address without it for the original.
- **Videos on YouTube or Vimeo are not downloaded: use the Video block** (paste the address, add a poster photo). Only videos stored on the club's own server need downloading, and the club should be asked to move those to YouTube or Vimeo, which saves storage. The hero's silent loop still has to be a file (under 50 MB).
- Look out for:
  - Email addresses hidden by Cloudflare (`data-cfemail`): decode them
  - Prices and fixtures held in images or PDFs: read them, and turn them into price tables
  - Embedded documents (Google or Office viewers): the real file is in the viewer link
  - Other embeds (a Matterport tour, Google Maps): link out; we have no block for them yet

### 2. Look at the photos (don't skip this)

Descriptions can't be written from file names. Make numbered contact sheets (`montage` from ImageMagick, 20 photos each) and look at every one.

- **Leave out photos with identifiable people** from a public demo: couples, guests, children, visiting players. We don't have their consent or the club's confirmation. Staff portraits that sit on the club's own staff pages are fine. List the excluded photos on the ask-the-club list as "needs consent".
- Write one plain description per photo you use, saying only what the photo shows, from what you actually saw. The club checks them.
- Keep a table of photo number to description (Bearwood: `photos.json`) and refer to photos by key in `site.ts`.
- Logos: if only a white logo exists, a navy copy can be made for the demo; say so on the ask list and ask for the real one.

### 3. Review (Dan approves before building)

Write `REVIEW.md` covering:
- What they have: pages, news, documents, photos, videos, courses and people
- A proposed site map and homepage, built on good practice, not a copy of their layout
- Where each of their pages goes, and which blocks it uses
- Branding: logo (light and dark versions), the closest of our font sets, and their colours (check white text on their accent colour has enough contrast)
- **Conflicts in their own content.** Example: two different capacities for the same room. Pick the official source, and say which
- **Gaps:** things we won't invent (a map position, prices, opening hours)
- **Platform gaps:** things their content needed that we can't hold yet
- What we're leaving out, and why

Then send `REVIEW.md`, `ASK-THE-CLUB.md` and `SUGGESTIONS.md` to Dan in chat (step 9).

### 4. Write the content file

Create `club-imports/<club>/site.ts` (see Cottrell's or Bearwood's as examples). It's plain data:

- `media`, `documents`, `staff`, `courses`: each with a short key
- `pages`: in menu order, with `parent` for drop-downs, and `layout` in the same shape the editor saves
- `settings` (branding, menu, footer, contact and its topics), `courseStatus`, `news`, `events`
- References: `@media:key`, `@doc:key`, `@staff:key`, `@course:key`, `@page:slug`, `@category:slug` (every club starts with course, competitions, clubhouse, membership, academy and club). The import fills them in. A news story's `category` can be just the slug; a Latest news block's must be `@category:slug`
- Rich text: `{ $rt: [['h2', '…'], ['p', '…'], ['ul', '…', '…'], ['img', '@media:key']] }`

Rules the first runs found:
- **Reserved addresses.** A page can't be called `contact` (the platform has its own Contact page). Link to it with the built-in link, and turn the club's department emails into the contact form's topics (membership, events, lessons, general), each with its own inbox.
- **Field limits stop the import:** hero and block small lines (eyebrows) 40 characters, headings 60, card titles 30, card descriptions 100, two-column text 700. Check lengths before running.
- **Video block:** every video needs its own poster photo. If you have no photo per video (for example 18 holes), reuse one general photo rather than imply a photo shows a hole it doesn't.
- **Policies** need a last-reviewed date; if the club's document only says "October 2024", file it under Other instead of inventing a day.
- Documents must be PDF or Word `.docx`; convert old `.doc` files with `textutil -convert docx`. Uploads are limited to 50 MB.
- Don't invent a map position. Without a latitude and longitude, leave the Map block out and use the address and a directions link.

### 5. Try it locally first

Before anything near production, build the club on a throwaway local database and look at it:

1. Create a private database (for example `CREATE DATABASE golf_import_x` in the Docker Postgres) and run `payload migrate` against it.
2. Run the import against it (`pnpm import-club club-imports/<club>` asks for the database). Validation errors name the page and field; fix the content file and run again.
3. Start the site with `SITE_PREVIEW=on` and open `/preview/<club>`. Check every page at desktop and phone width, that videos show their poster first and load nothing from YouTube until pressed, and that photos load.
4. Next caches page data on disk: if you rebuild a club and the page still shows old photos, delete `.next` and restart the server.
5. Drop the private database.

### 6. One-time setup: production's settings file

The import needs production's database address and photo storage keys. They live in one private file in Dan's home folder, **outside the project**, so they can never be committed: `~/.golf-platform/production-import.env`.

```
DATABASE_URL=
MEDIA_S3_ENDPOINT=
MEDIA_S3_BUCKET=
MEDIA_PUBLIC_URL=
MEDIA_S3_ACCESS_KEY_ID=
MEDIA_S3_SECRET_ACCESS_KEY=
```

Vercel marks all of these "Sensitive", so they can't be read there. Get them from where they came from. Never paste them into chat.

| Setting | Where |
|---|---|
| `DATABASE_URL` | Neon → the **`golf-production`** project (check the name at the top-left: the staging project is a different one) → **Connect** → role **`golf_app`** (the website's limited account), database `neondb` → copy the connection string. **Never press "Reset password" on `golf_app`: the live website uses it.** Never use the owner account here |
| `MEDIA_S3_BUCKET` | `golf-platform-media-production` |
| `MEDIA_S3_ENDPOINT` | Cloudflare → R2 → `golf-platform-media-production` → Settings → **S3 API**, ending at `.r2.cloudflarestorage.com` **without the bucket name on the end** |
| `MEDIA_PUBLIC_URL` | Must be exactly what the live site uses for photos. Check it: open any page of the live marketing site and look for the `…r2.dev` address in its images or in the `img-src` of its security header. No bucket name on the end |
| `MEDIA_S3_ACCESS_KEY_ID` and `MEDIA_S3_SECRET_ACCESS_KEY` | Cloudflare → R2 → **Manage API tokens** → a separate token with Object Read & Write on `golf-platform-media-production` only. The secret is shown once |

To create the file without pasting secrets anywhere, make it from a terminal and fill the empty lines in TextEdit (`chmod 600` it).

**The import checks the settings files against each other** before it connects, and stops if the staging and production files share a database server (Neon's pooled and direct addresses count as the same), the same photo bucket or the same public photo address. It only says server and bucket names, never passwords. This exists because on 5 Nov 2026 the production file held staging's database address by mistake, and a "production" import landed in staging's database. The check only works when both files exist, so before every production run also read the host the run prints.

Delete the file again if you'd rather not keep production's keys on this Mac between runs, and revoke the token in Cloudflare.

### 7. Build the demo on production

```bash
pnpm import-club-production club-imports/<club> demo
```

**Only run it with Dan's explicit yes, every time** (a yes for an earlier run doesn't cover a rerun).

Before running:
1. **Be on a clean copy of `main`.** Other Claude sessions switch branches in the shared checkout. Make a throwaway worktree (`git worktree add --detach <folder> origin/main`, link `node_modules`, copy `.env`) and run from there with the full path to the club folder. Remove it afterwards (unlink the `node_modules` link first).
2. **Check the host.** Run once with an empty answer to the prompt: it prints the database host and stops. For production it must not be staging's. If the safety check complains, fix the settings file; don't work round it.
3. **The release must be on production first.** If the club uses a new block, that block and its migration must already be released (merge the `main` → `production` release PR; its required checks must pass).
4. **Keep the laptop awake and online** (lid open, plugged in) for 10 to 15 minutes. Closing the lid in the middle of the first Bearwood attempt cut the network and failed the run.

What it does:
- It shows production's database name and server and waits for the word `production`.
- It builds a **new** club only. If a club with that short name is already on production, it stops and changes nothing.
- With `demo` it prints the demo link path (add the company's domain in front) and the day it stops working (30 days).
- If the build fails part-way it tries to remove the half-built club. If the connection was lost it can't. Then check what is left (the club's rows and its photos in the bucket) and remove it with Dan's approval, recording the file addresses first and checking afterwards that none answer any more.
- Once the club is on production, don't edit the content file and re-run it. Edit in the admin.

After it finishes, check the **live** domain, not just the log (the log reports success even when it wrote to the wrong database):
- the demo link loads on the company's domain, with `x-robots-tag: noindex` and the "Demo - expires in …" strip
- every page returns 200
- photos load from the production bucket address
- the security header allows only YouTube's no-cookie player and Vimeo's player for frames
- the Contact page says "This is a demo"

### 8. Show it to the club

Send the demo link. Don't show the club's site to anyone outside the company until the club agrees. To extend a demo or switch it off, see `docs/operations/prospect-demos.md`, including the go-live checklist (switch Public demo off first, so search engines can index the live site).

### 9. Hand over the three files

Send `REVIEW.md`, `ASK-THE-CLUB.md` and `SUGGESTIONS.md` to Dan in chat as files, and again when they change. `SUGGESTIONS.md` is for the club: what to fix or confirm first, what to add next (features they're not using yet), and what the new site already improves. Only claim something about their old site (for example "pages have no search description") after checking it.

## Staging builds (not for demo clubs)

`~/.golf-platform/staging-import.env` holds staging's database and `golf-platform-media-staging` keys (Neon → the **staging** project, not `golf-production`; its only branch is called "production", Neon's default name). `pnpm import-club-staging club-imports/<club>` replaces the whole club on staging and asks you to type `staging`; it refuses a club that has editor accounts or an accepted agreement. Import once, then edit in the admin.

## Platform gaps found so far

Fixed: ratings by gender, ladies' stroke index, events with no start time, hole guides without photos (Cottrell, #223 to #225); the Video block for YouTube and Vimeo (Bearwood, #264).

Still open:
- The Video block needs a poster for every video; making it optional (a branded panel with the title) would suit 18 hole fly-throughs
- No Matterport or other virtual tour embed
- Calendar files (`.ics`) can't be uploaded as documents
- A club with no latitude and longitude gets no map
- Button text on a pale accent colour can have poor contrast; check the club's colours
