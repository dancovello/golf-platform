import config from '@payload-config'
import { getPayload } from 'payload'

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
