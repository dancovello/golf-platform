import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ExpiredDemo } from '@/site/components/DemoBar'
import { siteFromDemo } from '@/site/resolveSite'
import { HomeView, homeMetadata, type Query } from '@/site/routes/views'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ club: string }>; searchParams: Promise<Query> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const site = await siteFromDemo((await params).club)
  return site && site !== 'expired' ? homeMetadata(site) : {}
}

/** A club's home on a prospect demo (src/site/demo.ts). */
export default async function ClubDemoHome({ params, searchParams }: Props) {
  const site = await siteFromDemo((await params).club)
  if (site === 'expired') return <ExpiredDemo />
  if (!site) notFound()
  return <HomeView site={site} query={await searchParams} />
}
