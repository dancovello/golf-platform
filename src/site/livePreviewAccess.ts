import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { editorTenantID, isSuperAdmin } from '@/access/roles'
import { isFullyAuthenticated } from '@/auth/fullyAuthenticated'

/**
 * Whether this request may see a club's drafts: only inside the live preview (`?live=1`),
 * and only for a super-admin or that club's own editor, signed in with their code entered.
 * Everyone else gets the published page, even with `?live=1` in the address.
 */
export const canSeeDrafts = async (tenantID: string, live: unknown): Promise<boolean> => {
  if (live !== '1') return false
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  if (!isFullyAuthenticated(user)) return false
  return isSuperAdmin(user) || editorTenantID(user) === tenantID
}
