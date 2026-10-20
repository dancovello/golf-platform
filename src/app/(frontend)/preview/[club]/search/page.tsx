import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteFromPreview } from '@/site/resolveSite'
import { SearchView, searchMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ club: string }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const site = await siteFromPreview((await params).club, null)
  return site ? searchMetadata(site, await searchParams) : {}
}

/** The club's search results on the staging preview, at /search?q=… */
export default async function ClubPreviewSearch({ params, searchParams }: Props) {
  const site = await siteFromPreview((await params).club, null)
  if (!site) notFound()
  return <SearchView site={site} query={await searchParams} />
}
