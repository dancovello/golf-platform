import { beforeAll, describe, expect, it } from 'vitest'

import { DEFAULT_CATEGORIES } from '@/collections/defaultCategories'
import { clubCategories, newsArchive } from '@/site/news'

import { seedWorld, type World } from './helpers/seed'

let w: World
beforeAll(async () => {
  w = await seedWorld()
}, 120_000)

/** Created as club A's editor, so the access rules apply (unlike trusted scripts). */
const add = (name: string, tenant = w.clubA.id, slug?: string) =>
  w.payload.create({
    collection: 'categories',
    data: { name, tenant, ...(slug ? { slug } : {}) } as never,
    user: w.editorA,
    overrideAccess: false,
  })

describe('a club’s categories', () => {
  it('every new club starts with the six it always had, in order', async () => {
    const found = await clubCategories(w.clubA.id)
    expect(found.map((c) => c.slug)).toEqual(DEFAULT_CATEGORIES.map((c) => c.slug))
    expect(found.map((c) => c.name)).toEqual(DEFAULT_CATEGORIES.map((c) => c.name))
  })

  it('an editor adds one; its web address comes from the name', async () => {
    const created = await add('Ladies & Seniors')
    expect(created.slug).toBe('ladies-seniors')
    const found = await clubCategories(w.clubA.id)
    expect(found.at(-1)?.name).toBe('Ladies & Seniors')
    // Another club doesn't get it.
    expect((await clubCategories(w.clubB.id)).some((c) => c.slug === 'ladies-seniors')).toBe(false)
  })

  it('a web address is unique within a club but can repeat in another', async () => {
    await expect(add('Competitions again', w.clubA.id, 'competitions')).rejects.toThrow()
    const other = await w.payload.create({
      collection: 'categories',
      data: { name: 'Shared address', slug: 'shared-address', tenant: w.clubB.id },
      user: w.editorB,
      overrideAccess: false,
    })
    expect(other.slug).toBe('shared-address')
    await expect(add('Shared address', w.clubA.id)).resolves.toMatchObject({
      slug: 'shared-address',
    })
  })

  it('renaming keeps the web address, so existing links still work', async () => {
    const created = await add('Open days')
    const renamed = await w.payload.update({
      collection: 'categories',
      id: created.id,
      data: { name: 'Open days & visits' },
      user: w.editorA,
      overrideAccess: false,
    })
    expect(renamed.slug).toBe('open-days')
  })

  it('news can use a new category, and the archive filters by it', async () => {
    const created = await add('Junior section')
    await w.payload.create({
      collection: 'news',
      data: {
        title: 'Junior coaching starts',
        status: 'published',
        category: created.id,
        publishedAt: new Date(Date.now() - 86_400_000).toISOString(),
        tenant: w.clubA.id,
      } as never,
    })
    const archive = await newsArchive(w.clubA.id, { category: 'junior-section', q: null, page: 1 })
    expect(archive.category).toBe('junior-section')
    expect(archive.cards.map((c) => c.title)).toEqual(['Junior coaching starts'])
    expect(archive.cards[0]?.categoryLabel).toBe('Junior section')
    expect(archive.categories.some((c) => c.slug === 'junior-section')).toBe(true)
  })

  it('an editor can’t file news under another club’s category', async () => {
    await expect(
      w.payload.create({
        collection: 'news',
        data: {
          title: 'Sneaky',
          category: w.categoryB.id,
          publishedAt: new Date().toISOString(),
          tenant: w.clubA.id,
        } as never,
        user: w.editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/category/)
  })

  it('a “Latest news” block can’t point at another club’s category', async () => {
    await expect(
      w.payload.create({
        collection: 'pages',
        data: {
          title: 'Bad block',
          slug: 'bad-block',
          tenant: w.clubA.id,
          layout: [{ blockType: 'newsFeed', heading: 'News', category: w.categoryB.id }],
        } as never,
        user: w.editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/layout/)
  })

  it('refuses to remove a category that articles still use, then allows it once they move', async () => {
    const used = await add('Temporary')
    const article = await w.payload.create({
      collection: 'news',
      data: {
        title: 'Uses temporary',
        category: used.id,
        publishedAt: new Date().toISOString(),
        tenant: w.clubA.id,
      } as never,
    })
    await expect(
      w.payload.delete({
        collection: 'categories',
        id: used.id,
        user: w.editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/uses this category/)
    await w.payload.update({
      collection: 'news',
      id: article.id,
      data: { category: w.categoryA.id },
    })
    await w.payload.delete({
      collection: 'categories',
      id: used.id,
      user: w.editorA,
      overrideAccess: false,
    })
    expect((await clubCategories(w.clubA.id)).some((c) => c.id === used.id)).toBe(false)
  })

  it('removing a club removes its categories too', async () => {
    const club = await w.payload.create({
      collection: 'tenants',
      data: { name: 'Gone Golf Club', slug: 'gone-golf-club' },
      overrideAccess: true,
    })
    await w.payload.create({
      collection: 'news',
      data: {
        title: 'Gone story',
        category: (await clubCategories(club.id as string))[0]!.id,
        publishedAt: new Date().toISOString(),
        tenant: club.id,
      } as never,
    })
    await w.payload.delete({ collection: 'tenants', id: club.id, overrideAccess: true })
    const left = await w.payload.count({
      collection: 'categories',
      where: { tenant: { equals: club.id } },
      overrideAccess: true,
    })
    expect(left.totalDocs).toBe(0)
  })
})
