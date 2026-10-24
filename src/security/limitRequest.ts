import config from '@payload-config'
import { getPayload } from 'payload'

import { allowRequest, type Limit, visitorKey } from './rateLimit'

/** Whether this request is within `limit`, counted in the shared database table
 * (src/security/rateLimit.ts). `visitor: 'all'` counts every visitor together. */
export const withinLimit = async (
  limit: Limit,
  headers: Headers,
  { visitor }: { visitor?: 'all' } = {},
) => {
  const payload = await getPayload({ config })
  const db = (payload.db as unknown as { drizzle: Parameters<typeof allowRequest>[0] }).drizzle
  return allowRequest(db, limit, visitor ?? visitorKey(headers))
}
