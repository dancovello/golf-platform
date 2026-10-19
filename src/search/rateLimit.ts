/**
 * A cap on how many searches one visitor can run a minute (doc 04: rate limiting on every
 * public endpoint, including search). Typing in the header panel searches as you pause, so
 * the cap is generous for people and only stops scripts hammering the site.
 *
 * Kept in the server's memory, so each Vercel instance counts on its own: a first line, not the
 * whole defence. A Cloudflare rate-limiting rule in front of the site is the second, once clubs
 * are on their own domains (build step 4).
 */

export const SEARCHES_PER_MINUTE = 120
const WINDOW_MS = 60_000
/** Visitors remembered at most; the oldest are forgotten first. */
const MAX_VISITORS = 10_000

const recent = new Map<string, number[]>()

/** Whether this visitor may search now (and counts the search if so). */
export const allowSearch = (visitor: string, now = Date.now()): boolean => {
  const since = now - WINDOW_MS
  const times = (recent.get(visitor) ?? []).filter((t) => t > since)
  if (times.length >= SEARCHES_PER_MINUTE) {
    recent.set(visitor, times)
    return false
  }
  times.push(now)
  // Re-inserted so the Map keeps visitors in order of their latest search.
  recent.delete(visitor)
  recent.set(visitor, times)
  while (recent.size > MAX_VISITORS) {
    const oldest = recent.keys().next().value
    if (oldest === undefined) break
    recent.delete(oldest)
  }
  return true
}

/** Who is searching: the address Vercel (or later Cloudflare) saw the request come from. */
export const visitorKey = (headers: Headers): string =>
  headers.get('cf-connecting-ip')?.trim() ||
  headers.get('x-real-ip')?.trim() ||
  headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
  'unknown'

/** For tests. */
export const forgetSearchVisitors = () => recent.clear()
