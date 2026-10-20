import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { siteFromDomain } from '@/site/resolveSite'
import { forwardToMainAddress, HomeView, homeMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ domain: string }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const site = await siteFromDomain((await params).domain)
  return site ? homeMetadata(site) : {}
}

/** A club's home on its own domain (src/proxy.ts rewrites the request here). */
export default async function ClubHome({ params, searchParams }: Props) {
  const site = await siteFromDomain((await params).domain)
  if (!site) notFound()
  await forwardToMainAddress(site)
  return <HomeView site={site} query={await searchParams} />
}
