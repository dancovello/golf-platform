import type { LivePreviewConfig, PayloadRequest } from 'payload'

import { siteBase } from './preview'
import { idOf } from '@/blocks/types'

/** The address the admin's live preview panel loads: the club's page with `?live=1`, which
 * shows the latest draft to the club's own editors (src/app/(frontend)/preview/...). */
const previewURL = async (req: PayloadRequest, tenant: unknown, path: string) => {
  const tenantID = idOf(tenant)
  if (!tenantID) return null
  const club = await req.payload
    .findByID({ collection: 'tenants', id: tenantID, depth: 0, overrideAccess: true, req })
    .catch(() => null)
  if (!club?.slug) return null
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto =
    req.headers.get('x-forwarded-proto') ?? (host?.startsWith('localhost') ? 'http' : 'https')
  const join = path.includes('?') ? '&' : '?'
  return `${proto}://${host}${siteBase(club.slug)}${path}${join}live=1`
}

const pageURL = (req: PayloadRequest, tenant: unknown, slug: string | null) =>
  previewURL(req, tenant, slug && slug !== 'home' ? `/${encodeURIComponent(slug)}` : '')

// The sizes match the picture check (tests/visual/pages.ts).
const breakpoints = [
  { name: 'phone', label: 'Phone', width: 375, height: 812 },
  { name: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { name: 'desktop', label: 'Desktop', width: 1366, height: 900 },
]

/** Club Settings (plan part E): the club's home page, reloaded each time the settings are
 * saved. Settings have no drafts, so a save is live on the site straight away; the preview
 * shows what visitors now see (Dan chose refresh-on-save over drafts, 2026-10-20). */
export const clubSettingsLivePreview: LivePreviewConfig = {
  breakpoints,
  url: ({ data, req }) => pageURL(req, data?.tenant, null),
}

/** Pages: the page being edited, as you type (pages autosave drafts). */
export const pageLivePreview: LivePreviewConfig = {
  breakpoints,
  url: ({ data, req }) => pageURL(req, data?.tenant, data?.slug ?? null),
}

/** News (plan part E): the article as visitors will see it, drafts included for the club's own
 * editors. Reloads on save. Needs the article's address, so only once it has been saved. */
export const newsLivePreview: LivePreviewConfig = {
  breakpoints,
  url: ({ data, req }) =>
    typeof data?.slug === 'string' && data.slug
      ? previewURL(req, data?.tenant, `/news/${encodeURIComponent(data.slug)}`)
      : null,
}

/** Events (plan part E): events have no page of their own, so the Events page, with this
 * event shown even before it's published. Reloads on save. Only once it has been saved. */
export const eventLivePreview: LivePreviewConfig = {
  breakpoints,
  url: ({ data, req }) =>
    data?.id
      ? previewURL(req, data?.tenant, `/events?event=${encodeURIComponent(String(data.id))}`)
      : null,
}
