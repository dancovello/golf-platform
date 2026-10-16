/** The date a club promises to reply by: so many working days (Monday to Friday) after the
 * message arrives, counted in UK time. Bank holidays aren't known, so they count as working. */
export const replyByDate = (sentAt: Date, workingDays: number): Date => {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(sentAt)
    .split('-')
    .map(Number)
  const date = new Date(Date.UTC(y, m - 1, d, 12))
  let left = Math.max(1, Math.round(workingDays))
  while (left > 0) {
    date.setUTCDate(date.getUTCDate() + 1)
    const day = date.getUTCDay()
    if (day !== 0 && day !== 6) left--
  }
  return date
}

/** e.g. "Monday 12 October" */
export const formatReplyDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(date)
    .replace(',', '')

/** Today in the UK as YYYY-MM-DD. */
export const ukToday = (now: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
