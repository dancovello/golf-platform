import { describe, expect, it } from 'vitest'

import { isCurrentSeason } from '@/site/blocks/seasons'

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
