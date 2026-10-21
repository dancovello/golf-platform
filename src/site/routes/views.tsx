import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { cache } from 'react'

import { heroIsFullBleed, heroShading } from '@/site/blocks/Hero'
import { RenderBlocks } from '@/site/blocks/RenderBlocks'
import { ClubShell } from '@/site/ClubShell'
import { LiveRefresh } from '@/site/components/LiveRefresh'
import { PageNotFound } from '@/site/components/PageNotFound'
import { ContactPage } from '@/site/contact/ContactPage'
import { loadContactSettings } from '@/site/contact/load'
import { eventsArchive } from '@/site/events'
import { EventsArchive } from '@/site/events/EventsArchive'
import { canSeeDrafts } from '@/site/livePreviewAccess'
import { loadClubPage } from '@/site/loadClub'
import { loadNewsPost, newsArchive } from '@/site/news'
import { NewsArchive } from '@/site/news/NewsArchive'
import { NewsPost } from '@/site/news/NewsPost'
import { ClubPrivacyPolicy, privacyPolicyTitle } from '@/site/privacy/ClubPrivacyPolicy'
import type { ResolvedSite } from '@/site/resolveSite'
import { loadSearch, readFilters } from '@/site/search/load'
import { SearchResults } from '@/site/search/SearchResults'

/**
 * A club's public pages, shared by both ways in: its own domain (src/app/(frontend)/sites) and
 * the staging preview (src/app/(frontend)/preview). Each route only works out which club the
 * request is for (src/site/resolveSite.ts) and hands over here.
 */

export type Query = Record<string, string | string[] | undefined>

const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : null)

/** Record IDs are random UUIDs (decisions.md, 11 October); anything else is ignored. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Pages and articles, loaded once per request for both the page and its title. */
const page = cache((tenantID: string, slug: string, draft: boolean) =>
  loadClubPage(tenantID, slug, { draft }),
)
const newsPost = cache((tenantID: string, slug: string, unpublished = false) =>
  loadNewsPost(tenantID, slug, { unpublished }),
)

/** On another of the club's addresses: the same page on its main address. */
export const forwardToMainAddress = async (site: { redirect: string | null }) => {
  if (!site.redirect) return
  const h = await headers()
  permanentRedirect(`${site.redirect}${h.get('x-pathname') ?? '/'}${h.get('x-search') ?? ''}`)
}

/** The club's home: its "home" page, or until it has one, a holding page with its name. */
export const HomeView = async ({ site, query }: { site: ResolvedSite; query: Query }) => {
  const { club, base } = site
  const live = query.live === '1'
  const draft = await canSeeDrafts(club.tenantID, live ? '1' : null)
  const home = await page(club.tenantID, 'home', draft)
  const homePath = base || '/'
  if (home) {
    return (
      <>
        {live ? <LiveRefresh /> : null}
        <ClubShell
          club={club}
          base={base}
          currentPath={homePath}
          overHero={home.layout[0] ? heroIsFullBleed(home.layout[0]) : false}
          heroShading={home.layout[0] ? heroShading(home.layout[0], home.ctx) : undefined}
        >
          <RenderBlocks
            layout={home.layout}
            ctx={home.ctx}
            club={club}
            base={base}
            pageUpdatedAt={home.updatedAt}
          />
        </ClubShell>
      </>
    )
  }
  return (
    <ClubShell club={club} base={base} currentPath={homePath}>
      {live ? <LiveRefresh /> : null}
      <section className="pv-section">
        <h1 className="t-display-l">{club.name}</h1>
        <p className="t-body-l pv-muted">Our new website is on its way.</p>
      </section>
    </ClubShell>
  )
}

/** Paths the site can have: one segment, or /news/<address>. */
const validPath = (path: string[]) => path.length === 1 || (path.length === 2 && path[0] === 'news')

/** One of the club's pages, or a built-in one (privacy, contact, events, news). */
export const PathView = async ({
  site,
  path,
  query,
}: {
  site: ResolvedSite
  path: string[]
  query: Query
}) => {
  if (!validPath(path)) notFound()
  const { club, base } = site

  // The privacy policy is a system page in this same route (not its own), so club pages and
  // the policy share one stylesheet bundle in one order. Checked before the club's pages, so
  // a CMS page with the address "privacy" can't replace it.
  if (path[0] === 'privacy') {
    if (path.length !== 1) notFound()
    return (
      <ClubShell club={club} base={base} currentPath={`${base}/privacy`}>
        <ClubPrivacyPolicy club={club} base={base} />
      </ClubShell>
    )
  }

  // Contact is a template too: the enquiry form (src/site/contact).
  if (path[0] === 'contact' && path.length === 1) {
    return (
      <ClubShell club={club} base={base} currentPath={`${base}/contact`}>
        <ContactPage
          club={club}
          base={base}
          settings={await loadContactSettings(club.tenantID)}
          about={one(query.about)}
        />
      </ClubShell>
    )
  }

  // Events is a template too: /events, the upcoming events. In the admin's live preview
  // (?live=1&event=<id>) the club's own editors also see the event they're editing.
  if (path[0] === 'events' && path.length === 1) {
    const live = query.live === '1'
    const asked = one(query.event)
    const preview =
      live && asked && UUID.test(asked) && (await canSeeDrafts(club.tenantID, '1')) ? asked : null
    const archive = await eventsArchive(club.tenantID, {
      category: one(query.category),
      show: Number.parseInt(one(query.show) ?? '0', 10) || 0,
      include: preview,
    })
    return (
      <ClubShell club={club} base={base} currentPath={`${base}/events`}>
        {live ? <LiveRefresh /> : null}
        <EventsArchive archive={archive} base={base} />
      </ClubShell>
    )
  }

  // News is a template, not a page: /news (the archive) and /news/<address> (an article).
  if (path[0] === 'news') {
    if (path.length === 2) {
      // In the admin's live preview, the club's own editors also see drafts.
      const live = query.live === '1'
      const unpublished = live && (await canSeeDrafts(club.tenantID, '1'))
      const post = await newsPost(club.tenantID, path[1], unpublished)
      if (!post) notFound()
      return (
        <ClubShell club={club} base={base} currentPath={`${base}/news`}>
          {live ? <LiveRefresh /> : null}
          <NewsPost post={post} base={base} />
        </ClubShell>
      )
    }
    const archive = await newsArchive(club.tenantID, {
      category: one(query.category),
      q: one(query.q),
      page: Number.parseInt(one(query.page) ?? '1', 10) || 1,
    })
    return (
      <ClubShell club={club} base={base} currentPath={`${base}/news`}>
        <NewsArchive archive={archive} base={base} />
      </ClubShell>
    )
  }

  if (path[0] === 'home') redirect(base || '/')
  // Inside the admin's live preview, the club's own editors see their latest draft.
  const live = query.live === '1'
  const draft = await canSeeDrafts(club.tenantID, live ? '1' : null)
  const found = await page(club.tenantID, path[0], draft)
  if (!found) notFound()
  const startsWithHero = found.layout[0]?.blockType === 'hero'

  return (
    <ClubShell
      club={club}
      base={base}
      currentPath={`${base}/${found.slug}`}
      overHero={found.layout[0] ? heroIsFullBleed(found.layout[0]) : false}
      heroShading={found.layout[0] ? heroShading(found.layout[0], found.ctx) : undefined}
    >
      {live ? <LiveRefresh /> : null}
      {/* No visible title on pages without a hero (Dan, 2026-10-19), but screen readers and
          search engines still need one main heading per page. */}
      {startsWithHero ? null : <h1 className="visually-hidden">{found.title}</h1>}
      <RenderBlocks
        layout={found.layout}
        ctx={found.ctx}
        club={club}
        base={base}
        pageUpdatedAt={found.updatedAt}
      />
    </ClubShell>
  )
}

/** The club's search results, at /search?q=… (src/site/search). */
export const SearchView = async ({ site, query }: { site: ResolvedSite; query: Query }) => {
  const { club, base } = site
  const view = await loadSearch(club, base, readFilters(query))
  return (
    <ClubShell club={club} base={base} currentPath={`${base}/search`}>
      <SearchResults club={club} base={base} view={view} />
    </ClubShell>
  )
}

/** A missing page: the club's own header, footer and links. */
export const NotFoundView = ({ site, path }: { site: ResolvedSite; path: string }) => (
  <ClubShell club={site.club} base={site.base} currentPath={path}>
    <PageNotFound club={site.club} base={site.base} />
  </ClubShell>
)

/** What's shown when no club matches: says nothing about which clubs exist. */
export const PlainNotFound = () => (
  <main style={{ padding: '96px 24px', fontFamily: 'system-ui, sans-serif' }}>
    <h1>Page not found</h1>
  </main>
)

/**
 * The page's title, and on a club's own domain its canonical address, sharing details and
 * permission for search engines (production only; everything else stays "noindex" from the
 * root layout).
 */
const describe = (
  site: ResolvedSite,
  { title, path, image }: { title: string; path: string; image?: string | null },
): Metadata => {
  const meta: Metadata = { title }
  if (!site.origin) return meta
  const url = `${site.origin}${path === '/' ? '' : path}` || site.origin
  return {
    ...meta,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      siteName: site.club.name,
      title,
      url,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    ...(site.indexable ? { robots: { index: true, follow: true } } : {}),
  }
}

/** Titles and sharing details for the home page. */
export const homeMetadata = async (site: ResolvedSite): Promise<Metadata> => {
  const home = await page(site.club.tenantID, 'home', false)
  const first = home?.layout[0]
  const image =
    first?.blockType === 'hero' ? home?.ctx.media((first as { image?: unknown }).image)?.url : null
  return describe(site, {
    title: site.club.name,
    path: '/',
    image: image ?? site.club.logoOnLight?.url,
  })
}

/** Titles and sharing details for one of the club's pages or built-in pages. */
export const pathMetadata = async (site: ResolvedSite, path: string[]): Promise<Metadata> => {
  if (!validPath(path)) return {}
  const { club } = site
  const named = (title: string) => `${title} | ${club.name}`
  const at = `/${path.join('/')}`
  const logo = club.logoOnLight?.url ?? null
  const fixed: Record<string, string> = {
    privacy: privacyPolicyTitle(club),
    contact: named('Contact'),
    events: named('Events'),
    news: named('News'),
  }
  if (path.length === 1 && fixed[path[0]]) {
    return describe(site, { title: fixed[path[0]], path: at, image: logo })
  }
  if (path[0] === 'news' && path.length === 2) {
    const post = await newsPost(club.tenantID, path[1])
    if (!post) return {}
    return {
      ...describe(site, { title: named(post.title), path: at, image: post.image?.url ?? logo }),
      ...(post.excerpt ? { description: post.excerpt } : {}),
    }
  }
  const found = await page(club.tenantID, path[0], false)
  if (!found) return {}
  const first = found.layout[0]
  const image =
    first?.blockType === 'hero' ? found.ctx.media((first as { image?: unknown }).image)?.url : null
  return describe(site, { title: named(found.title), path: at, image: image ?? logo })
}

/** Results pages are never worth indexing (they change and can be made up endlessly). */
export const searchMetadata = (site: ResolvedSite, query: Query): Metadata => {
  const { q } = readFilters(query)
  return {
    title: q ? `Search: ${q} | ${site.club.name}` : `Search | ${site.club.name}`,
    robots: { index: false, follow: true },
  }
}
