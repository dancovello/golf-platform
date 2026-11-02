import { headers } from 'next/headers'

import { ExpiredDemo } from '@/site/components/DemoBar'
import { siteFromDemo } from '@/site/resolveSite'
import { NotFoundView, PlainNotFound } from '@/site/routes/views'

/**
 * A missing page on a prospect demo: the club's own header, footer and links. If the link isn't
 * a live demo, a plain message that says nothing about which clubs exist.
 */
export default async function ClubDemoNotFound() {
  const path = (await headers()).get('x-pathname') ?? ''
  const address = /^\/demo\/([a-z0-9-]+)/.exec(path)?.[1]
  const site = address ? await siteFromDemo(address) : null
  if (site === 'expired') return <ExpiredDemo />
  return site ? <NotFoundView site={site} path={path} /> : <PlainNotFound />
}
