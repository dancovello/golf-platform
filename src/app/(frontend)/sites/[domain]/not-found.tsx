import { headers } from 'next/headers'

import { CLUB_HOST_HEADER, siteFromDomain } from '@/site/resolveSite'
import { NotFoundView, PlainNotFound } from '@/site/routes/views'

/**
 * A missing page on a club's own domain: the club's header, footer and links. An address no
 * club has gets a plain message that says nothing about which clubs exist.
 */
export default async function ClubNotFound() {
  const h = await headers()
  const host = h.get(CLUB_HOST_HEADER)
  const site = host ? await siteFromDomain(host) : null
  return site ? <NotFoundView site={site} path={h.get('x-pathname') ?? '/'} /> : <PlainNotFound />
}
