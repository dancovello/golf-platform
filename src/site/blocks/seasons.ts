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
