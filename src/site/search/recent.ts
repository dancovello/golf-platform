// Recent searches, kept only in this browser (spec §3: "stored on the device only").

const MAX_RECENT = 5
const keyFor = (club: string) => `club-search-recent:${club}`

export type RecentSearch = { q: string; at: number }

export const readRecent = (club: string): RecentSearch[] => {
  try {
    const raw = JSON.parse(window.localStorage.getItem(keyFor(club)) ?? '[]')
    return Array.isArray(raw)
      ? raw
          .filter((r): r is RecentSearch => typeof r?.q === 'string' && typeof r?.at === 'number')
          .slice(0, MAX_RECENT)
      : []
  } catch {
    return []
  }
}

const write = (club: string, list: RecentSearch[]) => {
  try {
    if (list.length === 0) window.localStorage.removeItem(keyFor(club))
    else window.localStorage.setItem(keyFor(club), JSON.stringify(list.slice(0, MAX_RECENT)))
  } catch {
    // Private browsing or storage turned off: recent searches simply aren't kept.
  }
}

export const rememberSearch = (club: string, q: string) => {
  const query = q.trim().slice(0, 100)
  if (query.length < 2) return
  const others = readRecent(club).filter((r) => r.q.toLowerCase() !== query.toLowerCase())
  write(club, [{ q: query, at: Date.now() }, ...others])
}

export const forgetSearch = (club: string, q: string) =>
  write(
    club,
    readRecent(club).filter((r) => r.q !== q),
  )

export const clearRecent = (club: string) => write(club, [])

/** "Searched today", "Searched yesterday", "Searched on Tuesday", "Last week", "Earlier". */
export const whenSearched = (at: number, now = Date.now()) => {
  const day = (t: number) => Math.floor((t - new Date(t).getTimezoneOffset() * 60_000) / 86_400_000)
  const days = day(now) - day(at)
  if (days <= 0) return 'Searched today'
  if (days === 1) return 'Searched yesterday'
  if (days < 7)
    return `Searched on ${new Date(at).toLocaleDateString('en-GB', { weekday: 'long' })}`
  if (days < 14) return 'Last week'
  return 'Earlier'
}
