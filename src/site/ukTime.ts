/** UK (Europe/London) calendar days, for events that have a date but no start time. */
const LONDON = 'Europe/London'

const ukParts = (d: Date) => {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: LONDON,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((x) => [x.type, x.value]),
  )
  return {
    y: Number(p.year),
    m: Number(p.month),
    d: Number(p.day),
    h: Number(p.hour),
    min: Number(p.minute),
  }
}

/** The moment 00:00 UK time begins the UK day that `d` falls on. */
export const ukStartOfDay = (d: Date): Date => {
  const { y, m, d: day } = ukParts(d)
  // Midnight UK is 00:00 UTC (winter) or 23:00 UTC the evening before (summer).
  for (const hours of [0, -1]) {
    const candidate = new Date(Date.UTC(y, m - 1, day, hours))
    const c = ukParts(candidate)
    if (c.d === day && c.h === 0 && c.min === 0) return candidate
  }
  return new Date(Date.UTC(y, m - 1, day))
}

/** The moment the UK day that `d` falls on ends (the next midnight UK time). */
export const ukEndOfDay = (d: Date): Date =>
  ukStartOfDay(new Date(ukStartOfDay(d).getTime() + 25 * 60 * 60 * 1000))
