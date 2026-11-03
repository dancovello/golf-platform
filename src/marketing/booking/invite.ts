import { ukClock } from './availability'

/** The moment a UK wall-clock date and time falls on, as a UTC timestamp (summer time included). */
export const ukToUtc = (date: string, time: string): number => {
  const [y, m, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  const guess = Date.UTC(y, m - 1, d, h, min)
  // The UK is either on GMT (+0) or on summer time (+1): keep the one that reads back the same.
  for (const offset of [0, 1]) {
    const at = guess - offset * 3_600_000
    const clock = ukClock(new Date(at))
    if (clock.date === date && clock.time === time) return at
  }
  return guess
}

const stamp = (at: number) =>
  new Date(at)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')

/** In a calendar file, backslashes, semicolons, commas and line breaks are escaped. */
const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

/**
 * A one-event calendar file (.ics) for a booked demo, which opens in Google, Apple and Outlook
 * calendars. `date` and `time` are UK time, like everything on the booking page.
 */
export const demoInvite = ({
  date,
  time,
  minutes,
  summary,
  description,
  now,
}: {
  date: string
  time: string
  minutes: number
  summary: string
  description: string
  now: Date
}): string => {
  const start = ukToUtc(date, time)
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//A1.Studios//Demo call//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${date}-${time.replace(':', '')}@demo.a1studios`,
    `DTSTAMP:${stamp(now.getTime())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(start + minutes * 60_000)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n')
}
