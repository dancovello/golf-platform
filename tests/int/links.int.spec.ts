import { beforeAll, describe, expect, it } from 'vitest'

import { upcomingEvents } from '@/site/events'
import { loadClubBySlug } from '@/site/loadClub'

import { event, seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const saveHeader = (header: Record<string, unknown>) =>
  w.payload.update({
    collection: 'club-settings',
    id: w.settingsA.id,
    data: { header } as never,
    overrideAccess: true,
  })

describe('links to the built-in pages (News, Events, Contact, Privacy policy)', () => {
  it('work in the menu and the booking button', async () => {
    await saveHeader({
      style: 'classic',
      booking: { label: 'Get in touch', type: 'builtIn', builtIn: 'contact' },
      menu: [
        { label: 'News', link: { type: 'builtIn', builtIn: 'news' } },
        {
          label: 'Club',
          kind: 'manual',
          links: [
            { link: { label: 'Events', type: 'builtIn', builtIn: 'events' } },
            { link: { label: 'Privacy', type: 'builtIn', builtIn: 'privacy' } },
          ],
        },
      ],
    })
    const club = await loadClubBySlug(String(w.clubA.slug))
    expect(club?.header.booking).toEqual({
      label: 'Get in touch',
      link: { kind: 'page', slug: 'contact' },
    })
    expect(club?.header.menu[0].link).toEqual({ kind: 'page', slug: 'news' })
    expect(club?.header.menu[1].children[0].link).toEqual({ kind: 'page', slug: 'events' })
  })

  it('ignore a page left over from before the link was switched', async () => {
    await saveHeader({
      style: 'classic',
      menu: [{ label: 'News', link: { type: 'builtIn', builtIn: 'news', page: w.pageA.id } }],
    })
    const club = await loadClubBySlug(String(w.clubA.slug))
    expect(club?.header.menu[0].link).toEqual({ kind: 'page', slug: 'news' })
  })

  it('refuse anything that isn’t one of the built-in pages', async () => {
    await expect(
      saveHeader({
        style: 'classic',
        menu: [{ label: 'Admin', link: { type: 'builtIn', builtIn: 'admin' } }],
      }),
    ).rejects.toThrow()
  })

  it('work as an event’s button', async () => {
    const enquire = await event(w.payload, 'Open evening', w.clubA.id, 3)
    await w.payload.update({
      collection: 'events',
      id: enquire.id,
      data: { booking: 'enquire', link: { type: 'builtIn', builtIn: 'contact' } } as never,
    })
    const events = await upcomingEvents(w.clubA.id, 10)
    expect(events.find((e) => e.title === 'Open evening')?.link).toEqual({
      kind: 'page',
      slug: 'contact',
    })
  })
})
