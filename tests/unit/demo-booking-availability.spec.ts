import { describe, expect, it } from 'vitest'

import {
  type BookingConfig,
  hasHours,
  isOpen,
  openDays,
  slotKey,
  ukClock,
} from '@/marketing/booking/availability'

const config: BookingConfig = {
  hours: [
    { weekday: 'tue', from: '10:00', to: '12:00' },
    { weekday: 'tue', from: '14:00', to: '15:00' },
    { weekday: 'thu', from: '09:30', to: '10:30' },
  ],
  slotMinutes: 30,
  daysAhead: 14,
  noticeHours: 24,
}

// Monday 2 November 2026, 09:00 in London (GMT).
const NOW = new Date('2026-11-02T09:00:00Z')

describe('demo booking availability', () => {
  it('offers each block in steps of the slot length, never past its end', () => {
    const days = openDays(config, new Set(), NOW)
    const tuesday = days.find((d) => d.date === '2026-11-03')
    // Monday 09:00 + 24 hours notice: Tuesday 09:00, so the whole of Tuesday is open.
    expect(tuesday?.times).toEqual(['10:00', '10:30', '11:00', '11:30', '14:00', '14:30'])
    expect(days.find((d) => d.date === '2026-11-05')?.times).toEqual(['09:30', '10:00'])
  })

  it('never offers a weekend, or a weekday with no hours', () => {
    const dates = openDays(config, new Set(), NOW).map((d) => d.date)
    expect(dates.every((d) => ['2026-11-03', '2026-11-05'].includes(d) || d > '2026-11-05')).toBe(
      true,
    )
    expect(dates).not.toContain('2026-11-04')
    expect(dates).not.toContain('2026-11-07')
  })

  it('keeps to the notice period', () => {
    const late = new Date('2026-11-02T11:00:00Z')
    expect(openDays(config, new Set(), late).find((d) => d.date === '2026-11-03')?.times[0]).toBe(
      '11:00',
    )
  })

  it('takes booked slots out, and a day with none left disappears', () => {
    const taken = new Set(['2026-11-05 09:30', '2026-11-05 10:00'])
    expect(openDays(config, taken, NOW).map((d) => d.date)).not.toContain('2026-11-05')
    expect(isOpen(config, taken, NOW, '2026-11-03', '10:00')).toBe(true)
    expect(
      isOpen(config, new Set([slotKey('2026-11-03', '10:00')]), NOW, '2026-11-03', '10:00'),
    ).toBe(false)
  })

  it('refuses a time that is not on offer', () => {
    expect(isOpen(config, new Set(), NOW, '2026-11-03', '10:15')).toBe(false)
    expect(isOpen(config, new Set(), NOW, '2026-11-03', '12:00')).toBe(false)
    expect(isOpen(config, new Set(), NOW, '2026-11-07', '10:00')).toBe(false)
  })

  it('stops after the days ahead', () => {
    const last = openDays(config, new Set(), NOW).at(-1)!
    expect(last.date <= '2026-11-15').toBe(true)
  })

  it('reads the clock in UK time, in summer too', () => {
    expect(ukClock(new Date('2026-07-01T23:30:00Z'))).toEqual({ date: '2026-07-02', time: '00:30' })
    expect(ukClock(new Date('2026-11-02T09:00:00Z'))).toEqual({ date: '2026-11-02', time: '09:00' })
  })

  it('has no hours until some are set', () => {
    expect(hasHours({ ...config, hours: [] })).toBe(false)
    expect(hasHours({ ...config, hours: [{ weekday: 'mon', from: '12:00', to: '09:00' }] })).toBe(
      false,
    )
    expect(hasHours(config)).toBe(true)
  })
})
