/**
 * "We'll send your homepage by {date}": two UK working days after the request, skipping
 * weekends and England & Wales bank holidays (hand-off §10).
 *
 * The bank holidays are a saved copy of https://www.gov.uk/bank-holidays.json (taken
 * 2026-10-21), so the site never depends on gov.uk being up. tests/unit/working-days.spec.ts
 * fails a year before the copy runs out, as a reminder to add the next years.
 */
export const BANK_HOLIDAYS = new Set([
  // 2026
  '2026-01-01',
  '2026-04-03',
  '2026-04-06',
  '2026-05-04',
  '2026-05-25',
  '2026-08-31',
  '2026-12-25',
  '2026-12-28',
  // 2027
  '2027-01-01',
  '2027-03-26',
  '2027-03-29',
  '2027-05-03',
  '2027-05-31',
  '2027-08-30',
  '2027-12-27',
  '2027-12-28',
  // 2028
  '2028-01-03',
  '2028-04-14',
  '2028-04-17',
  '2028-05-01',
  '2028-05-29',
  '2028-08-28',
  '2028-12-25',
  '2028-12-26',
])

/** The last year the saved bank holidays cover. */
export const BANK_HOLIDAYS_UNTIL = 2028

/** How many working days a homepage takes (the copy says "two working days"). */
export const HOMEPAGE_WORKING_DAYS = 2

const ukDateParts = (at: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(at)
    .split('-')
    .map(Number)

const isoDay = (date: Date) => date.toISOString().slice(0, 10)

/** True for a weekday that isn't an England & Wales bank holiday. */
export const isWorkingDay = (date: Date) => {
  const day = date.getUTCDay()
  return day !== 0 && day !== 6 && !BANK_HOLIDAYS.has(isoDay(date))
}

/**
 * The date `workingDays` working days after `sentAt`, counted from the UK calendar day it was
 * sent (so a request at 11pm on Monday is due on Wednesday). Returned at midday UTC on that
 * day, for formatting.
 */
export const dueDate = (sentAt: Date, workingDays = HOMEPAGE_WORKING_DAYS): Date => {
  const [y, m, d] = ukDateParts(sentAt)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  let left = Math.max(1, Math.round(workingDays))
  while (left > 0) {
    date.setUTCDate(date.getUTCDate() + 1)
    if (isWorkingDay(date)) left--
  }
  return date
}

/** e.g. "Thursday 22 October" */
export const formatDueDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(date)
    .replace(',', '')
