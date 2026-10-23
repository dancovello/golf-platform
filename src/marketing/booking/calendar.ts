/**
 * The Demo Booking calendar's arithmetic (Figma Marketing/Demo Booking 187:6498): a month of
 * days laid out Monday first, which of them can be booked, and moving between them with the
 * arrow keys. Dates are plain "YYYY-MM-DD" strings in UK time, so nothing shifts with the
 * visitor's own time zone.
 */

/** A bookable day and its free times, e.g. { date: '2026-10-21', times: ['10:00', '11:30'] }. */
export type OpenDay = { date: string; times: string[] }

const pad = (n: number) => String(n).padStart(2, '0')

export const isoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`

const parts = (iso: string) => iso.split('-').map(Number) as [number, number, number]

const utc = (iso: string) => {
  const [y, m, d] = parts(iso)
  return new Date(Date.UTC(y, m - 1, d, 12))
}

/** Monday 0 … Sunday 6. */
export const weekdayIndex = (iso: string) => (utc(iso).getUTCDay() + 6) % 7

export const isWeekend = (iso: string) => weekdayIndex(iso) >= 5

/** A month as weeks of seven cells, Monday first; empty cells are null. */
export const monthGrid = (year: number, month: number): (string | null)[][] => {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const lead = weekdayIndex(isoDate(year, month, 1))
  const cells: (string | null)[] = Array.from({ length: lead }, () => null)
  for (let d = 1; d <= days; d++) cells.push(isoDate(year, month, d))
  while (cells.length % 7) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** The date `days` away (arrow keys: ±1 for a day, ±7 for a week). */
export const addDays = (iso: string, days: number) => {
  const date = utc(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** "October 2026" */
export const monthLabel = (year: number, month: number) =>
  new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1, 12)),
  )

/** "Wednesday 21 October" */
export const longDay = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
    .format(utc(iso))
    .replace(',', '')

/** "Wed 21 Oct" */
export const shortDay = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
    .format(utc(iso))
    .replace(',', '')

/** "Wednesday" */
export const weekdayName = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { weekday: 'long', timeZone: 'UTC' }).format(utc(iso))

/** Only weekdays can ever be booked (hand-off §6), whatever the calendar says. */
export const bookableDays = (open: OpenDay[]) =>
  new Map(open.filter((d) => !isWeekend(d.date) && d.times.length).map((d) => [d.date, d.times]))
