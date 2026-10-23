/**
 * Uploads audit, 22 October 2026 (docs/security/audit-uploads.md).
 *
 * Tests marked `it.fails` prove an open finding: they pass while the problem exists, so they
 * don't block merging. When a fix lands, the test starts "failing" (the problem is gone):
 * change `it.fails` to `it` in the same pull request.
 */
import { createLocalReq, type PayloadRequest } from 'payload'
import sharp from 'sharp'
import { beforeAll, describe, expect, it } from 'vitest'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const asEditorA = () => ({ overrideAccess: false as const, user: w.editorA })

/** A real JPEG carrying the hidden details a phone adds: where and when it was taken. */
const phonePhoto = async () => {
  const data = await sharp({
    create: { width: 800, height: 600, channels: 3, background: '#5d7a52' },
  })
    .jpeg()
    .withExif({
      IFD0: { Make: 'TestPhone', Model: 'Model 12', Artist: 'Jane Member' },
      IFD3: {
        GPSLatitudeRef: 'N',
        GPSLatitude: '51/1 30/1 1234/100',
        GPSLongitudeRef: 'W',
        GPSLongitude: '0/1 7/1 3900/100',
      },
    })
    .toBuffer()
  return { data, mimetype: 'image/jpeg', name: 'phone-photo.jpg', size: data.length }
}

const hiddenDetails = async (url: string) => {
  const file = Buffer.from(await (await fetch(url)).arrayBuffer())
  const { exif } = await sharp(file).metadata()
  return exif ? exif.toString('latin1') : ''
}

describe('finding 1: photos keep their hidden location details', () => {
  it('(check) the test photo really carries a location and a name', async () => {
    const { data } = await phonePhoto()
    const { exif } = await sharp(data).metadata()
    expect(exif?.toString('latin1')).toContain('Jane Member')
  })

  it('(check) the smaller copies the site makes are already clean', async () => {
    const doc = await w.payload.create({
      collection: 'media',
      data: { alt: 'audit', tenant: w.clubA.id },
      file: await phonePhoto(),
      ...asEditorA(),
    })
    expect(doc.sizes?.w640?.url).toBeTruthy()
    expect(await hiddenDetails(doc.sizes!.w640!.url!)).toBe('')
    await w.payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
  })

  // OPEN FINDING (low): the original file is published as uploaded. Its public address is
  // used on the site (hero, gallery), so anyone can read where a photo was taken and the
  // name on the phone. Fix proposal in the report.
  it.fails('the published original has no location or owner details', async () => {
    const doc = await w.payload.create({
      collection: 'media',
      data: { alt: 'audit', tenant: w.clubA.id },
      file: await phonePhoto(),
      ...asEditorA(),
    })
    try {
      expect(await hiddenDetails(doc.url!)).toBe('')
    } finally {
      await w.payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
    }
  })
})

describe('finding 2: upload links have no limit', () => {
  /** Calls the real upload-link endpoint (with our guard around it) as club A's editor. */
  const askForLink = async (body: Record<string, unknown>) => {
    const endpoint = w.payload.config.endpoints.find(
      (e) => e.path === '/storage-s3-generate-signed-url',
    )
    if (!endpoint) throw new Error('upload-link endpoint not found')
    const req = (await createLocalReq({ user: w.editorA }, w.payload)) as PayloadRequest
    req.json = async () => body
    try {
      return (await endpoint.handler(req)) as Response
    } catch (error) {
      return new Response(null, { status: (error as { status?: number }).status ?? 500 })
    }
  }

  it('(check) an editor gets a link for an allowed photo', async () => {
    const res = await askForLink({
      collectionSlug: 'media',
      filename: 'green.png',
      mimeType: 'image/png',
      filesize: 50 * 1024 * 1024,
    })
    expect(res.status).toBe(200)
  })

  // OPEN FINDING (low): one editor account can ask for any number of 50 MB upload links. Each
  // file lands in the public bucket and stays there until the nightly clean-up (production
  // only; never on staging). 150 links in a row should hit a limit.
  it.fails('an editor cannot get 150 upload links in a row', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 150; i++) {
      const res = await askForLink({
        collectionSlug: 'media',
        filename: `flood-${i}.png`,
        mimeType: 'image/png',
        filesize: 50 * 1024 * 1024,
      })
      statuses.push(res.status)
    }
    // Counts links issued, so a server error can't pass for a limit.
    expect(statuses.filter((s) => s === 200).length).toBeLessThan(150)
  })
})
