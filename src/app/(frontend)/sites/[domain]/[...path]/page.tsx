import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteFromDomain } from '@/site/resolveSite'
import { forwardToMainAddress, PathView, pathMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ domain: string; path: string[] }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { domain, path } = await params
  const site = await siteFromDomain(domain)
  return site ? pathMetadata(site, path) : {}
}

/** One of a club's pages on its own domain (src/proxy.ts rewrites the request here). */
export default async function ClubPage({ params, searchParams }: Props) {
  const { domain, path } = await params
  const site = await siteFromDomain(domain)
  if (!site) notFound()
  await forwardToMainAddress(site)
  return <PathView site={site} path={path} query={await searchParams} />
}
