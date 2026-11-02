import { describe, expect, it } from 'vitest'

import { eventMeta, eventWhen } from '@/site/events/EventCard'
import type { SiteEvent } from '@/site/events'
import { ukEndOfDay, ukStartOfDay } from '@/site/ukTime'

const iso = (d: Date) => d.toISOString()

describe('UK days', () => {
  it('summer: the day starts at 23:00 UTC the evening before', () => {
    const d = new Date('2026-07-15T12:00:00Z')
    expect(iso(ukStartOfDay(d))).toBe('2026-07-14T23:00:00.000Z')
    expect(iso(ukEndOfDay(d))).toBe('2026-07-15T23:00:00.000Z')
  })

  it('just after UK midnight in summer is still the new day', () => {
    expect(iso(ukStartOfDay(new Date('2026-07-14T23:30:00Z')))).toBe('2026-07-14T23:00:00.000Z')
  })

  it('winter: the day starts at 00:00 UTC', () => {
    const d = new Date('2026-12-01T12:00:00Z')
    expect(iso(ukStartOfDay(d))).toBe('2026-12-01T00:00:00.000Z')
    expect(iso(ukEndOfDay(d))).toBe('2026-12-02T00:00:00.000Z')
  })

  it('the day clocks go forward is 23 hours, and the day they go back is 25', () => {
    const forward = new Date('2026-03-29T12:00:00Z')
    expect(iso(ukStartOfDay(forward))).toBe('2026-03-29T00:00:00.000Z')
    expect(iso(ukEndOfDay(forward))).toBe('2026-03-29T23:00:00.000Z')
    const back = new Date('2026-10-25T12:00:00Z')
    expect(iso(ukStartOfDay(back))).toBe('2026-10-24T23:00:00.000Z')
    expect(iso(ukEndOfDay(back))).toBe('2026-10-26T00:00:00.000Z')
  })
})

const event = (over: Partial<SiteEvent>) =>
  ({
    startsAt: '2026-07-14T23:00:00.000Z',
    noStartTime: false,
    timeNote: null,
    venue: null,
    ...over,
  }) as SiteEvent

describe('an event with no set start time shows only its date', () => {
  it('with a time: date, time, place', () => {
    const e = event({ startsAt: '2026-07-15T17:00:00.000Z', venue: 'Clubhouse' })
    expect(eventMeta(e)).toBe('Wed 15 Jul · 18:00 · Clubhouse')
    expect(eventWhen(e)).toBe('Wed 15 Jul · 18:00')
  })

  it('without a time: just the date (and the place)', () => {
    const e = event({ noStartTime: true, venue: 'Clubhouse' })
    expect(eventWhen(e)).toBe('Wed 15 Jul')
    expect(eventMeta(e)).toBe('Wed 15 Jul · Clubhouse')
  })

  it('a time note still shows, on its own', () => {
    expect(eventWhen(event({ noStartTime: true, timeNote: 'from 10am' }))).toBe(
      'Wed 15 Jul · from 10am',
    )
  })
})
