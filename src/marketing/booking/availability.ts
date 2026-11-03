import { addDays, isoDate, type OpenDay, weekdayIndex } from './calendar'

/** Weekdays Monday to Friday, in the order of `weekdayIndex` (0 to 4). Weekends are never bookable. */
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri'] as const
export type Weekday = (typeof WEEKDAYS)[number]

/** One block of free time on a weekday, in UK time: "09:30" to "12:00". */
export type Hours = { weekday: Weekday; from: string; to: string }

/** What the settings say about demo calls (Company website → Settings → Demo calls). */
export type BookingConfig = {
  hours: Hours[]
  /** The length of each bookable slot. Never shown to the visitor (hand-off §6). */
  slotMinutes: number
  /** How many days ahead can be booked, counting today. */
  daysAhead: number
  /** The least notice a visitor must give, so nobody books a call that starts in ten minutes. */
  noticeHours: number
}

export const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

const toMinutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3))
const fromMinutes = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** Stored on a booking, and unique while it is booked: "2026-11-10 10:00". */
export const slotKey = (date: string, time: string) => `${date} ${time}`

/** The date and time on a UK clock at this moment, whatever time zone the server is in. */
export const ukClock = (at: Date): { date: string; time: string } => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  )
  return {
    date: isoDate(Number(parts.year), Number(parts.month), Number(parts.day)),
    time: `${parts.hour}:${parts.minute}`,
  }
}

/** The times a day offers: each block's start, then every `slotMinutes` while the slot still fits. */
const dayTimes = (config: BookingConfig, date: string): string[] => {
  const weekday = WEEKDAYS[weekdayIndex(date)]
  if (!weekday || config.slotMinutes < 1) return []
  const times = new Set<string>()
  for (const block of config.hours) {
    if (block.weekday !== weekday || !TIME.test(block.from) || !TIME.test(block.to)) continue
    const end = toMinutes(block.to)
    for (let t = toMinutes(block.from); t + config.slotMinutes <= end; t += config.slotMinutes) {
      times.add(fromMinutes(t))
    }
  }
  return [...times].sort()
}

/**
 * The days and times a visitor can book: the settings' weekly hours, from now plus the notice
 * period, for `daysAhead` days, minus slots already `taken` (as `slotKey`s). Days with nothing
 * left are left out.
 */
export const openDays = (
  config: BookingConfig,
  taken: ReadonlySet<string>,
  now: Date,
): OpenDay[] => {
  const earliest = ukClock(new Date(now.getTime() + config.noticeHours * 3_600_000))
  const today = ukClock(now).date
  const open: OpenDay[] = []
  for (let i = 0; i < config.daysAhead; i++) {
    const date = addDays(today, i)
    const times = dayTimes(config, date).filter(
      (time) =>
        slotKey(date, time) >= slotKey(earliest.date, earliest.time) &&
        !taken.has(slotKey(date, time)),
    )
    if (times.length) open.push({ date, times })
  }
  return open
}

/** Whether one day and time can still be booked. The server checks this again before saving. */
export const isOpen = (
  config: BookingConfig,
  taken: ReadonlySet<string>,
  now: Date,
  date: string,
  time: string,
) => openDays(config, taken, now).some((day) => day.date === date && day.times.includes(time))

/** Whether the settings offer any hours at all: without them the page shows the email fallback. */
export const hasHours = (config: BookingConfig) =>
  config.hours.some((h) => TIME.test(h.from) && TIME.test(h.to) && h.from < h.to)
