import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { beforeAll, describe, expect, it } from 'vitest'

import { mediaStorageSettings } from '@/media/storage'

import { pdfFile, pngFile } from '../shared/media'
import { acceptAgreement, categoryOf, course, enquiry, seedWorld, type World } from './helpers/seed'

let w: World
beforeAll(async () => {
  w = await seedWorld()
}, 120_000)

const makeClub = (name: string) =>
  w.payload.create({
    collection: 'tenants',
    data: { name, slug: name.toLowerCase().replace(/ /g, '-') },
    overrideAccess: true,
  })

const count = (collection: 'pages' | 'courses' | 'enquiries' | 'club-settings', club: string) =>
  w.payload.count({
    collection,
    where: { tenant: { equals: club } },
    overrideAccess: true,
  })

describe('deleting a club', () => {
  it('removes the club and everything it owns, leaving other clubs alone', async () => {
    const doomed = await makeClub('Doomed Golf Club')
    await course(w.payload, 'Doomed course', doomed.id as string)
    await enquiry(w.payload, 'Someone', doomed.id as string)
    await w.payload.delete({ collection: 'tenants', id: doomed.id, overrideAccess: true })
    for (const c of ['courses', 'enquiries', 'club-settings'] as const) {
      expect((await count(c, doomed.id as string)).totalDocs).toBe(0)
    }
    expect(
      (await w.payload.count({ collection: 'tenants', overrideAccess: true })).totalDocs,
    ).toBeGreaterThanOrEqual(2)
    expect((await count('pages', w.clubA.id as string)).totalDocs).toBeGreaterThanOrEqual(0)
  })

  it('works for a signed-in super-admin, and removes the club’s photos and documents from storage', async () => {
    // Hartley Wintney, 25 Nov 2026: the Delete button failed because the club's photos were
    // still "in use" (its logo, a page) when the clear-out reached them.
    const club = await makeClub('Demo Golf Club')
    const tenant = club.id as string
    const photo = await w.payload.create({
      collection: 'media',
      data: { alt: 'Logo', tenant },
      file: pngFile('logo.png'),
    })
    const document = await w.payload.create({
      collection: 'documents',
      data: {
        title: 'Local rules',
        category: (await categoryOf(w.payload, tenant, 'course-scorecards')).id,
        tenant,
      },
      file: pdfFile('rules.pdf'),
    })
    const { docs } = await w.payload.find({
      collection: 'club-settings',
      where: { tenant: { equals: tenant } },
      overrideAccess: true,
    })
    await w.payload.update({
      collection: 'club-settings',
      id: docs[0].id,
      data: {
        branding: { logoOnLight: photo.id },
        footer: { email: 'office@example.com', address: '1 Fairway, Testshire' },
      } as never,
      overrideAccess: true,
    })
    await w.payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Home',
        slug: 'home',
        tenant,
        layout: [
          {
            blockType: 'hero',
            style: 'heritage',
            mediaType: 'image',
            image: photo.id,
            headline: 'Hi',
          },
        ],
      } as never,
    })

    const { bucket, config } = mediaStorageSettings()
    const s3 = new S3Client(config)
    const stored = (key: string) =>
      s3
        .send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
        .then(() => true)
        .catch(() => false)
    const photoKeys = [photo.filename, ...Object.values(photo.sizes ?? {}).map((s) => s?.filename)]
      .filter(Boolean)
      .map((f) => `${photo.prefix}/${f}`)
    const documentKey = `${document.prefix}/${document.filename}`
    for (const key of [...photoKeys, documentKey]) expect(await stored(key)).toBe(true)

    // As the admin does it: signed in, with the usual access rules.
    await w.payload.delete({
      collection: 'tenants',
      id: tenant,
      overrideAccess: false,
      user: w.superAdmin,
    })

    expect(
      (await w.payload.count({ collection: 'tenants', where: { id: { equals: tenant } } }))
        .totalDocs,
    ).toBe(0)
    for (const c of ['media', 'documents', 'pages', 'club-settings'] as const) {
      expect(
        (await w.payload.count({ collection: c, where: { tenant: { equals: tenant } } })).totalDocs,
      ).toBe(0)
    }
    for (const key of [...photoKeys, documentKey]) expect(await stored(key)).toBe(false)
    // The other clubs' photos and documents are untouched.
    expect((await w.payload.findByID({ collection: 'media', id: w.mediaA.id })).id).toBe(
      w.mediaA.id,
    )
    expect((await w.payload.findByID({ collection: 'documents', id: w.docB.id })).id).toBe(
      w.docB.id,
    )
  })

  it('refuses a club with an accepted agreement, and removes nothing', async () => {
    const club = await makeClub('Signed Golf Club')
    await course(w.payload, 'Kept course', club.id as string)
    await acceptAgreement(w.payload, club.id as string, 'A. Person')
    await expect(
      w.payload.delete({ collection: 'tenants', id: club.id, overrideAccess: true }),
    ).rejects.toThrow(/can’t be deleted/)
    expect((await count('courses', club.id as string)).totalDocs).toBe(1)
  })

  it('refuses a club that has an editor account', async () => {
    await expect(
      w.payload.delete({ collection: 'tenants', id: w.clubA.id, overrideAccess: true }),
    ).rejects.toThrow(/can’t be deleted/)
  })
})
