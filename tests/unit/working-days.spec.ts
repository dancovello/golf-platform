import { describe, expect, it } from 'vitest'

import {
  BANK_HOLIDAYS,
  BANK_HOLIDAYS_UNTIL,
  dueDate,
  formatDueDate,
} from '@/marketing/requests/workingDays'

// "We'll send your homepage by {date}": two UK working days (src/marketing/requests/workingDays.ts).

const due = (iso: string) => formatDueDate(dueDate(new Date(iso)))

describe('two UK working days', () => {
  it('a weekday request is due two weekdays later', () => {
    // Tuesday 20 October 2026 → Thursday 22 October (the Figma example).
    expect(due('2026-10-20T10:00:00Z')).toBe('Thursday 22 October')
  })

  it('weekends are skipped', () => {
    expect(due('2026-10-23T10:00:00Z')).toBe('Tuesday 27 October') // Friday
    expect(due('2026-10-24T10:00:00Z')).toBe('Tuesday 27 October') // Saturday
    expect(due('2026-10-25T10:00:00Z')).toBe('Tuesday 27 October') // Sunday
  })

  it('bank holidays are skipped, including Christmas and Easter', () => {
    // Wednesday 23 Dec 2026: Thu 24 counts, Fri 25 and Mon 28 (Boxing Day moved) don't.
    expect(due('2026-12-23T10:00:00Z')).toBe('Tuesday 29 December')
    // Thursday 25 March 2027: Good Friday 26th and Easter Monday 29th are skipped.
    expect(due('2027-03-25T10:00:00Z')).toBe('Wednesday 31 March')
  })

  it('counts from the UK date, not UTC (late evening in summer time)', () => {
    // 23:30 UK on Monday 1 June 2026 is 22:30 UTC: still Monday, so due Wednesday.
    expect(due('2026-06-01T22:30:00Z')).toBe('Wednesday 3 June')
    // 00:30 UK on Tuesday 2 June is 23:30 UTC on Monday: it's Tuesday in the UK.
    expect(due('2026-06-01T23:30:00Z')).toBe('Thursday 4 June')
  })

  it('the saved bank holidays cover at least the next year', () => {
    // Fails a year before the copy runs out: add the next years from gov.uk/bank-holidays.json.
    expect(BANK_HOLIDAYS_UNTIL).toBeGreaterThanOrEqual(new Date().getFullYear() + 1)
    expect([...BANK_HOLIDAYS].some((d) => d.startsWith(String(BANK_HOLIDAYS_UNTIL)))).toBe(true)
  })
})
