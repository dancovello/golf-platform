import { notFound, redirect } from 'next/navigation'

import { heroIsFullBleed } from '@/site/blocks/Hero'
import { RenderBlocks } from '@/site/blocks/RenderBlocks'
import { loadClubBySlug, loadClubPage } from '@/site/loadClub'
import { sitePreviewEnabled } from '@/site/preview'

import { ClubShell } from '../ClubShell'

export const dynamic = 'force-dynamic'

/** One of the club's pages on staging: its blocks, with the title as a heading unless the
 * page starts with a hero (which has its own headline). */
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
      <RenderBlocks layout={page.layout} ctx={page.ctx} club={club} base={base} />
    </ClubShell>
  )
}
