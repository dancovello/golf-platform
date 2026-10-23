/**
 * The addresses the admin is reached from. Payload then accepts the login cookie only on
 * requests from one of them, so another website can't make a signed-in request on an editor's
 * behalf (sign-in audit, finding A5). Before, the cookie's SameSite=Lax setting was the only
 * guard.
 *
 * - ADMIN_URL: the admin's own address (staging and production set it).
 * - On Vercel: this deployment's own addresses (pull-request previews and staging have their
 *   own), and the production .vercel.app address.
 * - Off Vercel (local work and the browser tests): localhost.
 *
 * When the platform gets its own domain, ADMIN_URL changes with it, and so does this list.
 */
const originOf = (value: string | undefined, scheme = 'https://') => {
  const v = value?.trim()
  if (!v) return null
  try {
    return new URL(v.includes('://') ? v : `${scheme}${v}`).origin
  } catch {
    return null
  }
}

export const trustedOrigins = (env: Record<string, string | undefined> = process.env): string[] => {
  const list = [
    originOf(env.ADMIN_URL),
    originOf(env.VERCEL_URL),
    originOf(env.VERCEL_BRANCH_URL),
    originOf(env.VERCEL_PROJECT_PRODUCTION_URL),
  ]
  if (!env.VERCEL) {
    for (const port of new Set(['3000', '3100', env.PORT].filter(Boolean))) {
      list.push(`http://localhost:${port}`)
    }
  }
  return [...new Set(list.filter((o): o is string => Boolean(o)))]
}
