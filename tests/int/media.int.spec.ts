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

  const svgFile = (svg: string) => {
    const data = Buffer.from(svg)
    return { data, mimetype: 'image/svg+xml', name: 'logo.svg', size: data.length }
  }
  const uploadSvg = (svg: string) =>
    errorOf(() =>
      w.payload.create({
        collection: 'media',
        data: { alt: 'svg', tenant: w.clubA.id },
        file: svgFile(svg),
        ...asEditorA(),
      }),
    )
  const NS = 'xmlns="http://www.w3.org/2000/svg"'

  it('accepts a plain SVG logo', async () => {
    const svg = `<svg ${NS} viewBox="0 0 10 10"><defs><linearGradient id="g"><stop offset="0" stop-color="#000"/></linearGradient></defs><path d="M0 0h10v10z" fill="url(#g)"/></svg>`
    expect(await uploadSvg(svg)).toBeNull()
  })

  it.each([
    ['a script', `<svg ${NS}><script>alert(1)</script></svg>`],
    ['an event handler', `<svg ${NS} onload="alert(1)"><path d="M0 0"/></svg>`],
    [
      'an embedded web page',
      `<svg ${NS}><foreignObject><iframe src="https://x.test"/></foreignObject></svg>`,
    ],
    ['an outside image link', `<svg ${NS}><image href="https://x.test/p.png"/></svg>`],
    ['a javascript link', `<svg ${NS}><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>`],
    ['an outside stylesheet', `<svg ${NS}><style>@import url(https://x.test/a.css);</style></svg>`],
    ['an outside fill', `<svg ${NS}><path fill="url(https://x.test/a)" d="M0 0"/></svg>`],
    [
      'an HTML-namespace element',
      `<svg ${NS}><div xmlns="http://www.w3.org/1999/xhtml"><img src="x" onerror="alert(1)"/></div></svg>`,
    ],
    ['a CDATA block', `<svg ${NS}><style><![CDATA[a{}]]></style></svg>`],
    ['broken XML', `<svg ${NS}><path></svg>`],
    ['an entity', `<!DOCTYPE svg [<!ENTITY a "b">]><svg ${NS}/>`],
  ])('refuses an SVG with %s', async (_name, svg) => {
    expect(await uploadSvg(svg)).not.toBeNull()
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
