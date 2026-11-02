import { describe, expect, it } from 'vitest'

import {
  DEMO_DAYS,
  DEMO_TOKEN_LENGTH,
  demoAddress,
  demoBase,
  demoDaysLeft,
  demoExpiry,
  demoHasExpired,
  demoLabel,
  newDemoToken,
  parseDemoAddress,
} from '@/site/demo'

const DAY = 86_400_000

describe('prospect demo addresses', () => {
  it('makes a random ending that is easy to read and different each time', () => {
    const tokens = new Set(Array.from({ length: 200 }, () => newDemoToken()))
    expect(tokens.size).toBe(200)
    for (const token of tokens)
      expect(token).toMatch(new RegExp(`^[a-z2-9]{${DEMO_TOKEN_LENGTH}}$`))
    for (const token of tokens) expect(token).not.toMatch(/[01lio]/)
  })

  it('splits an address into the club and its ending, and back', () => {
    const address = demoAddress('cottrell-park', 'x7k2m9pq')
    expect(address).toBe('cottrell-park-x7k2m9pq')
    expect(parseDemoAddress(address)).toEqual({ slug: 'cottrell-park', token: 'x7k2m9pq' })
    expect(demoBase('cottrell-park', 'x7k2m9pq')).toBe('/demo/cottrell-park-x7k2m9pq')
  })

  it('refuses anything that is not a club name plus an ending', () => {
    for (const bad of [
      'cottrell-park',
      'cottrell-park-short',
      'cottrell-park-x7k2m9pq1',
      'cottrell-park-X7K2M9PQ',
      'cottrell-park-x7k2m0pq',
      '-x7k2m9pq',
      'x7k2m9pq',
      '../admin',
      'a'.repeat(200),
      '',
      undefined,
      42,
    ]) {
      expect(parseDemoAddress(bad), String(bad)).toBeNull()
    }
  })
})

describe('prospect demo expiry', () => {
  it('lasts 30 days', () => {
    const start = new Date('2026-11-02T10:00:00Z')
    expect(DEMO_DAYS).toBe(30)
    expect(demoExpiry(start).getTime() - start.getTime()).toBe(30 * DAY)
  })

  it('counts whole days left, and shows the expiry on the bar', () => {
    const now = new Date('2026-11-02T10:00:00Z')
    expect(demoLabel(new Date(now.getTime() + 30 * DAY), now)).toBe('Demo - expires in 30 days')
    expect(demoLabel(new Date(now.getTime() + 12 * DAY - 3_600_000), now)).toBe(
      'Demo - expires in 12 days',
    )
    expect(demoLabel(new Date(now.getTime() + 2 * DAY), now)).toBe('Demo - expires in 2 days')
    expect(demoLabel(new Date(now.getTime() + 5 * 3_600_000), now)).toBe('Demo - expires today')
    expect(demoDaysLeft(new Date(now.getTime() - DAY), now)).toBe(0)
  })

  it('has expired at the moment it runs out, or with no date at all', () => {
    const now = new Date('2026-11-02T10:00:00Z')
    expect(demoHasExpired(new Date(now.getTime() + 1), now)).toBe(false)
    expect(demoHasExpired(now, now)).toBe(true)
    expect(demoHasExpired(null, now)).toBe(true)
    expect(demoHasExpired(undefined, now)).toBe(true)
  })
})
