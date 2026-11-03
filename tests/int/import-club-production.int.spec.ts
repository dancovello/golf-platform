/** Building a NEW club on production (scripts/import-club.ts, docs/operations/club-import.md). */
import { beforeAll, describe, expect, it } from 'vitest'

import { ExistingClubError, importClub, removeImportedClub } from '@/import/clubImport'
import { parseDemoAddress } from '@/site/demo'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
}, 300_000)

const content = (slug: string) => ({
  name: `Import ${slug}`,
  slug,
  media: {},
  pages: [{ slug: 'home', title: 'Home', layout: [] }],
  settings: { footer: { email: 'hello@example.com', address: '1 Fairway Lane' } },
})

const club = async (slug: string) =>
  (
    await w.payload.find({
      collection: 'tenants',
      where: { slug: { equals: slug } },
      overrideAccess: true,
    })
  ).docs[0]

const pagesOf = async (id: number | string) =>
  (
    await w.payload.count({
      collection: 'pages',
      where: { tenant: { equals: id } },
      overrideAccess: true,
    })
  ).totalDocs

describe('importing onto production (only if new)', () => {
  it('builds a club that is not there yet, switched off as a demo', async () => {
    const result = await importClub(w.payload, content('prod-new'), '.', () => {}, {
      onlyIfNew: true,
    })
    expect(result).toMatchObject({ slug: 'prod-new', pages: 1, demo: null })
    const built = await club('prod-new')
    expect(built.demoEnabled).toBeFalsy()
    expect(built.demoToken).toBeFalsy()
  })

  it('switches the demo link on in the same step when asked', async () => {
    const result = await importClub(w.payload, content('prod-demo'), '.', () => {}, {
      onlyIfNew: true,
      demo: true,
    })
    const built = await club('prod-demo')
    expect(built.demoEnabled).toBe(true)
    expect(result.demo?.address).toBe(`/demo/prod-demo-${built.demoToken}`)
    expect(parseDemoAddress(result.demo!.address.replace('/demo/', ''))).toEqual({
      slug: 'prod-demo',
      token: built.demoToken,
    })
  })

  it('refuses a club that is already there and changes nothing in it', async () => {
    const before = await club('prod-new')
    const pages = await pagesOf(before.id)
    const other = { ...content('prod-new'), pages: [{ slug: 'x', title: 'X', layout: [] }] }
    await expect(
      importClub(w.payload, other, '.', () => {}, { onlyIfNew: true }),
    ).rejects.toBeInstanceOf(ExistingClubError)
    const after = await club('prod-new')
    expect(after.id).toBe(before.id)
    expect(await pagesOf(after.id)).toBe(pages)
  })

  it('refuses a club that already belongs to someone else', async () => {
    await expect(
      importClub(w.payload, content(w.clubA.slug!), '.', () => {}, { onlyIfNew: true }),
    ).rejects.toBeInstanceOf(ExistingClubError)
    expect(await club(w.clubA.slug!)).toMatchObject({ id: w.clubA.id })
  })

  it('never touches other clubs when it builds one', async () => {
    const aPages = await pagesOf(w.clubA.id)
    const bPages = await pagesOf(w.clubB.id)
    await importClub(w.payload, content('prod-third'), '.', () => {}, { onlyIfNew: true })
    expect(await pagesOf(w.clubA.id)).toBe(aPages)
    expect(await pagesOf(w.clubB.id)).toBe(bPages)
    expect(await pagesOf((await club('prod-third')).id)).toBe(1)
  })

  it('can remove a half-built club (what the command does if a run fails)', async () => {
    expect(await removeImportedClub(w.payload, 'prod-third')).toBe(true)
    expect(await club('prod-third')).toBeUndefined()
  })
})

describe('importing the usual way (staging and local)', () => {
  it('still replaces a club that has no accounts', async () => {
    await importClub(w.payload, content('stage-club'), '.', () => {})
    const first = await club('stage-club')
    await importClub(w.payload, content('stage-club'), '.', () => {})
    const second = await club('stage-club')
    expect(second.id).not.toBe(first.id)
  })
})
