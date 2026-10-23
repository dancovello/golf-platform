import { describe, expect, it } from 'vitest'

import {
  addDays,
  bookableDays,
  longDay,
  monthGrid,
  monthLabel,
  shortDay,
  weekdayIndex,
} from '@/marketing/booking/calendar'

// The Demo Booking calendar (src/marketing/booking/calendar.ts), against Figma 187:6498.

describe('the month grid', () => {
  it('lays October 2026 out Monday first, as in Figma (the 1st is a Thursday)', () => {
    const weeks = monthGrid(2026, 10)
    expect(weeks).toHaveLength(5)
    expect(weeks[0]).toEqual([
      null,
      null,
      null,
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
      '2026-10-04',
    ])
    expect(weeks[4]).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      null,
    ])
    expect(monthLabel(2026, 10)).toBe('October 2026')
  })

  it('handles leap years and months that start on a Monday', () => {
    expect(monthGrid(2028, 2).flat().filter(Boolean)).toHaveLength(29)
    expect(monthGrid(2027, 2)[0][0]).toBe('2027-02-01')
  })
})

describe('moving and naming days', () => {
  it('arrow keys move a day or a week, across months', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-11-03', -7)).toBe('2026-10-27')
    expect(weekdayIndex('2026-10-21')).toBe(2)
  })

  it('writes days the way Figma does', () => {
    expect(longDay('2026-10-21')).toBe('Wednesday 21 October')
    expect(shortDay('2026-10-21')).toBe('Wed 21 Oct')
  })
})

describe('what can be booked', () => {
  it('weekdays with free times only, whatever the calendar sends', () => {
    const days = bookableDays([
      { date: '2026-10-21', times: ['11:30'] },
      { date: '2026-10-24', times: ['10:00'] }, // Saturday
      { date: '2026-10-22', times: [] },
    ])
    expect([...days.keys()]).toEqual(['2026-10-21'])
  })
})
