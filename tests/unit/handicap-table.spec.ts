import { describe, expect, it } from 'vitest'

import { courseHandicap, handicapTable, showHandicap, showRange } from '@/site/blocks/courseHandicap'

// Course handicap tables (G7, 15 Nov 2026): the World Handicap System formula.
describe('course handicap', () => {
  it('index × slope ÷ 113 + (rating − par), rounded to the nearest whole number', () => {
    // 18.0 × 130 ÷ 113 = 20.707…, + (71.2 − 72) = 19.9 → 20
    expect(courseHandicap(180, 71.2, 130, 72)).toBe(20)
    // A slope of 113 and a rating equal to par leaves the index itself.
    expect(courseHandicap(124, 72, 113, 72)).toBe(12)
  })

  it('rounds halves up, including below zero', () => {
    expect(courseHandicap(125, 72, 113, 72)).toBe(13) // 12.5 → 13
    expect(courseHandicap(0, 70.5, 113, 72)).toBe(-1) // −1.5 → −1
  })
})

describe('the table', () => {
  const tee = { rating: 71.2, slope: 130, par: 72 }

  it('runs from index 0.0 to 54.0 with no gaps and no overlaps', () => {
    const rows = handicapTable(tee)!
    expect(rows[0].from).toBe(0)
    expect(rows[rows.length - 1].to).toBe(54)
    for (let i = 1; i < rows.length; i++) {
      expect(Math.round((rows[i].from - rows[i - 1].to) * 10)).toBe(1)
      expect(rows[i].courseHandicap).toBe(rows[i - 1].courseHandicap + 1)
    }
  })

  it('every index lands in the band whose course handicap it gives', () => {
    const rows = handicapTable(tee)!
    for (let t = 0; t <= 540; t += 7) {
      const row = rows.find((r) => t / 10 >= r.from && t / 10 <= r.to)!
      expect(row.courseHandicap).toBe(courseHandicap(t, tee.rating, tee.slope, tee.par))
    }
  })

  it('applies an allowance to the course handicap and rounds again', () => {
    const row = handicapTable(tee, 95)!.find((r) => r.courseHandicap === 20)!
    expect(row.playingHandicap).toBe(19)
    expect(handicapTable(tee)![0].playingHandicap).toBeNull()
  })

  it('is not made when the rating, slope or par is missing', () => {
    expect(handicapTable({ rating: null, slope: 130, par: 72 })).toBeNull()
    expect(handicapTable({ rating: 71, slope: null, par: 72 })).toBeNull()
    expect(handicapTable({ rating: 71, slope: 130, par: null })).toBeNull()
  })

  it('shows plus handicaps and ranges the way clubs print them', () => {
    expect(showHandicap(-2)).toBe('+2')
    expect(showHandicap(0)).toBe('0')
    expect(showRange({ from: 10.4, to: 11.2 })).toBe('10.4 – 11.2')
    expect(showRange({ from: 0, to: 0 })).toBe('0.0')
  })
})
