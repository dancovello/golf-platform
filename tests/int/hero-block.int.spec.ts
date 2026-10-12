import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { loadClubPage } from '@/site/loadClub'

import { photoFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

let w: World
let photoA: {
  id: string
  url?: string | null
  sizes?: Record<string, { url?: string | null; width?: number | null }>
}

beforeAll(async () => {
  w = await seedWorld()
  photoA = (await w.payload.create({
    collection: 'media',
    data: { alt: 'The 18th green', tenant: w.clubA.id },
    file: await photoFile('green.jpg', 1800, 1000),
  })) as typeof photoA
})

const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })
const errorPaths = (e: unknown) =>
  ((e as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map((x) => x.path)

const hero = (extra: Record<string, unknown> = {}) => ({
  blockType: 'hero',
  style: 'heritage',
  mediaType: 'image',
  image: photoA.id,
  headline: 'A round worth travelling for',
  ...extra,
})

describe('photo sizes', () => {
  it('makes smaller WebP copies, never larger than the original', async () => {
    const sizes = photoA.sizes ?? {}
    expect(sizes.w640?.width).toBe(640)
    expect(sizes.w1024?.width).toBe(1024)
    expect(sizes.w1600?.width).toBe(1600)
    expect(sizes.w2400?.width).toBe(1800) // the original is only 1800 wide: never enlarged
    const res = await fetch(sizes.w640!.url!)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/webp')
  })
})

describe('hero block', () => {
  it('a page with a hero shows its headline and photo, with sized copies', async () => {
    await w.payload.update({
      collection: 'pages',
      id: w.pageA.id,
      data: {
        layout: [
          hero({ primaryButton: { label: 'Visit', type: 'url', url: 'https://example.com' } }),
        ],
      } as never,
      ...asEditorA(),
    })
    const page = await loadClubPage(w.clubA.id, 'membership')
    const block = page!.layout[0] as { headline?: string; image?: unknown; primaryButton?: unknown }
    expect(block.headline).toBe('A round worth travelling for')
    const image = page!.ctx.media(block.image)
    expect(image?.alt).toBe('The 18th green')
    expect(image?.srcSet).toContain('640w')
    expect(page!.ctx.link(block.primaryButton)).toEqual({
      label: 'Visit',
      link: { kind: 'url', href: 'https://example.com' },
    })
  })

  it("refuses club B's photo or page in a hero", async () => {
    const error = await w.payload
      .update({
        collection: 'pages',
        id: w.pageA.id,
        data: {
          layout: [
            hero({
              image: w.mediaB.id,
              primaryButton: { label: 'B', type: 'page', page: w.pageB.id },
            }),
          ],
        } as never,
        ...asEditorA(),
      })
      .catch((e: unknown) => e)
    expect(errorPaths(error)).toEqual(
      expect.arrayContaining(['layout.0.image', 'layout.0.primaryButton.page']),
    )
    expect(JSON.stringify(error)).not.toContain('Club B')
  })

  it('a video hero needs a video', async () => {
    await expect(
      w.payload.update({
        collection: 'pages',
        id: w.pageA.id,
        data: { layout: [hero({ mediaType: 'video' })] } as never,
        ...asEditorA(),
      }),
    ).rejects.toThrow()
  })

  it("the public page ignores club B's photo even if one got into the database", async () => {
    await w.payload.db.drizzle.execute(
      sql`UPDATE pages_blocks_hero SET image_id = ${w.mediaB.id} WHERE _parent_id = ${w.pageA.id}`,
    )
    const page = await loadClubPage(w.clubA.id, 'membership')
    expect(page!.ctx.media((page!.layout[0] as { image?: unknown }).image)).toBeNull()
  })
})
