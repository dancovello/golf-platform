import type { ReactNode } from 'react'

import { DemoBar } from '@/site/components/DemoBar'
import { siteFromDemo } from '@/site/resolveSite'

/** Adds the "Demo - expires in … days" strip under every page of a prospect demo. */
export default async function DemoLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ club: string }>
}) {
  const site = await siteFromDemo((await params).club)
  if (!site || site === 'expired' || !site.demo) return children
  return (
    <>
      <div className="demo-room">{children}</div>
      <DemoBar expiresAt={site.demo.expiresAt} />
    </>
  )
}
