import { beforeAll, describe, expect, it } from 'vitest'

import { pngFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

// Every block: club A's page can't use club B's photos or pages (src/blocks/*/config.ts refs).
let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const save = (layout: unknown[]) =>
  w.payload.update({
    collection: 'pages',
    id: w.pageA.id,
    data: { layout } as never,
    overrideAccess: false,
    user: w.editorA,
  })
const errorPaths = (e: unknown) =>
  ((e as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map((x) => x.path)

describe('card grid', () => {
  const card = (image: string, page: string) => ({
    title: 'Card',
    image,
    link: { type: 'page', page },
  })

  it("accepts club A's own photos and pages", async () => {
    const photo = await w.payload.create({
      collection: 'media',
      data: { alt: 'A photo', tenant: w.clubA.id },
      file: pngFile('a.png'),
    })
    await expect(
      save([
        {
          blockType: 'ctaCardGrid',
          style: 'editorial',
          heading: 'Explore',
          cards: [1, 2, 3].map(() => card(photo.id, w.pageA.id)),
        },
      ]),
    ).resolves.toBeTruthy()
  })

  it("refuses club B's photo or page in a card", async () => {
    const error = await save([
      {
        blockType: 'ctaCardGrid',
        style: 'editorial',
        heading: 'Explore',
        cards: [
          card(w.mediaA.id, w.pageA.id),
          card(w.mediaB.id, w.pageA.id),
          card(w.mediaA.id, w.pageB.id),
        ],
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.cards.1.image', 'layout.0.cards.2.link.page']),
    )
  })

  it('needs 3 to 6 cards', async () => {
    await expect(
      save([
        {
          blockType: 'ctaCardGrid',
          style: 'index',
          heading: 'Too few',
          cards: [card(w.mediaA.id, w.pageA.id)],
        },
      ]),
    ).rejects.toThrow()
  })
})

describe('image and text', () => {
  it("refuses club B's photos or page", async () => {
    const error = await save([
      {
        blockType: 'twoColumn',
        style: 'collage',
        image: w.mediaB.id,
        insetImage: w.mediaB.id,
        heading: 'Heading',
        body: 'Body',
        link: { label: 'More', type: 'page', page: w.pageB.id },
      },
    ]).catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.image', 'layout.0.insetImage', 'layout.0.link.page']),
    )
  })
})
