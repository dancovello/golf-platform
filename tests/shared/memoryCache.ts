import type { CacheStore } from '@/site/cache'

/**
 * An in-memory stand-in for Next.js's data cache, with the same rules: an entry is keyed by its
 * key parts and arguments, carries tags, and expires after `revalidate` seconds (by the clock,
 * so tests can move time on with vi.setSystemTime). Clearing a tag removes every entry with it.
 */
export const memoryCache = () => {
  const entries = new Map<string, { value: unknown; tags: string[]; expires: number }>()
  const calls: string[] = []
  const store: CacheStore = {
    wrap: (fn, key, { tags, revalidate }) =>
      (async (...args: unknown[]) => {
        const id = JSON.stringify([key, args])
        const hit = entries.get(id)
        if (hit && Date.now() < hit.expires) return structuredClone(hit.value)
        calls.push(key[0]!)
        const value = await (fn as (...a: unknown[]) => Promise<unknown>)(...args)
        // Next.js stores results as JSON: anything that doesn't survive that isn't cacheable.
        const stored = JSON.parse(JSON.stringify(value ?? null))
        entries.set(id, {
          value: stored,
          tags,
          expires: revalidate === false ? Infinity : Date.now() + revalidate * 1000,
        })
        return structuredClone(stored)
      }) as never,
    clear: (tag) => {
      for (const [id, entry] of entries) if (entry.tags.includes(tag)) entries.delete(id)
    },
  }
  return {
    store,
    /** Which loaders actually ran (cache misses), in order. */
    calls,
    /** The cache keys currently held, with their tags. */
    keys: () => [...entries].map(([id, e]) => ({ id, tags: e.tags })),
    reset: () => {
      entries.clear()
      calls.length = 0
    },
  }
}
