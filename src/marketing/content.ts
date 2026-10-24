import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

import type { MarketingPage } from '@/payload-types'

import { HOME_SLUG } from './collections/MarketingPages'

/**
 * Reads the published marketing page at an address ([] is the home page), or null. Runs on
 * the server with access rules bypassed (the collection is super-admin only) and so asks for
 * published versions only: drafts never reach visitors.
 */
export const publishedMarketingPage = async (path: string[]): Promise<MarketingPage | null> => {
  if (path.length > 1) return null
  const slug = path[0] ?? HOME_SLUG
  // "/home" isn't an address: the home page is "/".
  if (path[0] === HOME_SLUG) return null
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'marketing-pages',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    draft: false,
    overrideAccess: true,
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
}

/**
 * The latest version of a marketing page, drafts included, for the admin's live preview only
 * (src/app/(marketing)/marketing/dev/preview). The caller checks the super-admin first.
 */
export const latestMarketingPage = async (path: string[]): Promise<MarketingPage | null> => {
  if (path.length > 1 || path[0] === HOME_SLUG) return null
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'marketing-pages',
    where: { slug: { equals: path[0] ?? HOME_SLUG } },
    draft: true,
    overrideAccess: true,
    depth: 1,
    limit: 1,
  })
  return docs[0] ?? null
}

/**
 * The addresses of every published marketing page ("home" for the home page), once per visit.
 * The nav and footer only link to these, so a page that's built but not published (Trust,
 * the legal pages) never leads to "page not found".
 */
export const publishedMarketingSlugs = cache(async (): Promise<Set<string>> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'marketing-pages',
    where: { _status: { equals: 'published' } },
    draft: false,
    overrideAccess: true,
    depth: 0,
    limit: 200,
    pagination: false,
    select: { slug: true },
  })
  return new Set(docs.map((doc) => doc.slug))
})
