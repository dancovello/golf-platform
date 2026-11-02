import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ExpiredDemo } from '@/site/components/DemoBar'
import { siteFromDemo } from '@/site/resolveSite'
import { PathView, pathMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ club: string; path: string[] }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { club, path } = await params
  const site = await siteFromDemo(club)
  return site && site !== 'expired' ? pathMetadata(site, path) : {}
}

/** One of a club's pages on a prospect demo (src/site/demo.ts). */
export default async function ClubDemoPage({ params, searchParams }: Props) {
  const { club, path } = await params
  const site = await siteFromDemo(club)
  if (site === 'expired') return <ExpiredDemo />
  if (!site) notFound()
  return <PathView site={site} path={path} query={await searchParams} />
}
