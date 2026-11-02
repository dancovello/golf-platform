import config from '@payload-config'
import { getPayload } from 'payload'

/** Whether a club is currently switched on as a prospect demo (src/site/demo.ts). */
export const isDemoClub = async (tenantID: string | number): Promise<boolean> => {
  const payload = await getPayload({ config })
  const club = await payload.findByID({
    collection: 'tenants',
    id: tenantID,
    depth: 0,
    select: { demoEnabled: true },
    overrideAccess: true,
  })
  return Boolean(club?.demoEnabled)
}
