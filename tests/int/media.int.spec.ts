import { beforeAll, describe, expect, it } from 'vitest'

import { mediaStorageSettings } from '@/media/storage'

import { pngFile } from '../shared/media'
import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const { publicURL } = mediaStorageSettings()
const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })

const errorOf = (fn: () => Promise<unknown>) =>
  fn().then(
    () => null,
    (e: unknown) => e as Error,
  )

describe('photo storage', () => {
  it('stores each file in its own random folder, at a public address', async () => {
    expect(w.mediaA.prefix).toMatch(/^media\/[0-9a-f-]{36}$/)
    expect(w.mediaA.url).toBe(`${publicURL}/${w.mediaA.prefix}/${w.mediaA.filename}`)
    const res = await fetch(w.mediaA.url!)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
  })

  it('the storage itself cannot be listed', async () => {
    expect((await fetch(`${publicURL}/`)).ok).toBe(false)
    expect((await fetch(`${publicURL}/?list-type=2`)).ok).toBe(false)
  })

  it('the same file name in two clubs never clashes (no hint the other club exists)', () => {
    // Both clubs uploaded "photo.png"; each gets its own random code, never a "-1".
    for (const m of [w.mediaA, w.mediaB]) expect(m.filename).toMatch(/^[0-9a-z]{6}-photo\.png$/)
    expect(w.mediaA.filename).not.toBe(w.mediaB.filename)
  })

  it('checks what a file really is, not what it is called', async () => {
    const html = Buffer.from('<html><script>alert(1)</script></html>')
    const error = await errorOf(() =>
      w.payload.create({
        collection: 'media',
        data: { alt: 'disguised', tenant: w.clubA.id },
        file: pngFile('innocent.png', html),
        ...asEditorA(),
      }),
    )
    expect(error).not.toBeNull()
  })

  it('refuses SVG files, which can carry code', async () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>')
    const error = await errorOf(() =>
      w.payload.create({
        collection: 'media',
        data: { alt: 'svg', tenant: w.clubA.id },
        file: { data: svg, mimetype: 'image/svg+xml', name: 'logo.svg', size: svg.length },
        ...asEditorA(),
      }),
    )
    expect(error).not.toBeNull()
  })

  it("an editor cannot point a file at club B's folder", async () => {
    const onCreate = await errorOf(() =>
      w.payload.create({
        collection: 'media',
        data: { alt: 'borrowed', tenant: w.clubA.id, prefix: w.mediaB.prefix },
        file: pngFile('photo.png'),
        ...asEditorA(),
      }),
    )
    expect(onCreate).not.toBeNull()

    await w.payload.update({
      collection: 'media',
      id: w.mediaA.id,
      data: { prefix: w.mediaB.prefix } as never,
      ...asEditorA(),
    })
    const after = await w.payload.findByID({ collection: 'media', id: w.mediaA.id })
    expect(after.prefix).toBe(w.mediaA.prefix)
  })

  it("deleting club A's file removes only club A's file", async () => {
    const extra = await w.payload.create({
      collection: 'media',
      data: { alt: 'temporary', tenant: w.clubA.id },
      file: pngFile('photo.png'),
      ...asEditorA(),
    })
    expect((await fetch(extra.url!)).status).toBe(200)
    await w.payload.delete({ collection: 'media', id: extra.id, ...asEditorA() })
    expect((await fetch(extra.url!)).status).not.toBe(200)
    expect((await fetch(w.mediaB.url!)).status).toBe(200)
  })
})
