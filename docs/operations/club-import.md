# Moving a club's existing website onto the platform

How we build a new club's site from their current website, so they see a finished site on day one. First run: Cottrell Resort, 28 October 2026.

**The one rule: never make up content.** Every fact, price, name and date comes from the club's own site, documents or what they tell us. Wording can be trimmed or restructured to fit a block, but never added to. If something is missing, leave it out and put it on the "ask the club" list.

## What you get

- The club built on your own computer: pages, menu, footer, branding, courses, people, documents, news, events and course status
- `REVIEW.md`: what was found, where it went, conflicts in their own content, and gaps
- `SUGGESTIONS.md`: a list for the club of what to add next and what was improved

## Where things live

| | Where | In git? |
|---|---|---|
| The import tool | `src/import/clubImport.ts`, `scripts/import-club.ts` | Yes |
| A club's copied content, photos and content file | `club-imports/<club>/` | **No**. The club owns it; `.gitignore` excludes the folder |

## Steps

### 1. Copy their site

- Check their `robots.txt` and follow it. Copy slowly (one page a second).
- List every page from the sitemap (`/sitemap.xml`, `/wp-sitemap.xml` or `/sitemap_index.xml`).
- WordPress sites also have a data feed (`/wp-json/wp/v2/pages`, `/posts`, `/media`) with cleaner text and photo descriptions.
- Save each page's HTML, then turn it into plain text with its images, links and documents listed.
- Download the photos, documents and any videos you'll use. Look out for:
  - Email addresses hidden by Cloudflare (`data-cfemail`): decode them
  - Prices and fixtures held in images or PDFs: read them, and turn them into price tables
  - Embedded documents (Google or Office viewers): the real file is in the viewer link

### 2. Review (Dan approves before building)

Write `REVIEW.md` covering:
- What they have: pages, news, documents, photos, courses and people
- A proposed site map and homepage, built on good practice, not a copy of their layout
- Where each of their pages goes, and which blocks it uses
- Branding: logo (light and dark versions), the closest of our font sets, and their colours
- **Conflicts in their own content.** Example: the scorecard and hole guide disagree. Pick the official source, and say which
- **Gaps:** things we won't invent
- **Platform gaps:** things their content needed that we can't hold yet
- What we're leaving out, and why

### 3. Write the content file

Create `club-imports/<club>/site.ts` (see Cottrell's as the example). It's plain data:

- `media`, `documents`, `staff`, `courses`: each with a short key
- `pages`: in menu order, with `parent` for drop-downs, and `layout` in the same shape the editor saves
- `settings` (branding, menu, footer, contact), `courseStatus`, `news`, `events`
- References: `@media:key`, `@doc:key`, `@staff:key`, `@course:key`, `@page:slug`. The import fills them in
- Rich text: `{ $rt: [['h2', '…'], ['p', '…'], ['ul', '…', '…'], ['img', '@media:key']] }`

Write photo descriptions that say only what the photo shows. Documents must be PDF or Word `.docx`; convert old `.doc` files with `textutil -convert docx`. Uploads are limited to 50 MB.

### 4. Import it on your own computer

```bash
docker exec golf-platform-postgres-1 psql -U postgres -c "CREATE DATABASE golf_<club>"
```

```bash
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:54329/golf_<club> pnpm migrate
```

```bash
pnpm import-club club-imports/<club>
```

It asks for the database (paste the `golf_<club>` address) and a confirmation word. Running it again replaces the club completely. It refuses to touch a club that has editor accounts or an accepted agreement.

Running it anywhere but your own computer needs Dan's explicit approval.

### 5. Check every page

Start the site with `SITE_PREVIEW=on` against that database and open `/preview/<club>`. Check every page at desktop and phone size.

After a re-import, the site can show the old version for up to 5 minutes, because the club's address lookup is cached. Restart the preview, or delete `.next/dev/cache/fetch-cache`.

Things the first run caught:
- Buttons that link back to the page they're on
- Labels like "Most popular" that the club never said
- Card grids with a lone card on the last row
- Price tables with no button fall back to "Book a tee time"
- Hole guides with no hole photos: use the carousel style, not the guide style

### 6. Suggestions for the club

Write `SUGGESTIONS.md`: what to fix or confirm first, what to add next (features they're not using yet), and what the new site already improves.
