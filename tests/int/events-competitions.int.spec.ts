import { beforeAll, describe, expect, it } from 'vitest'

import type { Event } from '@/payload-types'
import { clubResults, eventsArchive, upcomingEvents } from '@/site/events'
import { bookingLabel, entryStatus, eventFormat, eventWho } from '@/site/events/EventCard'

import { seedWorld, type World } from './helpers/seed'

// Open competitions (G3, 15 Nov 2026): who can enter, entry windows, ballots and results.

let w: World

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

const addEvent = (data: Partial<Event>, tenant = w.clubA.id) =>
  w.payload.create({
    collection: 'events',
    data: {
      title: 'An event',
      status: 'published',
      category: 'competition',
      booking: 'enter',
      startsAt: inDays(30),
      ...data,
      tenant,
    } as never,
  })

const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })
const errorPaths = (e: unknown) =>
  ((e as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map((x) => x.path)

beforeAll(async () => {
  w = await seedWorld()
  await addEvent({
    title: 'Seniors Open',
    entrants: ['men', 'seniors'],
    eligibility: 'Handicap index 18.4 or less, aged 55 and over',
    format: 'Stableford',
    ballot: true,
    entriesOpen: inDays(10),
    link: { type: 'url', url: 'https://example.com/enter' },
  })
  await addEvent({ title: 'Ladies Open', entrants: ['women'], entriesClose: inDays(-1) })
  await addEvent({ title: 'Mixed Foursomes', entrants: ['mixed'] })
  // Past competitions: one with club A's results file, one with a results web address, one
  // with no results.
  await addEvent({
    title: 'Spring Medal',
    startsAt: inDays(-20),
    entrants: ['men'],
    results: { type: 'document', document: w.docA.id },
  })
  await addEvent({
    title: 'Autumn Greensomes',
    startsAt: inDays(-5),
    entrants: ['women'],
    results: { type: 'url', url: 'https://example.com/results' },
  })
  await addEvent({ title: 'Winter Stableford', startsAt: inDays(-3) })
  await addEvent(
    {
      title: 'Club B Open',
      startsAt: inDays(-4),
      results: { type: 'url', url: 'https://example.com/b' },
    },
    w.clubB.id,
  )
})

describe('competition details on the website', () => {
  it('carries who can enter, the rules, format, ballot and entry dates', async () => {
    const seniors = (await upcomingEvents(w.clubA.id, 20)).find((e) => e.title === 'Seniors Open')!
    expect(seniors).toMatchObject({
      entrants: ['men', 'seniors'],
      eligibility: 'Handicap index 18.4 or less, aged 55 and over',
      format: 'Stableford',
      ballot: true,
      booking: 'enter',
    })
    expect(eventWho(seniors)).toBe('Men · Seniors · Handicap index 18.4 or less, aged 55 and over')
    expect(eventFormat(seniors)).toBe('Stableford · Places by ballot')
  })

  it('says when entries open, and when they have closed', async () => {
    const events = await upcomingEvents(w.clubA.id, 20)
    const seniors = events.find((e) => e.title === 'Seniors Open')!
    const ladies = events.find((e) => e.title === 'Ladies Open')!
    const mixed = events.find((e) => e.title === 'Mixed Foursomes')!
    expect(entryStatus(seniors)?.state).toBe('notOpen')
    expect(bookingLabel(seniors)).toMatch(/^Entries open \w{3} \d{1,2} \w{3}, \d{2}:\d{2}$/)
    expect(entryStatus(seniors, new Date(Date.now() + 11 * 86_400_000))).toBeNull()
    expect(bookingLabel(ladies)).toBe('Entries closed')
    expect(bookingLabel(mixed)).toBe('Enter')
  })

  it('filters competitions by who can enter, only within Competitions', async () => {
    const ladies = await eventsArchive(w.clubA.id, {
      category: 'competition',
      entrant: 'women',
      show: 0,
    })
    expect(ladies.entrant).toBe('women')
    expect(ladies.events.map((e) => e.title)).toEqual(['Ladies Open'])
    const ignored = await eventsArchive(w.clubA.id, { category: null, entrant: 'women', show: 0 })
    expect(ignored.entrant).toBeNull()
    const unknown = await eventsArchive(w.clubA.id, {
      category: 'competition',
      entrant: 'nonsense',
      show: 0,
    })
    expect(unknown.entrant).toBeNull()
    expect(
      (await upcomingEvents(w.clubA.id, 20, 'competition', 'mixed')).map((e) => e.title),
    ).toEqual(['Mixed Foursomes'])
  })
})

describe('results', () => {
  it('lists past events with results, newest first, from this club only', async () => {
    const results = await clubResults(w.clubA.id)
    expect(results.map((e) => e.title)).toEqual(['Autumn Greensomes', 'Spring Medal'])
    expect(results[0].results).toEqual({ kind: 'url', href: 'https://example.com/results' })
    expect(results[1].results).toMatchObject({ kind: 'url', file: true })
    expect((await clubResults(w.clubB.id)).map((e) => e.title)).toEqual(['Club B Open'])
  })

  it("refuses club B's document or page as club A's results", async () => {
    const doc = await w.payload
      .update({
        collection: 'events',
        id: w.eventA.id,
        data: { results: { type: 'document', document: w.docB.id } } as never,
        ...asEditorA(),
      })
      .catch((e: unknown) => e)
    expect(errorPaths(doc)).toContain('results.document')
    const page = await w.payload
      .update({
        collection: 'events',
        id: w.eventA.id,
        data: { results: { type: 'page', page: w.pageB.id } } as never,
        ...asEditorA(),
      })
      .catch((e: unknown) => e)
    expect(errorPaths(page)).toContain('results.page')
  })

  it('refuses an unsafe web address for results, and entries closing before they open', async () => {
    await expect(
      w.payload.update({
        collection: 'events',
        id: w.eventA.id,
        data: { results: { type: 'url', url: 'javascript:alert(1)' } } as never,
        ...asEditorA(),
      }),
    ).rejects.toThrow()
    await expect(
      w.payload.update({
        collection: 'events',
        id: w.eventA.id,
        data: { entriesOpen: inDays(5), entriesClose: inDays(4) } as never,
        ...asEditorA(),
      }),
    ).rejects.toThrow()
  })
})
