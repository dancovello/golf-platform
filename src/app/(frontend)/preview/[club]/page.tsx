import { notFound } from 'next/navigation'

import { heroIsFullBleed } from '@/site/blocks/Hero'
import { RenderBlocks } from '@/site/blocks/RenderBlocks'
import { LiveRefresh } from '@/site/components/LiveRefresh'
import { canSeeDrafts } from '@/site/livePreviewAccess'
import { loadClubBySlug, loadClubPage } from '@/site/loadClub'
import { siteBase, sitePreviewEnabled } from '@/site/preview'

import { ClubShell } from './ClubShell'

export const dynamic = 'force-dynamic'

/** The club's home on staging: its "home" page, or until it has one, a plain holding page
 * with the club's name (the header and footer still show its menu and contact details). */
export default async function ClubPreview({
  params,
  searchParams,
}: {
  params: Promise<{ club: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  if (!sitePreviewEnabled()) notFound()
  const club = await loadClubBySlug((await params).club)
  if (!club) notFound()
  const base = siteBase(club.slug)

  const live = (await searchParams).live === '1'
  const draft = await canSeeDrafts(club.tenantID, live ? '1' : null)
  const home = await loadClubPage(club.tenantID, 'home', { draft })
  if (home) {
    return (
      <>
        {live ? <LiveRefresh /> : null}
        <ClubShell
          club={club}
          currentPath={base}
          overHero={home.layout[0] ? heroIsFullBleed(home.layout[0]) : false}
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
    <ClubShell club={club} currentPath={base}>
      {live ? <LiveRefresh /> : null}
      <section className="pv-section">
        <h1 className="t-display-l">{club.name}</h1>
        <p className="t-body-l pv-muted">Our new website is on its way.</p>
      </section>
    </ClubShell>
  )
}
