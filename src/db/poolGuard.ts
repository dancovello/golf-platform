/**
 * Keeps one dropped database connection from taking the whole site instance down.
 *
 * Neon closes connections that sit idle (and when it restarts). The database driver treats that
 * as an "error" on the connection pool, and Node crashes the server instance when an error has
 * nobody listening (Sentry GOLF-PLATFORM-3, 5 Nov 2026). With a listener the pool just discards
 * the dead connection and opens a fresh one the next time it's needed.
 */

type PoolLike = {
  on: (event: 'error', listener: (error: Error) => void) => unknown
}

/** Connection settings that suit a serverless site on Neon. */
export const POOL_SETTINGS = {
  // Let go of idle connections well before Neon does, so a dead one is never handed out.
  idleTimeoutMillis: 10_000,
  // Give up on a connection attempt instead of hanging the visitor's page.
  connectionTimeoutMillis: 10_000,
  // Notice a silently dropped connection sooner.
  keepAlive: true,
  // Each site instance only needs a few. Many instances share one database.
  max: 5,
} as const

export const logPoolError = (error: Error) => {
  // Expected now and then: the pool throws the dead connection away by itself.
  console.warn(`[db] idle database connection dropped and discarded: ${error.message}`)
}

/**
 * Whether the website's database address is Neon's pooled one. On Vercel many site instances
 * share one database; without the pooled address each opens its own connections and a busy
 * moment can use them all up. Returns a sentence when the address is a Neon one that isn't
 * pooled, else null (other databases, local work and anything unparseable stay quiet).
 */
export const unpooledWarning = (connectionString: string | undefined): string | null => {
  try {
    const host = new URL(connectionString ?? '').hostname
    if (!host.endsWith('.neon.tech') || host.includes('-pooler')) return null
    return 'DATABASE_URL is a Neon address without "-pooler": under heavy traffic the site could run out of database connections. Use the pooled address (Neon → Connect → Connection pooling on).'
  } catch {
    return null
  }
}

/** Safe to call twice on the same pool. */
export const guardPool = (pool: PoolLike | undefined, onError = logPoolError) => {
  if (!pool) return false
  const listeners = (pool as unknown as { listenerCount?: (e: string) => number }).listenerCount
  if (listeners && listeners.call(pool, 'error') > 0) return true
  pool.on('error', onError)
  return true
}
