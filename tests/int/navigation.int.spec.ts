import { beforeAll, describe, expect, it } from 'vitest'

import { loadClubBySlug } from '@/site/loadClub'

import { photoFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

let w: World
let golf: { id: string }
const ids: Record<string, string> = {}

const page = async (
  slug: string,
  title: string,
  extra: Record<string, unknown> = {},
  tenant?: string,
) =>
  w.payload.create({
    collection: 'pages',
    data: { _status: 'published', title, slug, tenant: tenant ?? w.clubA.id, ...extra } as never,
    overrideAccess: true,
  })

const saveSettings = (data: Record<string, unknown>) =>
  w.payload.update({
    collection: 'club-settings',
    id: w.settingsA.id,
    data: data as never,
    overrideAccess: true,
  })

const club = () => loadClubBySlug(String(w.clubA.slug))

beforeAll(async () => {
  w = await seedWorld()
  golf = await page('golf', 'Golf')
  for (const [slug, title, extra] of [
    ['courses', 'The courses', { menuPosition: 2 }],
    ['status', 'Course status', { menuPosition: 1 }],
    ['zed', 'Zed page', {}],
    ['alpha', 'Alpha page', {}],
    ['secret', 'Hidden page', { hideFromMenu: true }],
  ] as const) {
    ids[slug] = String((await page(slug, title, { parent: golf.id, ...extra })).id)
  }
})

describe('pages inside other pages', () => {
  it('refuses a page inside itself or one of its own child pages', async () => {
    await expect(
      w.payload.update({
        collection: 'pages',
        id: golf.id,
        data: { parent: golf.id },
        overrideAccess: true,
      }),
    ).rejects.toThrow(/Parent page/)
    await expect(
      w.payload.update({
        collection: 'pages',
        id: golf.id,
        data: { parent: ids.courses },
        overrideAccess: true,
      }),
    ).rejects.toThrow(/Parent page/)
  })

  it('refuses another club’s page as the parent', async () => {
    await expect(page('b-child', 'B child', { parent: golf.id }, w.clubB.id)).rejects.toThrow()
  })
})

describe('a menu item that shows a page’s child pages', () => {
  it('lists the child pages by position then A–Z, then the extra links; the page is "Overview"', async () => {
    await saveSettings({
      header: {
        style: 'classic',
        menu: [
          {
            label: 'Golf',
            kind: 'children',
            page: golf.id,
            extraLinks: [
              { link: { label: 'Book', type: 'url', url: 'https://booking.example.com' } },
            ],
          },
        ],
      },
    })
    const item = (await club())!.header.menu[0]
    expect(item.overview).toEqual({ kind: 'page', slug: 'golf' })
    expect(item.link).toEqual({ kind: 'page', slug: 'golf' })
    expect(item.image).toBeNull()
    expect(item.children.map((l) => l.label)).toEqual([
      'Course status',
      'The courses',
      'Alpha page',
      'Zed page',
      'Book',
    ])
  })

  it('picks up a new child page without touching the menu', async () => {
    await page('new-one', 'Brand new page', { parent: golf.id, menuPosition: 3 })
    const links = (await club())!.header.menu[0].children.map((l) => l.label)
    expect(links.indexOf('Brand new page')).toBe(2)
  })

  it('is a plain link to the page when it has fewer than two child pages', async () => {
    const lonely = await page('lonely', 'Lonely')
    const single = await page('single', 'Single')
    await page('only-child', 'Only child', { parent: single.id })
    await saveSettings({
      header: {
        style: 'classic',
        menu: [
          { label: 'Lonely', kind: 'children', page: lonely.id },
          { label: 'Single', kind: 'children', page: single.id },
        ],
      },
    })
    const [first, second] = (await club())!.header.menu
    const plain = { overview: null, image: null, children: [] }
    expect(first).toEqual({ label: 'Lonely', link: { kind: 'page', slug: 'lonely' }, ...plain })
    expect(second).toEqual({ label: 'Single', link: { kind: 'page', slug: 'single' }, ...plain })
  })

  it('carries the page’s hero photo only with the "Panel + picture" style', async () => {
    const photo = await w.payload.create({
      collection: 'media',
      data: { alt: 'The 1st tee', tenant: w.clubA.id },
      file: await photoFile('tee.jpg', 1200, 800),
    })
    const pictured = await page('pictured', 'Pictured', {
      layout: [
        {
          blockType: 'hero',
          style: 'heritage',
          mediaType: 'image',
          image: photo.id,
          headline: 'Golf',
        },
      ],
    })
    await page('pictured-a', 'Pictured A', { parent: pictured.id })
    await page('pictured-b', 'Pictured B', { parent: pictured.id })
    const menu = [
      { label: 'Pictured', kind: 'children', page: pictured.id },
      { label: 'Golf', kind: 'children', page: golf.id },
    ]
    await saveSettings({ header: { style: 'classic', dropdown: 'panel', menu } })
    expect((await club())!.header.menu[0].image).toBeNull()
    await saveSettings({ header: { style: 'classic', dropdown: 'panelTile', menu } })
    const [withPhoto, withoutPhoto] = (await club())!.header.menu
    expect(withPhoto.image?.url).toBe(photo.url)
    // No hero on the Golf page: the brand colour tile.
    expect(withoutPhoto.image).toBeNull()
  })

  it('refuses another club’s page', async () => {
    await expect(
      saveSettings({
        header: { style: 'classic', menu: [{ label: 'B', kind: 'children', page: w.pageB.id }] },
      }),
    ).rejects.toThrow()
  })
})

describe('menu items saved before this change', () => {
  it('still work: groups make one drop-down list without headings, otherwise a link', async () => {
    await saveSettings({
      header: {
        style: 'classic',
        menu: [
          { label: 'Plain', link: { type: 'page', page: w.pageA.id } },
          {
            label: 'Groups',
            groups: [
              {
                heading: 'Play',
                links: [{ link: { label: 'Fees', type: 'page', page: w.pageA.id } }],
              },
              { links: [{ link: { label: 'News', type: 'builtIn', builtIn: 'news' } }] },
            ],
          },
          {
            label: 'One link',
            kind: 'manual',
            groups: [{ links: [{ link: { label: 'News', type: 'builtIn', builtIn: 'news' } }] }],
          },
        ],
      },
    })
    const [plain, groups, single] = (await club())!.header.menu
    expect(plain.link).toEqual({ kind: 'page', slug: 'membership' })
    expect(groups.children.map((l) => l.label)).toEqual(['Fees', 'News'])
    // Links you choose have no section page, so no "Overview".
    expect(groups.overview).toBeNull()
    expect(single.children).toEqual([])
    expect(single.link).toEqual({ kind: 'page', slug: 'news' })
  })
})

describe('footer link columns', () => {
  const footer = (linkColumns: unknown[]) =>
    saveSettings({
      footer: {
        style: 'brandColumns',
        email: 'office@test-club-a.example',
        address: 'Test Club A\nTest Lane',
        linkColumns,
      },
    })

  it('take up to three, each picked by hand or following a page’s child pages', async () => {
    await footer([
      { heading: 'Golf', source: 'children', page: golf.id },
      {
        heading: 'Club',
        source: 'manual',
        links: [{ link: { label: 'Contact', type: 'builtIn', builtIn: 'contact' } }],
      },
      { heading: 'More', links: [{ link: { label: 'Fees', type: 'page', page: w.pageA.id } }] },
    ])
    const columns = (await club())!.footer.linkColumns
    expect(columns.map((c) => c.heading)).toEqual(['Golf', 'Club', 'More'])
    expect(columns[0].links.map((l) => l.label)).toEqual([
      'Course status',
      'The courses',
      'Brand new page',
      'Alpha page',
      'Zed page',
    ])
  })

  it('refuse a fourth column, and a hand-picked column with no links', async () => {
    const col = {
      heading: 'X',
      links: [{ link: { label: 'Fees', type: 'page', page: w.pageA.id } }],
    }
    await expect(footer([col, col, col, col])).rejects.toThrow()
    await expect(footer([{ heading: 'Empty', source: 'manual', links: [] }])).rejects.toThrow()
  })
})
