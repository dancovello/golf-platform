import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ExpiredDemo } from '@/site/components/DemoBar'
import { siteFromDemo } from '@/site/resolveSite'
import { SearchView, searchMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ club: string }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const site = await siteFromDemo((await params).club)
  return site && site !== 'expired' ? searchMetadata(site, await searchParams) : {}
}

/** The club's search results on a prospect demo, at /search?q=… */
export default async function ClubDemoSearch({ params, searchParams }: Props) {
  const site = await siteFromDemo((await params).club)
  if (site === 'expired') return <ExpiredDemo />
  if (!site) notFound()
  return <SearchView site={site} query={await searchParams} />
}
