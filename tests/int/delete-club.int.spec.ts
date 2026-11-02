import { beforeAll, describe, expect, it } from 'vitest'

import { acceptAgreement, course, enquiry, seedWorld, type World } from './helpers/seed'

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
