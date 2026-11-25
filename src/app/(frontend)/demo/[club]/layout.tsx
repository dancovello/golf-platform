import type { ReactNode } from 'react'

import { DemoBar } from '@/site/components/DemoBar'
import { DemoVisit } from '@/site/components/DemoVisit'
import { siteFromDemo } from '@/site/resolveSite'

/** Adds the "Demo - expires in … days" strip under every page of a prospect demo, and counts
 * each page opened (src/site/demoVisits.ts). */
export default async function DemoLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ club: string }>
}) {
  const address = (await params).club
  const site = await siteFromDemo(address)
  if (!site || site === 'expired' || !site.demo) return children
  return (
    <>
      <div className="demo-room">{children}</div>
      <DemoBar expiresAt={site.demo.expiresAt} />
      <DemoVisit address={address} />
    </>
  )
}
