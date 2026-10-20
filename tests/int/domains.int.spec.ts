import { beforeAll, describe, expect, it } from 'vitest'

import { findClubByHost } from '@/site/resolveSite'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const messageOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    return JSON.stringify((error as { data?: unknown }).data ?? (error as Error).message)
  }
  return null
}

describe('club web addresses (build step 4)', () => {
  it('finds the club that owns an address, and its main address', async () => {
    expect(await findClubByHost('club-a.localhost')).toEqual({
      slug: w.clubA.slug,
      mainHost: 'club-a.localhost',
    })
    expect(await findClubByHost('old-club-a.localhost')).toEqual({
      slug: w.clubA.slug,
      mainHost: 'club-a.localhost',
    })
    expect(await findClubByHost('club-b.localhost')).toMatchObject({ slug: w.clubB.slug })
    expect(await findClubByHost('nobody.localhost')).toBeNull()
  })

  it('the database refuses a second club with the same address', async () => {
    const clash = await messageOf(() =>
      w.payload.create({
        collection: 'tenants',
        data: { name: 'Copycat Club', domains: [{ hostname: 'club-a.localhost' }] },
      }),
    )
    expect(clash).not.toBeNull()
    expect((await findClubByHost('club-a.localhost'))?.slug).toBe(w.clubA.slug)
  })

  it('saves addresses bare and refuses ones a club can never have', async () => {
    const club = await w.payload.create({
      collection: 'tenants',
      data: { name: 'Tidy Club', domains: [{ hostname: ' HTTPS://WWW.Tidy-Club.co.uk/ ' }] },
    })
    expect(club.domains?.[0]?.hostname).toBe('www.tidy-club.co.uk')
    for (const hostname of ['localhost', 'golf.vercel.app', 'not an address']) {
      expect(
        await messageOf(() =>
          w.payload.update({
            collection: 'tenants',
            id: club.id,
            data: { domains: [{ hostname }] },
          }),
        ),
        hostname,
      ).not.toBeNull()
    }
  })

  it("a club editor can't change their club's addresses", async () => {
    const result = await messageOf(() =>
      w.payload.update({
        collection: 'tenants',
        id: w.clubA.id,
        data: { domains: [{ hostname: 'hijack.localhost' }] },
        user: w.editorA,
        overrideAccess: false,
      }),
    )
    expect(result).not.toBeNull()
    expect(await findClubByHost('hijack.localhost')).toBeNull()
  })
})
