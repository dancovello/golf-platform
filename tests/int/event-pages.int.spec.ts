import { beforeAll, describe, expect, it } from 'vitest'

import { eventSlugFrom } from '@/collections/eventSlug'
import { rt } from '@/demo/richText'
import type { Event } from '@/payload-types'
import { startingValues } from '@/site/contact/startingValues'
import { bookingLink, eventsForSitemap, loadEventPage, upcomingEvents } from '@/site/events'

import { seedWorld, type World } from './helpers/seed'

/** Event pages (24 Nov 2026): every event has its own page at /events/<address>. */

let w: World

const daysFromNow = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString()

const addEvent = (tenant: string, data: Partial<Event>) =>
  w.payload.create({
    collection: 'events',
    data: {
      status: 'published',
      category: 'competition',
      booking: 'book',
      startsAt: daysFromNow(10),
      ...data,
      tenant,
    } as never,
  })

beforeAll(async () => {
  w = await seedWorld()
})

describe('event web addresses', () => {
  it('come from the title and year, once', () => {
    expect(eventSlugFrom('Spring Open', '2027-04-12T07:00:00Z')).toBe('spring-open-2027')
    expect(eventSlugFrom('2027 Club Championship', '2027-07-01T07:00:00Z')).toBe(
      '2027-club-championship',
    )
    // New Year's Eve, 23:30 UK time, is still that year.
    expect(eventSlugFrom('Ball', '2026-12-31T23:30:00Z')).toBe('ball-2026')
    expect(eventSlugFrom('!!!', '2027-07-01T07:00:00Z')).toBe('2027')
  })

  it('are filled in, kept apart within a club, and free to repeat at another club', async () => {
    const startsAt = '2031-04-12T07:00:00Z'
    const first = await addEvent(w.clubA.id, { title: 'Pages Open', startsAt })
    const second = await addEvent(w.clubA.id, { title: 'Pages Open', startsAt })
    const other = await addEvent(w.clubB.id, { title: 'Pages Open', startsAt })
    expect(first.slug).toBe('pages-open-2031')
    expect(second.slug).toBe('pages-open-2031-2')
    expect(other.slug).toBe('pages-open-2031')
  })

  it('refuse an address another of the club’s events already uses', async () => {
    const taken = await addEvent(w.clubA.id, { title: 'Typed address one' })
    await expect(
      addEvent(w.clubA.id, { title: 'Typed address two', slug: taken.slug }),
    ).rejects.toThrow()
    // Another club may use it.
    await expect(
      addEvent(w.clubB.id, { title: 'Typed address two', slug: taken.slug }),
    ).resolves.toBeTruthy()
  })

  it('are kept when an event is edited', async () => {
    const saved = await addEvent(w.clubA.id, { title: 'Keeps its address' })
    const edited = await w.payload.update({
      collection: 'events',
      id: saved.id,
      data: { title: 'Renamed later' },
    })
    expect(edited.slug).toBe(saved.slug)
  })
})

describe('an event’s page', () => {
  it('shows a published event of this club, with its write-up', async () => {
    const saved = await addEvent(w.clubA.id, {
      title: 'Written up',
      body: rt.doc(rt.p('Bacon rolls from 6:45.')) as Event['body'],
    })
    const page = await loadEventPage(w.clubA.id, saved.slug!)
    expect(page?.title).toBe('Written up')
    expect(JSON.stringify(page?.body)).toContain('Bacon rolls')
    expect(page?.past).toBe(false)
  })

  it('is never shown for another club’s event, or for a draft', async () => {
    const theirs = await addEvent(w.clubB.id, { title: 'Club B only' })
    expect(await loadEventPage(w.clubA.id, theirs.slug!)).toBeNull()
    const draft = await addEvent(w.clubA.id, { title: 'Still a draft', status: 'draft' })
    expect(await loadEventPage(w.clubA.id, draft.slug!)).toBeNull()
    // The admin's live preview may show the club's own draft.
    expect(await loadEventPage(w.clubA.id, draft.slug!, { unpublished: true })).not.toBeNull()
    // …but never another club's, draft or not.
    expect(await loadEventPage(w.clubA.id, theirs.slug!, { unpublished: true })).toBeNull()
  })

  it('stays up after the day, marked as past', async () => {
    const saved = await addEvent(w.clubA.id, { title: 'Last week', startsAt: daysFromNow(-7) })
    const page = await loadEventPage(w.clubA.id, saved.slug!)
    expect(page?.past).toBe(true)
  })

  it('refuses a write-up showing another club’s photo', async () => {
    await expect(
      addEvent(w.clubA.id, {
        title: 'Borrowed photo',
        body: rt.doc(rt.image(String(w.mediaB.id))) as Event['body'],
      }),
    ).rejects.toThrow()
  })

  it('is listed in the club’s sitemap, and only that club’s', async () => {
    const saved = await addEvent(w.clubA.id, { title: 'In the sitemap' })
    const theirs = await addEvent(w.clubB.id, { title: 'Not in A’s sitemap' })
    const slugs = (await eventsForSitemap(w.clubA.id)).map((e) => e.slug)
    expect(slugs).toContain(saved.slug)
    expect(slugs).not.toContain(theirs.slug)
  })
})

describe('the Enquire button', () => {
  it('opens the contact form about this event, unless the club chose somewhere else', async () => {
    expect(bookingLink('enquire', null, 'spring-open-2027')).toEqual({
      kind: 'page',
      slug: 'contact?about=events&event=spring-open-2027',
    })
    expect(bookingLink('enquire', { kind: 'page', slug: 'contact' }, 'x-2027')).toEqual({
      kind: 'page',
      slug: 'contact?about=events&event=x-2027',
    })
    const academy = { kind: 'page' as const, slug: 'academy' }
    expect(bookingLink('enquire', academy, 'x-2027')).toBe(academy)
    expect(bookingLink('book', null, 'x-2027')).toBeNull()

    await addEvent(w.clubA.id, { title: 'Enquire about me', booking: 'enquire' })
    const listed = (await upcomingEvents(w.clubA.id, 50)).find(
      (e) => e.title === 'Enquire about me',
    )
    expect(listed?.link).toEqual({
      kind: 'page',
      slug: `contact?about=events&event=${listed?.slug}`,
    })
  })

  it('starts the form with the Events topic, the day and which event it is', () => {
    const values = startingValues(null, {
      title: 'Spring Open',
      startsAt: '2027-04-12T07:00:00Z',
    })
    expect(values.purpose).toBe('events')
    expect(values.preferredDate).toBe('2027-04-12')
    expect(values.message).toBe('About: Spring Open, Mon 12 Apr 2027\n\n')
    expect(startingValues('membership', null).purpose).toBe('membership')
    expect(startingValues('nonsense', null).purpose).toBe('general')
  })
})
