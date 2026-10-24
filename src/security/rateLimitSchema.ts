import type { PostgresAdapterArgs } from '@payloadcms/db-postgres'

import { rateLimits } from './rateLimit'

/** Adds the rate-limit table to Payload's database schema (payload.config.ts). A plain table,
 * not a collection: nothing in the admin or the API can reach it. */
export const addRateLimitTable: NonNullable<PostgresAdapterArgs['afterSchemaInit']>[number] = ({
  schema,
}) => ({ ...schema, tables: { ...schema.tables, rate_limits: rateLimits } })
