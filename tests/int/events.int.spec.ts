import { beforeAll, describe, expect, it } from 'vitest'

import type { Event } from '@/payload-types'
import { eventsArchive, featuredEvent, upcomingEvents } from '@/site/events'

import { seedWorld, type World } from './helpers/seed'

let w: World

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

const addEvent = (data: Partial<Event>, tenant = w.clubA.id) =>
  w.payload.create({
    collection: 'events',
    data: {
      title: 'An event',
      status: 'published',
      category: 'social',
      booking: 'book',
      startsAt: inDays(3),
      ...data,
      tenant,
    } as never,
  })

const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })
const errorPaths = (e: unknown) =>
  ((e as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map((x) => x.path)

beforeAll(async () => {
  w = await seedWorld()
  // Club A: the seeded dinner (in 7 days) plus these.
  await addEvent({ title: 'Quiz night', startsAt: inDays(2) })
  await addEvent({ title: 'Autumn Foursomes', category: 'competition', startsAt: inDays(20) })
  await addEvent({ title: 'Wine dinner', category: 'dining', startsAt: inDays(30), featured: true })
  await addEvent({ title: 'Last week', startsAt: inDays(-7) })
  await addEvent({ title: 'Draft evening', status: 'draft', startsAt: inDays(5) })
  await addEvent({
    title: 'Carols',
    startsAt: inDays(40),
    booking: 'soldOut',
    link: { type: 'url', url: 'https://example.com/book' },
  })
})

describe('the website shows only upcoming, published events from its own club', () => {
  it('soonest first; past and draft events left out', async () => {
    const events = await upcomingEvents(w.clubA.id, 10)
    expect(events.map((e) => e.title)).toEqual([
      'Quiz night',
      'Club A dinner',
      'Autumn Foursomes',
      'Wine dinner',
      'Carols',
    ])
    expect((await upcomingEvents(w.clubB.id, 10)).map((e) => e.title)).toEqual(['Club B dinner'])
  })

  it('filters by category, ignoring categories it doesn’t know', async () => {
    const competitions = await eventsArchive(w.clubA.id, { category: 'competition', show: 0 })
    expect(competitions.events.map((e) => e.title)).toEqual(['Autumn Foursomes'])
    const unknown = await eventsArchive(w.clubA.id, { category: 'nonsense', show: 0 })
    expect(unknown.category).toBeNull()
    expect(unknown.total).toBe(5)
  })

  it('a sold-out event has no booking link', async () => {
    const carols = (await upcomingEvents(w.clubA.id, 10)).find((e) => e.title === 'Carols')
    expect(carols).toMatchObject({ booking: 'soldOut', link: null })
  })

  it('features the event marked featured, or else the next one', async () => {
    expect((await featuredEvent(w.clubA.id))?.title).toBe('Wine dinner')
    expect((await featuredEvent(w.clubB.id))?.title).toBe('Club B dinner')
  })
})

describe('the events archive never shows another club’s event', () => {
  it("asking club A's archive to include club B's event shows nothing from club B", async () => {
    const archive = await eventsArchive(w.clubA.id, {
      category: null,
      show: 50,
      include: String(w.eventB.id),
    })
    expect(archive.events.map((e) => e.title)).not.toContain('Club B dinner')
    expect(archive.events.some((e) => e.id === String(w.eventB.id))).toBe(false)
  })
})

describe('events can only use their own club’s photos and pages', () => {
  it("refuses club B's photo and page", async () => {
    const error = await w.payload
      .update({
        collection: 'events',
        id: w.eventA.id,
        data: { image: w.mediaB.id, link: { type: 'page', page: w.pageB.id } } as never,
        ...asEditorA(),
      })
      .catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(expect.arrayContaining(['image', 'link.page']))
  })

  it('refuses an unsafe web address for the button', async () => {
    await expect(
      w.payload.update({
        collection: 'events',
        id: w.eventA.id,
        data: { link: { type: 'url', url: 'javascript:alert(1)' } } as never,
        ...asEditorA(),
      }),
    ).rejects.toThrow()
  })
})

describe('the Upcoming events block', () => {
  it('limits to one category when asked, still only the club’s own', async () => {
    const dining = await upcomingEvents(w.clubA.id, 4, 'dining')
    expect(dining.map((e) => e.title)).toEqual(['Club A dinner', 'Wine dinner'])
    expect(await upcomingEvents(w.clubB.id, 4, 'competition')).toEqual([])
  })
})
