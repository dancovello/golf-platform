/** Is today inside a season given by start and end month (1–12)? Seasons may wrap the new
 * year, e.g. November – March. A season without both months is never current. */
export const isCurrentSeason = (
  season: { startMonth?: string | null; endMonth?: string | null },
  today: Date,
): boolean => {
  const start = Number(season.startMonth)
  const end = Number(season.endMonth)
  if (!start || !end) return false
  const m = today.getUTCMonth() + 1
  return start <= end ? m >= start && m <= end : m >= start || m <= end
}

/** A price list with optional dates (G2, 15 Nov 2026). */
export type DatedList = { validFrom?: string | null; validUntil?: string | null }

/** "2027-04-01": the UK calendar day of a stored date, so dates compare as plain text. */
const ukDay = (value: string | Date) =>
  new Date(value).toLocaleDateString('en-CA', { timeZone: 'Europe/London' })

/**
 * Where a price list stands today. Both dates count whole UK days: a list "valid until
 * 31 March" is still current all of 31 March, and one "valid from 1 April" starts that morning.
 */
export const priceListPhase = (list: DatedList, today: Date) => {
  const day = ukDay(today)
  if (list.validUntil && ukDay(list.validUntil) < day) return 'expired' as const
  if (list.validFrom && ukDay(list.validFrom) > day) return 'upcoming' as const
  return 'current' as const
}

/**
 * The price lists to show, in their order: expired lists never; upcoming lists only when the
 * club chose to show them early. If that leaves nothing, the next list to start is shown, so
 * the table is never empty while prices are still to come.
 */
export const visibleLists = <T extends DatedList>(
  lists: T[],
  today: Date,
  showUpcoming: boolean,
): { list: T; upcoming: boolean }[] => {
  const phased = lists.map((list) => ({ list, phase: priceListPhase(list, today) }))
  const shown = phased.filter(
    (p) => p.phase === 'current' || (p.phase === 'upcoming' && showUpcoming),
  )
  if (shown.length === 0) {
    const next = phased
      .filter((p) => p.phase === 'upcoming')
      .sort((a, b) => ukDay(a.list.validFrom!).localeCompare(ukDay(b.list.validFrom!)))[0]
    if (next) shown.push(next)
  }
  return shown.map((p) => ({ list: p.list, upcoming: p.phase === 'upcoming' }))
}

/** "1 April 2027" (UK). */
export const ukLongDate = (value: string) =>
  new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  })
