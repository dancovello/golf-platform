import { headers } from 'next/headers'

import { siteFromPreview } from '@/site/resolveSite'
import { NotFoundView, PlainNotFound } from '@/site/routes/views'

/**
 * A missing page on a club's staging preview: the club's own header, footer and links (the
 * address comes from src/proxy.ts). If the club doesn't exist, or previews are off, a plain
 * message that says nothing about which clubs exist.
 */
export default async function ClubPreviewNotFound() {
  const path = (await headers()).get('x-pathname') ?? ''
  const slug = /^\/preview\/([a-z0-9-]+)/.exec(path)?.[1]
  const site = slug ? await siteFromPreview(slug, null) : null
  return site ? <NotFoundView site={site} path={path} /> : <PlainNotFound />
}
