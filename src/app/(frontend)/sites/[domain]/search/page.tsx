import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteFromDomain } from '@/site/resolveSite'
import { forwardToMainAddress, SearchView, searchMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ domain: string }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params, searchParams }: Props): Promise<Metadata> => {
  const site = await siteFromDomain((await params).domain)
  return site ? searchMetadata(site, await searchParams) : {}
}

/** The club's search results on its own domain, at /search?q=… */
export default async function ClubSearch({ params, searchParams }: Props) {
  const site = await siteFromDomain((await params).domain)
  if (!site) notFound()
  await forwardToMainAddress(site)
  return <SearchView site={site} query={await searchParams} />
}
