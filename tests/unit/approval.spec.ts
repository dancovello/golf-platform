import { describe, expect, it } from 'vitest'

import { approvedSincePush } from '../../scripts/lib/approval'

/** Migrations audit, finding 2: an approval counts only for what was pushed before it. */
describe('an approval counts only if it was given after the latest push', () => {
  const base = {
    runTimes: ['2026-10-23T10:00:05Z', '2026-10-23T10:00:00Z'],
    labelPresent: true,
    owner: 'dancovello',
  }

  it('counts a label the owner added after the push', () => {
    const labelEvents = [{ actor: 'dancovello', at: '2026-10-23T10:05:00Z' }]
    expect(approvedSincePush({ ...base, labelEvents }).approved).toBe(true)
  })

  it('does not count a label added before a later push', () => {
    const labelEvents = [{ actor: 'dancovello', at: '2026-10-23T09:00:00Z' }]
    expect(approvedSincePush({ ...base, labelEvents }).approved).toBe(false)
  })

  it('does not count a label someone else added, or one since removed', () => {
    const labelEvents = [{ actor: 'someone-else', at: '2026-10-23T10:05:00Z' }]
    expect(approvedSincePush({ ...base, labelEvents }).approved).toBe(false)
    const own = [{ actor: 'dancovello', at: '2026-10-23T10:05:00Z' }]
    expect(approvedSincePush({ ...base, labelEvents: own, labelPresent: false }).approved).toBe(
      false,
    )
  })

  it('needs a written reason after the push when one is asked for', () => {
    const labelEvents = [{ actor: 'dancovello', at: '2026-10-23T10:05:00Z' }]
    const commentPrefix = 'Security finding dismissed:'
    const old = [
      { author: 'dancovello', at: '2026-10-23T09:00:00Z', body: 'Security finding dismissed: x' },
    ]
    expect(approvedSincePush({ ...base, labelEvents, commentPrefix, comments: old }).approved).toBe(
      false,
    )
    const fresh = [
      { author: 'dancovello', at: '2026-10-23T10:06:00Z', body: 'security finding dismissed: y' },
    ]
    expect(
      approvedSincePush({ ...base, labelEvents, commentPrefix, comments: fresh }).approved,
    ).toBe(true)
  })

  it('refuses when the push time is unknown', () => {
    const labelEvents = [{ actor: 'dancovello', at: '2026-10-23T10:05:00Z' }]
    expect(approvedSincePush({ ...base, runTimes: [], labelEvents }).approved).toBe(false)
  })
})
