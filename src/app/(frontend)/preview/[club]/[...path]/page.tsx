import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteFromPreview } from '@/site/resolveSite'
import { PathView, pathMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ club: string; path: string[] }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const { club, path } = await params
  const site = await siteFromPreview(club, (await searchParams).live)
  return site ? pathMetadata(site, path) : {}
}

/** One of a club's pages on the staging preview (and in the admin's live preview). */
export default async function ClubPreviewPage({ params, searchParams }: Props) {
  const { club, path } = await params
  const query = await searchParams
  const site = await siteFromPreview(club, query.live)
  if (!site) notFound()
  return <PathView site={site} path={path} query={query} />
}
