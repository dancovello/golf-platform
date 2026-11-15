import { describe, expect, it } from 'vitest'

import { isCurrentSeason, priceListPhase, visibleLists } from '@/site/blocks/seasons'

const on = (month: number) => new Date(Date.UTC(2026, month - 1, 15))

describe('which rate season is "Now"', () => {
  it('a season within the year', () => {
    const summer = { startMonth: '6', endMonth: '9' }
    expect(isCurrentSeason(summer, on(7))).toBe(true)
    expect(isCurrentSeason(summer, on(6))).toBe(true)
    expect(isCurrentSeason(summer, on(9))).toBe(true)
    expect(isCurrentSeason(summer, on(10))).toBe(false)
  })

  it('a season that runs over New Year', () => {
    const winter = { startMonth: '11', endMonth: '3' }
    expect(isCurrentSeason(winter, on(12))).toBe(true)
    expect(isCurrentSeason(winter, on(1))).toBe(true)
    expect(isCurrentSeason(winter, on(3))).toBe(true)
    expect(isCurrentSeason(winter, on(7))).toBe(false)
  })

  it('a season without dates is never current', () => {
    expect(isCurrentSeason({}, on(7))).toBe(false)
  })
})

// Dated price lists (G2, 15 Nov 2026): lists switch over by themselves.
describe('dated price lists', () => {
  // Stored as Payload stores a picked day: midnight UK time, as UTC.
  const day = (iso: string) => new Date(`${iso}T00:00:00+01:00`).toISOString()
  const at = (iso: string, time = '12:00') => new Date(`${iso}T${time}:00Z`)
  const winter26 = {
    name: 'Winter 2026/27',
    validFrom: day('2026-11-01'),
    validUntil: day('2027-03-31'),
  }
  const summer27 = {
    name: 'Summer 2027',
    validFrom: day('2027-04-01'),
    validUntil: day('2027-10-31'),
  }
  const undated = { name: 'Always', validFrom: null }

  it('counts whole UK days at both ends', () => {
    expect(priceListPhase(winter26, at('2027-03-31', '22:30'))).toBe('current')
    expect(priceListPhase(winter26, at('2027-04-01', '00:30'))).toBe('expired')
    expect(priceListPhase(summer27, at('2027-03-31', '22:30'))).toBe('upcoming')
    expect(priceListPhase(summer27, at('2027-04-01', '00:30'))).toBe('current')
    expect(priceListPhase(undated, at('2030-01-01'))).toBe('current')
  })

  it('hides expired lists and, unless asked, upcoming ones', () => {
    const lists = [winter26, summer27, undated]
    const names = (today: Date, early: boolean) =>
      visibleLists(lists, today, early).map((v) => [v.list.name, v.upcoming])
    expect(names(at('2026-12-01'), false)).toEqual([
      ['Winter 2026/27', false],
      ['Always', false],
    ])
    expect(names(at('2026-12-01'), true)).toEqual([
      ['Winter 2026/27', false],
      ['Summer 2027', true],
      ['Always', false],
    ])
    expect(names(at('2027-06-01'), false)).toEqual([
      ['Summer 2027', false],
      ['Always', false],
    ])
  })

  it('shows the next list rather than nothing, and nothing once every list has ended', () => {
    const summer28 = {
      ...summer27,
      name: 'Summer 2028',
      validFrom: day('2028-04-01'),
      validUntil: day('2028-10-31'),
    }
    const twoYears = [summer28, summer27]
    expect(
      visibleLists(twoYears, at('2027-01-10'), false).map((v) => [v.list.name, v.upcoming]),
    ).toEqual([['Summer 2027', true]])
    expect(visibleLists([winter26, summer27], at('2028-01-01'), true)).toEqual([])
  })
})
