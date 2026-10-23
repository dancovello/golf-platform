import { cache } from 'react'

/**
 * Database timing for club pages, on staging and previews only, never production
 * (docs/operations/performance.md).
 *
 * Each club page view logs one line after it has been sent, e.g.
 * `[db-timing] /preview/heathcote-demo/news queries=7 db_ms=41 total_ms=180`.
 * Next.js pages can't set response headers, so this goes to the server log (Vercel → Logs)
 * rather than a Server-Timing header.
 */

type Env = Record<string, string | undefined>

/** On for staging and previews (any Vercel environment except production), and locally with
 * DB_TIMING=1. Never on production, whatever else is set. */
export const dbTimingEnabled = (env: Env = process.env) =>
  env.VERCEL_ENV !== 'production' && (env.VERCEL_ENV !== undefined || env.DB_TIMING === '1')

export type Stats = { queries: number; ms: number; started: number; reported: boolean }

/** One count per page view. Outside a page render React returns a fresh object each time, so
 * queries from anything else (API, jobs) are simply not counted. */
export const requestStats = cache((): Stats => ({
  queries: 0,
  ms: 0,
  started: performance.now(),
  reported: false,
}))

type Query = (...args: unknown[]) => unknown
type Client = { query: Query }
export type Pool = Client & { connect: (...args: unknown[]) => unknown }

const wrapped = new WeakSet<object>()

/** Counts a query and adds its time to the page view it was made for. */
const timed = (query: Query, self: unknown, getStats: () => Stats): Query =>
  function (...args) {
    const stats = getStats()
    const start = performance.now()
    stats.queries += 1
    const result = query.apply(self, args)
    if (result instanceof Promise) {
      const done = () => {
        stats.ms += performance.now() - start
      }
      // A second listener only: the caller still gets the original result or error.
      result.then(done, done)
    }
    return result
  }

const wrapClient = (client: Client, getStats: () => Stats) => {
  if (wrapped.has(client)) return
  wrapped.add(client)
  client.query = timed(client.query, client, getStats)
}

/** Reads (pool.query) and transactions (a client from pool.connect) are both counted. */
export const instrumentPool = (pool: Pool, getStats: () => Stats = requestStats) => {
  if (wrapped.has(pool)) return
  wrapped.add(pool)
  pool.query = timed(pool.query, pool, getStats)
  const connect = pool.connect.bind(pool)
  pool.connect = (...args: unknown[]) => {
    const result = connect(...args)
    if (result instanceof Promise) {
      return result.then((client: Client) => {
        wrapClient(client, getStats)
        return client
      })
    }
    return result
  }
}
