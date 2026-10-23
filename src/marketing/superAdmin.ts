import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import { isSuperAdminWithCode } from '@/auth/fullyAuthenticated'

/** True only for the super-admin, signed in with their two-factor code entered. */
export const isSignedInSuperAdmin = async (): Promise<boolean> => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  return isSuperAdminWithCode(user)
}
