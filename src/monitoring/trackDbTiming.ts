import config from '@payload-config'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { getPayload } from 'payload'

import { dbTimingEnabled, instrumentPool, type Pool, requestStats } from './dbTiming'

/**
 * Starts counting for this page view and logs the totals once it has been sent. Called where
 * every club page starts (src/site/resolveSite.ts); safe to call more than once per view.
 */
export const trackDbTiming = async () => {
  if (!dbTimingEnabled()) return
  const payload = await getPayload({ config })
  const pool = (payload.db as unknown as { pool?: Pool }).pool
  if (!pool) return
  instrumentPool(pool)
  const stats = requestStats()
  if (stats.reported) return
  stats.reported = true
  // The address as the visitor asked for it, without the query string (search words stay out
  // of the log).
  const path = (await headers()).get('x-pathname') ?? '?'
  after(() => {
    console.info(
      `[db-timing] ${path} queries=${stats.queries} db_ms=${Math.round(stats.ms)} total_ms=${Math.round(performance.now() - stats.started)}`,
    )
  })
}
