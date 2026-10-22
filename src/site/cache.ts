import { revalidateTag, unstable_cache } from 'next/cache'

/**
 * Caching the public club sites' data (job 5, 21 Oct grilling; decisions.md, 22 Oct).
 *
 * The page itself is still made for every view: each one needs a fresh one-time code for the
 * content security policy (src/proxy.ts). What's cached is the data behind it, in Next.js's data
 * cache, which every server shares.
 *
 * **Caching is a new way for one club's data to reach another, so the rules are strict:**
 * - Every cached loader takes the club's ID first (`clubCached`). The ID starts every cache key
 *   and tags every entry, and a call without a real club ID throws.
 * - The only exceptions find a club from its address (`addressCached`: slug or web address to
 *   club). Their key is the address, and they return just the club's ID.
 * - Drafts and the live preview never go through the cache: callers only use cached loaders for
 *   what anonymous visitors see.
 * - Anything that depends on today's date (upcoming events, news publish dates, notices, course
 *   status "stale") is kept at most 5 minutes.
 * - Publishing, changing or deleting anything of a club clears that club's tag, and only that
 *   club's (src/site/cacheHooks.ts). Changing a club's addresses clears the address lookups.
 * - Nothing is kept longer than an hour (address lookups 5 minutes), because changes made
 *   outside the website (scripts, restoring a backup) can't clear the cache.
 *
 * tests/unit/site-cache.spec.ts and the "cached data" tests in the isolation suite check this.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** The tag on everything cached for one club. */
export const clubTag = (tenantID: string) => `club:${tenantID}`
/** The tag on the address lookups (slug or web address to club). */
export const ADDRESSES_TAG = 'club-addresses'

/** At most 5 minutes for anything that depends on today's date, and for address lookups. */
export const TODAY_SECONDS = 300
/**
 * At most an hour for everything else. Saves through the website clear a club's cache at once;
 * this limit is for changes made around it (scripts, or restoring a backup), which can't.
 */
export const LONGEST_SECONDS = 60 * 60

type Options = { tags: string[]; revalidate: number | false }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => Promise<unknown>

/** The cache underneath: Next.js's data cache in the app; replaceable in tests. */
export type CacheStore = {
  wrap: <F extends AnyFn>(fn: F, key: string[], options: Options) => F
  clear: (tag: string) => void
}

const nextStore: CacheStore = {
  wrap: (fn, key, options) => unstable_cache(fn, key, options) as never,
  clear: (tag) => revalidateTag(tag, { expire: 0 }),
}

/** Outside a Next.js server (scripts, integration tests) there is no data cache: call through. */
const passThrough: CacheStore = { wrap: (fn) => fn, clear: () => {} }

let store: CacheStore | null = null
/** SITE_DATA_CACHE=off switches the cache off (an emergency switch; also used to measure). */
const current = () =>
  store ??
  (process.env.NEXT_RUNTIME && process.env.SITE_DATA_CACHE !== 'off' ? nextStore : passThrough)

/** For tests only: use an in-memory cache instead (null puts back the default). */
export const useCacheStoreForTests = (replacement: CacheStore | null) => {
  store = replacement
}

/** Every cached loader, for the tests that check them. */
export const CACHED_LOADERS: { name: string; keyedBy: 'club' | 'address' }[] = []

/**
 * A loader cached per club. Its first argument must be the club's ID. `today: true` keeps
 * results at most 5 minutes.
 */
export const clubCached = <A extends unknown[], R>(
  name: string,
  fn: (tenantID: string, ...rest: A) => Promise<R>,
  { today = false }: { today?: boolean } = {},
): ((tenantID: string, ...rest: A) => Promise<R>) => {
  CACHED_LOADERS.push({ name, keyedBy: 'club' })
  return async (tenantID, ...rest) => {
    if (typeof tenantID !== 'string' || !UUID.test(tenantID)) {
      throw new Error(`${name}: cached club data needs the club's ID first`)
    }
    // Wrapped per call so the club's tag is on the entry; the key holds the name and club ID,
    // and Next.js adds the arguments.
    const cached = current().wrap(fn as unknown as AnyFn, [name, tenantID], {
      tags: [clubTag(tenantID)],
      revalidate: today ? TODAY_SECONDS : LONGEST_SECONDS,
    }) as unknown as (tenantID: string, ...rest: A) => Promise<R>
    return cached(tenantID, ...rest)
  }
}

/** Finding a club from its address (slug or web address): small results about that club only. */
export const addressCached = <R>(
  name: string,
  fn: (address: string) => Promise<R>,
): ((address: string) => Promise<R>) => {
  CACHED_LOADERS.push({ name, keyedBy: 'address' })
  return (address) => {
    const cached = current().wrap(fn as unknown as AnyFn, [name, address], {
      tags: [ADDRESSES_TAG],
      revalidate: TODAY_SECONDS,
    }) as unknown as (address: string) => Promise<R>
    return cached(address)
  }
}

/**
 * Clears cached data. Called from save hooks, which can also run outside a request (scripts,
 * the demo club build, tests); there's nothing to clear there.
 */
export const clearCache = (tag: string) => {
  try {
    current().clear(tag)
  } catch {
    // Outside a request: no data cache to clear.
  }
}
