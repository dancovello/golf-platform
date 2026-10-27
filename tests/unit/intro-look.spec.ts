import { describe, expect, it } from 'vitest'

import { cubicBezier, easeEnter } from '@/marketing/intro/easing'
import { DEFAULT_LOOK, LOOK_CONTROLS } from '@/marketing/intro/look'

describe('golf ball intro easing', () => {
  it('starts at 0 and ends at 1', () => {
    expect(easeEnter(0)).toBe(0)
    expect(easeEnter(1)).toBe(1)
    expect(easeEnter(-1)).toBe(0)
    expect(easeEnter(2)).toBe(1)
  })

  it('never goes backwards', () => {
    let previous = 0
    for (let i = 1; i <= 100; i++) {
      const value = easeEnter(i / 100)
      expect(value).toBeGreaterThanOrEqual(previous)
      previous = value
    }
  })

  it('eases out: most of the movement happens early', () => {
    expect(easeEnter(0.25)).toBeGreaterThan(0.6)
  })

  it('matches a straight line for linear control points', () => {
    const linear = cubicBezier(0, 0, 1, 1)
    for (const x of [0.1, 0.33, 0.5, 0.9]) expect(linear(x)).toBeCloseTo(x, 4)
  })
})

describe('golf ball intro settings', () => {
  it('has a slider for every setting, and every default sits within its slider', () => {
    const keys = Object.keys(DEFAULT_LOOK).sort()
    expect(LOOK_CONTROLS.map((control) => control.key).sort()).toEqual(keys)
    for (const control of LOOK_CONTROLS) {
      const value = DEFAULT_LOOK[control.key]
      expect(value, control.key).toBeGreaterThanOrEqual(control.min)
      expect(value, control.key).toBeLessThanOrEqual(control.max)
    }
  })
})
