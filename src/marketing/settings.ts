import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

/** The marketing settings, once per request. */
export const marketingSettings = cache(async () => {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'marketing-settings', depth: 1, overrideAccess: true })
})

/** "£149" from the settings' monthly price. */
export const formatPrice = (pounds: number) =>
  `£${Number.isInteger(pounds) ? pounds : pounds.toFixed(2)}`
