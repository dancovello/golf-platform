import { notFound } from 'next/navigation'

import { loadClubBySlug, loadClubPage } from '@/site/loadClub'
import { sitePreviewEnabled } from '@/site/preview'

import { ClubShell } from '../ClubShell'

export const dynamic = 'force-dynamic'

/** One of the club's pages on staging. Blocks arrive from step 5.3; for now, the title. */
export default async function ClubPagePreview({
  params,
}: {
  params: Promise<{ club: string; path: string[] }>
}) {
  if (!sitePreviewEnabled()) notFound()
  const { club: clubSlug, path } = await params
  if (path.length !== 1) notFound()
  const club = await loadClubBySlug(clubSlug)
  if (!club) notFound()
  const page = await loadClubPage(club.tenantID, path[0])
  if (!page) notFound()

  return (
    <ClubShell club={club} currentPath={`/preview/${club.slug}/${page.slug}`}>
      <section className="pv-section">
        <h1 className="t-display-l">{page.title}</h1>
      </section>
    </ClubShell>
  )
}
