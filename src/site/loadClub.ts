import config from '@payload-config'
import { getPayload } from 'payload'

import { type Brand, BRAND_INPUTS, DEFAULT_BRAND, isHex } from '@/theme/colour'
import { DEFAULT_FONT_SET, type FontSetID, isFontSetID } from '@/theme/fontSets'

export type ClubSite = { tenantID: string; name: string; brand: Brand; fontSet: FontSetID }

/**
 * Reads what the public site needs for one club. Visitors aren't logged in, so access rules
 * can't scope this: every query here filters by the club's own ID explicitly, and returns
 * only the fields the page shows.
 */
export const loadClubBySlug = async (slug: string): Promise<ClubSite | null> => {
  const payload = await getPayload({ config })
  const { docs: tenants } = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    select: { name: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const tenant = tenants[0]
  if (!tenant) return null

  const { docs: settings } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: tenant.id } },
    select: { clubName: true, branding: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const branding = (settings[0]?.branding ?? {}) as Partial<Brand> & { fontSet?: unknown }
  const brand = Object.fromEntries(
    BRAND_INPUTS.map((key) => [key, isHex(branding[key]) ? branding[key] : DEFAULT_BRAND[key]]),
  ) as Brand

  return {
    tenantID: String(tenant.id),
    name: settings[0]?.clubName || tenant.name,
    brand,
    fontSet: isFontSetID(branding.fontSet) ? branding.fontSet : DEFAULT_FONT_SET,
  }
}
