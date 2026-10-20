import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { loadClubBySlug } from '@/site/loadClub'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })
const errorPaths = (e: unknown) =>
  ((e as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map((x) => x.path)

const saveHeader = (header: Record<string, unknown>) =>
  w.payload.update({
    collection: 'club-settings',
    id: w.settingsA.id,
    data: { header } as never,
    ...asEditorA(),
  })

describe('header and menu settings', () => {
  it("an editor can build a menu from their own club's pages and web addresses", async () => {
    await saveHeader({
      style: 'transparent',
      phone: '01932 704 500',
      booking: { label: 'Book a tee time', type: 'url', url: 'https://booking.example.com' },
      menu: [
        { label: 'Membership', link: { type: 'page', page: w.pageA.id } },
        {
          label: 'Golf',
          kind: 'manual',
          links: [
            { link: { label: 'Green fees', type: 'url', url: 'https://example.com/fees' } },
            { link: { label: 'Lessons', type: 'url', url: 'https://example.com/lessons' } },
          ],
        },
      ],
    })
    const club = await loadClubBySlug('test-club-a')
    expect(club?.header).toMatchObject({
      style: 'transparent',
      phone: '01932 704 500',
      booking: {
        label: 'Book a tee time',
        link: { kind: 'url', href: 'https://booking.example.com' },
      },
      dropdown: 'panel',
      menu: [
        { label: 'Membership', link: { kind: 'page', slug: 'membership' }, children: [] },
        {
          label: 'Golf',
          overview: null,
          children: [
            { label: 'Green fees', link: { kind: 'url' } },
            { label: 'Lessons', link: { kind: 'url' } },
          ],
        },
      ],
    })
  })

  it('takes up to 10 menu items, and refuses an 11th', async () => {
    const items = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        label: `Item ${i + 1}`,
        link: { type: 'page', page: w.pageA.id },
      }))
    await saveHeader({ menu: items(10) })
    expect((await loadClubBySlug('test-club-a'))?.header.menu).toHaveLength(10)
    const error = await saveHeader({ menu: items(11) }).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('header.menu')
  })

  it("refuses a menu link to club B's page, without saying whether it exists", async () => {
    const error = await saveHeader({
      menu: [{ label: 'Sneaky', link: { type: 'page', page: w.pageB.id } }],
    }).catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('header.menu.0.link.page')
    expect(JSON.stringify(error)).not.toContain('Club B')
  })

  it("the club's own logo reaches the public site with a working address", async () => {
    await w.payload.update({
      collection: 'club-settings',
      id: w.settingsA.id,
      data: { branding: { logoOnLight: w.mediaA.id } } as never,
      ...asEditorA(),
    })
    const club = await loadClubBySlug('test-club-a')
    expect(club?.logoOnLight?.url).toBe(w.mediaA.url)
    expect((await fetch(club!.logoOnLight!.url)).status).toBe(200)
  })

  it("refuses club B's photo as a logo", async () => {
    const error = await w.payload
      .update({
        collection: 'club-settings',
        id: w.settingsA.id,
        data: { branding: { logoOnLight: w.mediaB.id } } as never,
        ...asEditorA(),
      })
      .catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('branding.logoOnLight')
  })

  it("refuses a footer link to club B's page", async () => {
    const error = await w.payload
      .update({
        collection: 'club-settings',
        id: w.settingsA.id,
        data: {
          footer: {
            linkColumns: [
              {
                heading: 'Explore',
                links: [{ link: { label: 'B', type: 'page', page: w.pageB.id } }],
              },
            ],
          },
        } as never,
        ...asEditorA(),
      })
      .catch((e: unknown) => e)
    expect(errorPaths(error)).toContain('footer.linkColumns.0.links.0.link.page')
  })

  it('footer details reach the public site; unsafe social and directions links do not', async () => {
    await w.payload.update({
      collection: 'club-settings',
      id: w.settingsA.id,
      data: {
        footer: {
          style: 'editorial',
          hours: [{ place: 'Clubhouse', times: '7am – 9pm' }],
          email: 'hello@club-a.example',
          social: [{ network: 'instagram', url: 'https://instagram.com/club-a' }],
        },
      } as never,
      ...asEditorA(),
    })
    const club = await loadClubBySlug('test-club-a')
    expect(club?.footer).toMatchObject({
      style: 'editorial',
      hours: [{ place: 'Clubhouse', times: '7am – 9pm' }],
      email: 'hello@club-a.example',
      social: [{ network: 'instagram', url: 'https://instagram.com/club-a' }],
    })
    await expect(
      w.payload.update({
        collection: 'club-settings',
        id: w.settingsA.id,
        data: { footer: { social: [{ network: 'x', url: 'javascript:alert(1)' }] } } as never,
        ...asEditorA(),
      }),
    ).rejects.toThrow()
  })

  it('refuses unsafe web addresses', async () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,hi', 'example.com']) {
      await expect(
        saveHeader({ booking: { label: 'Book', type: 'url', url } }),
        url,
      ).rejects.toThrow()
    }
  })

  it("the public site drops a reference to club B's page even if one got into the database", async () => {
    await w.payload.db.drizzle.execute(
      sql`UPDATE club_settings SET header_booking_type = 'page', header_booking_page_id = ${w.pageB.id}, header_booking_label = 'Book' WHERE id = ${w.settingsA.id}`,
    )
    const club = await loadClubBySlug('test-club-a')
    expect(club?.header.booking).toBeNull()
    expect(JSON.stringify(club)).not.toContain(w.pageB.id)
  })
})
