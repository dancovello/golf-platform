import { describe, expect, it } from 'vitest'

import { cubicBezier, easeEnter } from '@/marketing/intro/easing'
import { DEFAULT_LOOK, LOOK_CONTROLS } from '@/marketing/intro/look'
import { DEFAULT_MARK, INTRO_MARK_KINDS } from '@/marketing/intro/mark'
import { CONTENT_START, revealFrame } from '@/marketing/intro/reveal'

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

describe('golf ball intro reveal timing', () => {
  it('starts at idle: ball showing, page hidden', () => {
    expect(revealFrame(0, 7)).toEqual({ speed: 1, ball: 1, cue: 1, content: 0 })
  })

  it('ends with the ball gone, the spin at full speed and the page in place', () => {
    expect(revealFrame(1, 7)).toEqual({ speed: 7, ball: 0, cue: 0, content: 1 })
  })

  it('brings the page in only from 60% of the way through', () => {
    expect(revealFrame(CONTENT_START, 7).content).toBe(0)
    expect(revealFrame(0.8, 7).content).toBeGreaterThan(0)
  })
})

describe('golf ball intro logo and message', () => {
  it('uses one of the choices the tuning page offers', () => {
    expect(INTRO_MARK_KINDS.map((choice) => choice.kind)).toContain(DEFAULT_MARK.kind)
  })

  it('has a message ready for when Message is chosen', () => {
    expect(DEFAULT_MARK.message.trim().length).toBeGreaterThan(0)
  })
})
