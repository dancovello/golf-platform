import { describe, expect, it } from 'vitest'

import { demoInvite } from '@/marketing/booking/invite'

const NOW = new Date('2026-11-02T09:00:00Z')
const make = (date: string, time: string, minutes = 30) =>
  demoInvite({
    date,
    time,
    minutes,
    summary: 'Demo, call',
    description: 'Line one\nLine two',
    now: NOW,
  })

describe('demo booking calendar file', () => {
  it('writes winter times as they are in UTC', () => {
    const ics = make('2026-11-04', '14:00')
    expect(ics).toContain('DTSTART:20261104T140000Z')
    expect(ics).toContain('DTEND:20261104T143000Z')
  })

  it('takes an hour off for UK summer time', () => {
    const ics = make('2026-07-14', '14:00', 45)
    expect(ics).toContain('DTSTART:20260714T130000Z')
    expect(ics).toContain('DTEND:20260714T134500Z')
  })

  it('escapes commas and line breaks, and uses CRLF line endings', () => {
    const ics = make('2026-11-04', '10:00')
    expect(ics).toContain('SUMMARY:Demo\\, call')
    expect(ics).toContain('DESCRIPTION:Line one\\nLine two')
    expect(ics.split('\r\n').length).toBeGreaterThan(10)
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
  })
})
