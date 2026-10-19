import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { loadClubBySlug } from '@/site/loadClub'
import { siteBase, sitePreviewEnabled } from '@/site/preview'
import { loadSearch, readFilters } from '@/site/search/load'
import { SearchResults } from '@/site/search/SearchResults'

import { ClubShell } from '../ClubShell'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ club: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  if (!sitePreviewEnabled()) return {}
  const club = await loadClubBySlug((await params).club)
  if (!club) return {}
  const { q } = readFilters(await searchParams)
  // Results pages are never worth indexing (they change and can be made up endlessly).
  return {
    title: q ? `Search: ${q} | ${club.name}` : `Search | ${club.name}`,
    robots: { index: false, follow: true },
  }
}

/** The club's search results, at /search?q=… (src/site/search). */
export default async function ClubSearch({ params, searchParams }: Props) {
  if (!sitePreviewEnabled()) notFound()
  const club = await loadClubBySlug((await params).club)
  if (!club) notFound()
  const base = siteBase(club.slug)
  const view = await loadSearch(club.tenantID, readFilters(await searchParams))
  return (
    <ClubShell club={club} currentPath={`${base}/search`}>
      <SearchResults club={club} base={base} view={view} />
    </ClubShell>
  )
}
