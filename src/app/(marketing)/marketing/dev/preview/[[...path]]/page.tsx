import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { latestMarketingPage } from '@/marketing/content'
import { MarketingBlocks } from '@/marketing/site/MarketingBlocks'
import { isSignedInSuperAdmin } from '@/marketing/superAdmin'
import { LiveRefresh } from '@/site/components/LiveRefresh'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { robots: { index: false, follow: false } }

type Props = { params: Promise<{ path?: string[] }> }

/**
 * The admin's live preview of a marketing page: the latest version, drafts included, reloaded
 * as the page autosaves. Only for the signed-in super-admin, on the platform's own address.
 */
export default async function MarketingPreview({ params }: Props) {
  if (!(await isSignedInSuperAdmin())) notFound()
  const page = await latestMarketingPage((await params).path ?? [])
  if (!page) notFound()
  return (
    <main id="main">
      <LiveRefresh />
      <MarketingBlocks blocks={page.layout ?? []} />
    </main>
  )
}
