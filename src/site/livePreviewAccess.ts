import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { editorTenantID, isSuperAdmin } from '@/access/roles'
import { isFullyAuthenticated } from '@/auth/fullyAuthenticated'

/**
 * Whose drafts this request may see in the live preview (`?live=1`): every club's (a
 * super-admin), one club's (that club's editor), or none. Signed in with their code entered
 * where they need one. Without `?live=1`, none: everyone gets the published page.
 */
export const draftAccess = cache(
  async (live: unknown): Promise<'every club' | { tenantID: string } | null> => {
    if (live !== '1') return null
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: await headers() })
    if (!isFullyAuthenticated(user)) return null
    if (isSuperAdmin(user)) return 'every club'
    const tenantID = editorTenantID(user)
    return tenantID ? { tenantID } : null
  },
)

/**
 * Whether this request may see a club's drafts: only inside the live preview (`?live=1`),
 * and only for a super-admin or that club's own editor, signed in with their code entered.
 * Everyone else gets the published page, even with `?live=1` in the address.
 */
export const canSeeDrafts = async (tenantID: string, live: unknown): Promise<boolean> => {
  const access = await draftAccess(live)
  return access === 'every club' || (access !== null && access.tenantID === tenantID)
}
