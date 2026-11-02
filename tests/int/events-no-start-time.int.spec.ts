import { beforeAll, describe, expect, it } from 'vitest'

import type { Event } from '@/payload-types'
import { upcomingEvents } from '@/site/events'
import { ukEndOfDay, ukStartOfDay } from '@/site/ukTime'

import { seedWorld, type World } from './helpers/seed'

let w: World

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString()

const addEvent = (data: Partial<Event>) =>
  w.payload.create({
    collection: 'events',
    data: {
      status: 'published',
      category: 'social',
      booking: 'book',
      ...data,
      tenant: w.clubA.id,
    } as never,
  })

beforeAll(async () => {
  w = await seedWorld()
})

describe('events with a date but no set start time', () => {
  it('are stored at the start of their UK day, whatever time was picked', async () => {
    const picked = hoursFromNow(30)
    const saved = await addEvent({ title: 'Stored', startsAt: picked, noStartTime: true })
    expect(saved.startsAt).toBe(ukStartOfDay(new Date(picked)).toISOString())
    // Untick it later without sending the date: the stored date is kept as it is.
    const edited = await w.payload.update({
      collection: 'events',
      id: saved.id,
      data: { title: 'Stored (edited)' },
    })
    expect(edited.startsAt).toBe(saved.startsAt)
  })

  it('stay on the website all of today, and go when their day has ended', async () => {
    await addEvent({ title: 'Open day today', startsAt: hoursFromNow(0), noStartTime: true })
    await addEvent({ title: 'Open day yesterday', startsAt: hoursFromNow(-30), noStartTime: true })
    await addEvent({ title: 'Quiz an hour ago', startsAt: hoursFromNow(-1) })
    const titles = (await upcomingEvents(w.clubA.id, 20)).map((e) => e.title)
    expect(titles).toContain('Open day today')
    expect(titles).not.toContain('Open day yesterday')
    expect(titles).not.toContain('Quiz an hour ago')
  })

  it('are listed before the timed events on their day', async () => {
    const day = new Date(Date.now() + 5 * 86_400_000)
    const lateMorning = new Date(ukStartOfDay(day).getTime() + 10 * 3_600_000).toISOString()
    await addEvent({ title: 'Timed 10:00', startsAt: lateMorning })
    await addEvent({ title: 'Open day later', startsAt: lateMorning, noStartTime: true })
    const titles = (await upcomingEvents(w.clubA.id, 30)).map((e) => e.title)
    expect(titles.indexOf('Open day later')).toBeLessThan(titles.indexOf('Timed 10:00'))
    expect(ukEndOfDay(day).getTime()).toBeGreaterThan(day.getTime())
  })

  it('carry the flag to the website', async () => {
    const e = (await upcomingEvents(w.clubA.id, 30)).find((x) => x.title === 'Open day later')
    expect(e?.noStartTime).toBe(true)
  })
})
