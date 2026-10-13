import { beforeAll, describe, expect, it } from 'vitest'

import { loadClubBySlug } from '@/site/loadClub'
import { DEFAULT_BRAND } from '@/theme/colour'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const updateBranding = (branding: Record<string, string>, user = w.editorA) =>
  w.payload.update({
    collection: 'club-settings',
    id: w.settingsA.id,
    data: { branding } as never,
    user,
    overrideAccess: false,
  })

describe('club short names', () => {
  it('a new club gets one from its name', () => {
    expect(w.clubA.slug).toBe('test-club-a')
    expect(w.clubB.slug).toBe('test-club-b')
  })

  it('two clubs cannot share one', async () => {
    await expect(
      w.payload.create({ collection: 'tenants', data: { name: 'Another', slug: 'test-club-a' } }),
    ).rejects.toThrow()
  })

  it('refuses anything that is not lower-case letters, numbers and dashes', async () => {
    await expect(
      w.payload.create({ collection: 'tenants', data: { name: 'Bad', slug: 'Bad Name/..' } }),
    ).rejects.toThrow()
  })
})

describe('club branding', () => {
  it('a new club starts with the default colours and font set', () => {
    expect(w.settingsA.branding).toMatchObject({ ...DEFAULT_BRAND, fontSet: 'heritage' })
  })

  it('an editor can change their own club’s colours and font set', async () => {
    const saved = await updateBranding({ accent: '#C9A13B', fontSet: 'editorial' })
    expect(saved.branding).toMatchObject({ accent: '#C9A13B', fontSet: 'editorial' })
  })

  it('refuses a colour that is not a six-digit colour code', async () => {
    for (const bad of ['red', '#fff', '#1B2A22;}body{display:none}']) {
      await expect(updateBranding({ primary: bad }), bad).rejects.toThrow()
    }
  })

  it('refuses colours that would make text hard to read, and says which', async () => {
    const error = await updateBranding({ dark: '#B0B0B0' }).catch((e: unknown) => e)
    const errors = (error as { data?: { errors?: { path: string; message: string }[] } }).data
      ?.errors
    expect(errors).toContainEqual({
      path: 'branding.dark',
      message: expect.stringMatching(/^Dark text on the Light background would be hard to read/),
    })
  })

  it('an editor cannot change another club’s branding', async () => {
    await expect(
      w.payload.update({
        collection: 'club-settings',
        id: w.settingsB.id,
        data: { branding: { accent: '#000000' } } as never,
        user: w.editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })
})

describe('public site loader', () => {
  it('returns only the requested club’s name and branding', async () => {
    await w.payload.update({
      collection: 'club-settings',
      id: w.settingsB.id,
      data: { branding: { accent: '#C9A13B' } } as never,
      overrideAccess: true,
    })
    const a = await loadClubBySlug('test-club-a')
    const b = await loadClubBySlug('test-club-b')
    expect(a).toMatchObject({ tenantID: w.clubA.id, name: 'Test Club A' })
    expect(b).toMatchObject({ tenantID: w.clubB.id, name: 'Test Club B' })
    expect(JSON.stringify(a)).not.toContain(w.clubB.id)
    expect(JSON.stringify(a)).not.toContain('Test Club B')
  })

  it('returns nothing for an unknown club', async () => {
    expect(await loadClubBySlug('no-such-club')).toBeNull()
  })
})

describe('announcement bar', () => {
  const setAnnouncement = (announcement: Record<string, unknown>, user = w.editorA) =>
    w.payload.update({
      collection: 'club-settings',
      id: w.settingsA.id,
      data: { announcement } as never,
      user,
      overrideAccess: false,
    })
  const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString()

  it('shows only notices between their start and end dates', async () => {
    await setAnnouncement({
      style: 'rotator',
      tone: 'brand',
      items: [
        { message: 'Finished', expiresAt: day(-2) },
        { message: 'Not yet', startsAt: day(2), expiresAt: day(5) },
        { message: 'Last day today', expiresAt: day(0) },
      ],
    })
    const club = await loadClubBySlug('test-club-a')
    expect(club?.announcement?.items.map((i) => i.message)).toEqual(['Last day today'])
  })

  it("refuses a link to club B's page", async () => {
    const error = await setAnnouncement({
      style: 'classic',
      tone: 'brand',
      items: [
        { message: 'Hi', expiresAt: day(3), link: { label: 'B', type: 'page', page: w.pageB.id } },
      ],
    }).catch((e: unknown) => e)
    const paths = ((error as { data?: { errors?: { path: string }[] } }).data?.errors ?? []).map(
      (x) => x.path,
    )
    expect(paths).toContain('announcement.items.0.link.page')
  })

  it('style C shows the course status and phone even with no notice', async () => {
    await setAnnouncement({ style: 'utility', tone: 'brand', showStatus: true, items: [] })
    const club = await loadClubBySlug('test-club-a')
    expect(club?.announcement).toMatchObject({
      items: [],
      status: { state: 'open', label: 'Course open' },
    })
  })
})
