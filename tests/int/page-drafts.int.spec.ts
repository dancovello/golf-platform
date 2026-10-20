import { beforeAll, describe, expect, it } from 'vitest'

import { loadClubBySlug, loadClubPage } from '@/site/loadClub'

import { seedWorld, type World } from './helpers/seed'

let w: World
const asEditor = (user: World['editorA']) => ({ user, overrideAccess: false as const })

beforeAll(async () => {
  w = await seedWorld()
  // Club A: a published page with an unpublished edit, and a page never published.
  await w.payload.update({
    collection: 'pages',
    id: w.pageA.id,
    data: { title: 'Membership (draft edit)' },
    draft: true,
    ...asEditor(w.editorA),
  })
  await w.payload.create({
    collection: 'pages',
    data: { title: 'Secret plans', slug: 'secret-plans', tenant: w.clubA.id, parent: w.pageA.id },
    draft: true,
    ...asEditor(w.editorA),
  })
  // Club B: a draft edit too, so there is history in both clubs.
  await w.payload.update({
    collection: 'pages',
    id: w.pageB.id,
    data: { title: 'Club B draft' },
    draft: true,
    ...asEditor(w.editorB),
  })
})

describe('page drafts', () => {
  it('visitors see the published page, not the newer draft', async () => {
    expect((await loadClubPage(w.clubA.id, 'membership'))?.title).toBe('Membership (Club A)')
  })

  it('the live preview shows the latest draft', async () => {
    expect((await loadClubPage(w.clubA.id, 'membership', { draft: true }))?.title).toBe(
      'Membership (draft edit)',
    )
    expect((await loadClubPage(w.clubA.id, 'secret-plans', { draft: true }))?.title).toBe(
      'Secret plans',
    )
  })

  it('a page never published is not on the site, in its menus or in its footer', async () => {
    expect(await loadClubPage(w.clubA.id, 'secret-plans')).toBeNull()
    await w.payload.update({
      collection: 'club-settings',
      id: w.settingsA.id,
      data: {
        header: {
          style: 'classic',
          menu: [{ label: 'More', kind: 'children', page: w.pageA.id, includeParent: true }],
        },
      } as never,
      overrideAccess: true,
    })
    const club = await loadClubBySlug(String(w.clubA.slug))
    expect(JSON.stringify(club?.header.menu)).not.toContain('secret-plans')
  })
})

describe('page history stays inside each club', () => {
  it("club A's editor sees only club A's versions", async () => {
    const { docs } = await w.payload.findVersions({
      collection: 'pages',
      limit: 100,
      depth: 0,
      ...asEditor(w.editorA),
    })
    expect(docs.length).toBeGreaterThan(0)
    const tenants = new Set(docs.map((v) => String((v.version as { tenant?: unknown }).tenant)))
    expect([...tenants]).toEqual([String(w.clubA.id)])
  })

  it("club B's versions look like they don't exist to club A's editor", async () => {
    const { docs } = await w.payload.findVersions({
      collection: 'pages',
      where: { parent: { equals: w.pageB.id } },
      overrideAccess: true,
    })
    expect(docs.length).toBeGreaterThan(0)
    await expect(
      w.payload.findVersionByID({ collection: 'pages', id: docs[0].id, ...asEditor(w.editorA) }),
    ).rejects.toThrow()
    await expect(
      w.payload.restoreVersion({ collection: 'pages', id: docs[0].id, ...asEditor(w.editorA) }),
    ).rejects.toThrow()
  })

  it('visitors see no history at all', async () => {
    await expect(
      w.payload.findVersions({ collection: 'pages', overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('deleting a page deletes its history', async () => {
    const page = await w.payload.create({
      collection: 'pages',
      data: { title: 'Short-lived', slug: 'short-lived', tenant: w.clubA.id, _status: 'published' },
      overrideAccess: true,
    })
    await w.payload.update({
      collection: 'pages',
      id: page.id,
      data: { title: 'Edit' },
      draft: true,
      overrideAccess: true,
    })
    await w.payload.delete({ collection: 'pages', id: page.id, overrideAccess: true })
    const { totalDocs } = await w.payload.findVersions({
      collection: 'pages',
      where: { parent: { equals: page.id } },
      overrideAccess: true,
    })
    expect(totalDocs).toBe(0)
  })
})
