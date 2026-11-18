import { beforeAll, describe, expect, it } from 'vitest'

import { pngFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })
const upload = (name: string) =>
  w.payload.create({
    collection: 'media',
    data: { alt: name, tenant: w.clubA.id },
    file: pngFile(`${name}.png`),
  })

describe('deleting a photo that is still used (QA-27)', () => {
  it('refuses, names the page, and allows it once the page no longer uses it', async () => {
    const photo = await upload('in-use')
    const page = await w.payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Hero page',
        slug: 'hero-page',
        tenant: w.clubA.id,
        layout: [
          {
            blockType: 'hero',
            style: 'heritage',
            mediaType: 'image',
            image: photo.id,
            headline: 'Hello',
          },
        ],
      } as never,
    })

    const refused = await w.payload
      .delete({ collection: 'media', id: photo.id, ...asEditorA() })
      .then(
        () => null,
        (e: Error) => e,
      )
    expect(refused?.message).toContain('still used')
    expect(refused?.message).toContain('Hero page')
    // The photo is still there.
    expect((await w.payload.findByID({ collection: 'media', id: photo.id })).id).toBe(photo.id)

    // The photo's own screen says where it is used.
    const shown = await w.payload.findByID({ collection: 'media', id: photo.id, ...asEditorA() })
    expect((shown as { usedOn?: string }).usedOn).toContain('Hero page')

    const other = await upload('replacement')
    await w.payload.update({
      collection: 'pages',
      id: page.id,
      data: {
        _status: 'published',
        layout: [
          {
            blockType: 'hero',
            style: 'heritage',
            mediaType: 'image',
            image: other.id,
            headline: 'Hello',
          },
        ],
      } as never,
    })
    await w.payload.delete({ collection: 'media', id: photo.id, ...asEditorA() })
  })

  it('deletes a photo nothing uses', async () => {
    const photo = await upload('unused')
    await w.payload.delete({ collection: 'media', id: photo.id, ...asEditorA() })
  })
})
