import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteFromPreview } from '@/site/resolveSite'
import { HomeView, homeMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ club: string }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const site = await siteFromPreview((await params).club, (await searchParams).live)
  return site ? homeMetadata(site) : {}
}

/** A club's home on the staging preview (and in the admin's live preview). */
export default async function ClubPreviewHome({ params, searchParams }: Props) {
  const query = await searchParams
  const site = await siteFromPreview((await params).club, query.live)
  if (!site) notFound()
  return <HomeView site={site} query={query} />
}
