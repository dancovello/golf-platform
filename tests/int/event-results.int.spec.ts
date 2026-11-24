import { beforeAll, describe, expect, it } from 'vitest'

import { rt } from '@/demo/richText'
import type { Event } from '@/payload-types'
import { clubResults, loadEventPage } from '@/site/events'

import { seedWorld, type World } from './helpers/seed'

/** Results built into events (24 Nov 2026, event pages part 2). */

let w: World

const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString()

const addEvent = (tenant: string, data: Partial<Event> & Record<string, unknown>) =>
  w.payload.create({
    collection: 'events',
    data: {
      status: 'published',
      category: 'competition',
      booking: 'book',
      startsAt: daysFromNow(-3),
      ...data,
      tenant,
    } as never,
  })

beforeAll(async () => {
  w = await seedWorld()
})

describe('results built into an event', () => {
  it('fill a table from pasted rows, and never store the paste box', async () => {
    const saved = await addEvent(w.clubA.id, {
      title: 'Pasted results',
      resultTables: [
        {
          title: 'Overall',
          who: 'individuals',
          score: 'points',
          columns: ['handicap'],
          paste: 'Pos\tName\tHcp\tPts\n1\tTom Hardacre\t12\t42\n2\tGareth Pryce\t8\t40',
        },
      ],
    })
    expect(saved.hasResults).toBe(true)
    const table = saved.resultTables?.[0]
    expect(table?.rows?.map((r) => [r.name, r.handicap, r.score])).toEqual([
      ['Tom Hardacre', '12', '42'],
      ['Gareth Pryce', '8', '40'],
    ])
    expect((table as { paste?: unknown }).paste).toBeFalsy()
  })

  it('show on the event’s page once it has taken place', async () => {
    const saved = await addEvent(w.clubA.id, {
      title: 'Results on the page',
      resultTables: [
        {
          title: 'Overall',
          who: 'individuals',
          score: 'points',
          rows: [{ name: 'A. Player', score: '40' }],
        },
      ],
      matches: [{ round: 'Final', sideA: 'A', sideB: 'B', result: '2 & 1', winner: 'a' }],
      prizes: [{ prize: 'Nearest the pin', winner: 'C. Player' }],
    })
    const page = await loadEventPage(w.clubA.id, saved.slug!)
    expect(page?.past).toBe(true)
    expect(page?.builtInResults?.tables[0].rows[0]).toMatchObject({ position: '1', score: '40' })
    expect(page?.builtInResults?.matches[0].winner).toBe('a')
    expect(page?.builtInResults?.prizes[0].prize).toBe('Nearest the pin')
  })

  it('list the event under Results, for its own club only', async () => {
    const ours = await addEvent(w.clubA.id, {
      title: 'Listed with results',
      prizes: [{ prize: 'Longest drive', winner: 'D. Player' }],
    })
    const theirs = await addEvent(w.clubB.id, {
      title: 'Club B results',
      prizes: [{ prize: 'Longest drive', winner: 'E. Player' }],
    })
    const listed = (await clubResults(w.clubA.id)).map((e) => e.id)
    expect(listed).toContain(String(ours.id))
    expect(listed).not.toContain(String(theirs.id))
  })

  it('go when the club removes them', async () => {
    const saved = await addEvent(w.clubA.id, {
      title: 'Results removed later',
      prizes: [{ prize: 'Twos', winner: 'F. Player' }],
    })
    const edited = await w.payload.update({
      collection: 'events',
      id: saved.id,
      data: { prizes: [] } as never,
    })
    expect(edited.hasResults).toBe(false)
  })

  it('refuse a report showing another club’s photo', async () => {
    await expect(
      addEvent(w.clubA.id, {
        title: 'Borrowed report photo',
        resultsReport: rt.doc(rt.image(String(w.mediaB.id))) as Event['resultsReport'],
      }),
    ).rejects.toThrow()
  })
})
