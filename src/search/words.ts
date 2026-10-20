// No server-only imports: the header search panel (browser) uses these too.

/** Longer searches are cut to this (a search is a few words, never a paragraph). */
export const MAX_QUERY = 100
/** Searches start at two characters (spec §3). */
export const MIN_QUERY = 2

/** A visitor's words, tidied: lower case, letters and numbers only, at most eight words. */
export const searchWords = (q: string): string[] =>
  (
    q
      .slice(0, MAX_QUERY)
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  ).slice(0, 8)

export const tidyQuery = (q: unknown): string =>
  typeof q === 'string' ? q.replace(/\s+/g, ' ').trim().slice(0, MAX_QUERY) : ''

/**
 * Finds words in some text that start like one of the searched words ("memb" → "Membership").
 * Longer words lose their last two letters, so "buggy" finds "buggies" and "juniors" "junior".
 */
export const wordMatcher = (words: string[], flags = 'iu') => {
  const stems = words
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ''))
    .filter(Boolean)
    .map((w) => (w.length > 4 ? w.slice(0, -2) : w))
  if (stems.length === 0) return new RegExp('(?!)', flags)
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${stems.join('|')})[\\p{L}\\p{N}]*`, flags)
}

/**
 * A page's summary: the line of its text with the most searched words (pages have no summary
 * of their own), cut to about 160 characters around the first one.
 */
export const passage = (body: string | null, words: string[]): string | null => {
  if (!body || words.length === 0) return null
  const one = wordMatcher(words)
  const all = wordMatcher(words, 'giu')
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  let best: string | null = null
  let bestScore = 0
  for (const line of lines) {
    const hits = line.match(all)?.length ?? 0
    // More matches first; then prefer a sentence over a short heading.
    const score = hits * 1000 + Math.min(line.length, 120)
    if (hits > 0 && score > bestScore) {
      best = line
      bestScore = score
    }
  }
  if (!best) return null
  if (best.length <= 170) return best
  const at = Math.max(best.search(one), 0)
  let start = Math.max(0, at - 50)
  if (start > 0) start = best.indexOf(' ', start) + 1 || start
  let end = Math.min(best.length, start + 160)
  if (end < best.length) end = best.lastIndexOf(' ', end) > start ? best.lastIndexOf(' ', end) : end
  return `${start > 0 ? '… ' : ''}${best.slice(start, end).trim()}${end < best.length ? ' …' : ''}`
}
