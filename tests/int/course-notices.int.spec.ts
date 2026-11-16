import { beforeAll, describe, expect, it } from 'vitest'

import { currentNotices } from '@/site/blocks/resolve'
import { loadClubPage } from '@/site/loadClub'

import { seedWorld, type World } from './helpers/seed'

// Course notices and visitor times (G4, 15 Nov 2026).

let w: World

const DAY = 86_400_000
const inDays = (n: number) => new Date(Date.now() + n * DAY).toISOString()

const updateStatus = (data: Record<string, unknown>) =>
  w.payload.update({
    collection: 'course-status',
    id: w.statusA.id,
    data: data as never,
    overrideAccess: false,
    user: w.editorA,
  })

const savePage = (layout: unknown[]) =>
  w.payload.update({
    collection: 'pages',
    id: w.pageA.id,
    data: { layout } as never,
    overrideAccess: false,
    user: w.editorA,
  })

beforeAll(async () => {
  w = await seedWorld()
})

describe('which notices show', () => {
  const today = new Date('2026-12-10T12:00:00Z')
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toISOString()
  const notices = [
    {
      message: 'Ended',
      kind: 'closed' as const,
      startsOn: day('2026-11-01'),
      endsOn: day('2026-12-09'),
    },
    {
      message: 'Mats',
      kind: 'restricted' as const,
      startsOn: day('2026-12-01'),
      endsOn: day('2027-02-28'),
    },
    {
      message: 'Ends today',
      kind: 'open' as const,
      startsOn: day('2026-12-01'),
      endsOn: day('2026-12-10'),
    },
    { message: 'No end', kind: 'open' as const, startsOn: day('2026-10-01') },
    { message: 'In three weeks', kind: 'closed' as const, startsOn: day('2026-12-31') },
    { message: 'Too far ahead', kind: 'closed' as const, startsOn: day('2027-03-01') },
  ]

  it('shows those in force (soonest-ending first), then those within a month', () => {
    expect(currentNotices(notices, today).map((n) => [n.message, n.now])).toEqual([
      ['Ends today', true],
      ['Mats', true],
      ['No end', true],
      ['In three weeks', false],
    ])
  })
})

describe('the course status record', () => {
  it('editing only notices does not count as updating the course', async () => {
    const checked = await updateStatus({ reason: 'All holes open.' })
    expect(checked.stateChangedAt).toBeTruthy()
    const before = checked.stateChangedAt
    await new Promise((r) => setTimeout(r, 20))
    const noticed = await updateStatus({
      notices: [{ message: 'Fairway mats in use', kind: 'restricted', startsOn: inDays(-1) }],
    })
    expect(noticed.stateChangedAt).toBe(before)
    await new Promise((r) => setTimeout(r, 20))
    const confirmed = await updateStatus({})
    expect(confirmed.stateChangedAt).not.toBe(before)
  })

  it('refuses a notice that ends before it starts', async () => {
    await expect(
      updateStatus({
        notices: [{ message: 'Wrong', kind: 'closed', startsOn: inDays(5), endsOn: inDays(2) }],
      }),
    ).rejects.toThrow()
  })

  it('the website gets the notices with the status, and only this club’s', async () => {
    await updateStatus({
      state: 'open',
      notices: [
        {
          message: 'Fairway mats in use',
          kind: 'restricted',
          startsOn: inDays(-3),
          endsOn: inDays(30),
        },
        { message: 'Closed for tining', kind: 'closed', startsOn: inDays(10), endsOn: inDays(12) },
        { message: 'Long gone', kind: 'closed', startsOn: inDays(-30), endsOn: inDays(-20) },
      ],
    })
    await w.payload.update({
      collection: 'course-status',
      id: w.statusB.id,
      data: {
        notices: [{ message: 'Club B notice', kind: 'closed', startsOn: inDays(-1) }],
      } as never,
      overrideAccess: true,
    })
    await savePage([{ blockType: 'courseStatus', style: 'board', heading: 'Course status' }])
    const status = (await loadClubPage(w.clubA.id, 'membership'))!.ctx.courseStatus!
    expect(status.notices.map((n) => [n.message, n.now])).toEqual([
      ['Fairway mats in use', true],
      ['Closed for tining', false],
    ])
    expect(status.stale).toBe(false)
  })

  it('a notice can say which course it applies to', async () => {
    await updateStatus({
      notices: [
        {
          message: 'Fairway mats in use',
          appliesTo: ' Heathland course ',
          kind: 'restricted',
          startsOn: inDays(-1),
        },
      ],
    })
    await savePage([{ blockType: 'courseStatus', style: 'board', heading: 'Course status' }])
    const status = (await loadClubPage(w.clubA.id, 'membership'))!.ctx.courseStatus!
    expect(status.notices[0]).toMatchObject({ appliesTo: 'Heathland course', now: true })
  })
})

describe('the Visitor times block', () => {
  it('saves timetables with their days and times', async () => {
    const saved = await savePage([
      {
        blockType: 'visitorTimes',
        style: 'table',
        heading: 'When visitors can play',
        timetables: [
          {
            name: 'Summer',
            startMonth: '4',
            endMonth: '10',
            rows: [
              { days: 'Thursday', times: 'Members only' },
              { days: 'Saturday', times: 'After 1pm', note: 'Two-balls only' },
            ],
          },
        ],
      },
    ])
    const block = (saved.layout ?? [])[0] as {
      blockType: string
      timetables?: { rows?: { days: string; times: string }[] }[]
    }
    expect(block.blockType).toBe('visitorTimes')
    expect(block.timetables?.[0].rows?.map((r) => [r.days, r.times])).toEqual([
      ['Thursday', 'Members only'],
      ['Saturday', 'After 1pm'],
    ])
  })
})
