import { notFound, redirect } from 'next/navigation'

import { heroIsFullBleed } from '@/site/blocks/Hero'
import { RenderBlocks } from '@/site/blocks/RenderBlocks'
import { loadClubBySlug, loadClubPage } from '@/site/loadClub'
import { eventsArchive } from '@/site/events'
import { EventsArchive } from '@/site/events/EventsArchive'
import { loadNewsPost, newsArchive } from '@/site/news'
import { NewsArchive } from '@/site/news/NewsArchive'
import { NewsPost } from '@/site/news/NewsPost'
import { sitePreviewEnabled } from '@/site/preview'

import { ClubShell } from '../ClubShell'

export const dynamic = 'force-dynamic'

/** One of the club's pages on staging: its blocks, with the title as a heading unless the
 * page starts with a hero (which has its own headline). */
export default async function ClubPagePreview({
  params,
  searchParams,
}: {
  params: Promise<{ club: string; path: string[] }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!sitePreviewEnabled()) notFound()
  const { club: clubSlug, path } = await params
  if (path.length > 2 || (path.length === 2 && path[0] !== 'news')) notFound()
  const club = await loadClubBySlug(clubSlug)
  if (!club) notFound()

  // Events is a template too: /events, the upcoming events.
  if (path[0] === 'events' && path.length === 1) {
    const base = `/preview/${club.slug}`
    const query = await searchParams
    const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : null)
    const archive = await eventsArchive(club.tenantID, {
      category: one(query.category),
      show: Number.parseInt(one(query.show) ?? '0', 10) || 0,
    })
    return (
      <ClubShell club={club} currentPath={`${base}/events`}>
        <EventsArchive archive={archive} base={base} />
      </ClubShell>
    )
  }

  // News is a template, not a page: /news (the archive) and /news/<address> (an article).
  if (path[0] === 'news') {
    const base = `/preview/${club.slug}`
    if (path.length === 2) {
      const post = await loadNewsPost(club.tenantID, path[1])
      if (!post) notFound()
      return (
        <ClubShell club={club} currentPath={`${base}/news`}>
          <NewsPost post={post} base={base} />
        </ClubShell>
      )
    }
    const query = await searchParams
    const one = (v: string | string[] | undefined) => (typeof v === 'string' ? v : null)
    const archive = await newsArchive(club.tenantID, {
      category: one(query.category),
      q: one(query.q),
      page: Number.parseInt(one(query.page) ?? '1', 10) || 1,
    })
    return (
      <ClubShell club={club} currentPath={`${base}/news`}>
        <NewsArchive archive={archive} base={base} />
      </ClubShell>
    )
  }

  if (path[0] === 'home') redirect(`/preview/${club.slug}`)
  const page = await loadClubPage(club.tenantID, path[0])
  if (!page) notFound()
  const base = `/preview/${club.slug}`
  const startsWithHero = page.layout[0]?.blockType === 'hero'

  return (
    <ClubShell
      club={club}
      currentPath={`${base}/${page.slug}`}
      overHero={page.layout[0] ? heroIsFullBleed(page.layout[0]) : false}
    >
      {startsWithHero ? null : (
        <section className="pv-section">
          <h1 className="t-display-l">{page.title}</h1>
        </section>
      )}
      <RenderBlocks
        layout={page.layout}
        ctx={page.ctx}
        club={club}
        base={base}
        pageUpdatedAt={page.updatedAt}
      />
    </ClubShell>
  )
}
