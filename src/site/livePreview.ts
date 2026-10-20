import type { LivePreviewConfig, PayloadRequest } from 'payload'

import { siteBase } from './preview'
import { idOf } from '@/blocks/types'

/** The address the admin's live preview panel loads: the club's page with `?live=1`, which
 * shows the latest draft to the club's own editors (src/app/(frontend)/preview/...). */
const pageURL = async (req: PayloadRequest, tenant: unknown, slug: string | null) => {
  const tenantID = idOf(tenant)
  if (!tenantID) return null
  const club = await req.payload
    .findByID({ collection: 'tenants', id: tenantID, depth: 0, req })
    .catch(() => null)
  if (!club?.slug) return null
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto =
    req.headers.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const path = slug && slug !== 'home' ? `/${slug}` : ''
  return `${proto}://${host}${siteBase(club.slug)}${path}?live=1`
}

// The sizes match the picture check (tests/visual/pages.ts).
const breakpoints = [
  { name: 'phone', label: 'Phone', width: 375, height: 812 },
  { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { name: 'desktop', label: 'Desktop', width: 1366, height: 900 },
]

/** Pages: the page being edited, as you type (pages autosave drafts). */
export const pageLivePreview: LivePreviewConfig = {
  breakpoints,
  url: ({ data, req }) => pageURL(req, data?.tenant, data?.slug ?? null),
}
