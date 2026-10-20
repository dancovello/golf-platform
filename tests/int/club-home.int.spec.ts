import { beforeAll, describe, expect, it } from 'vitest'

import { allClubsProgress, clubHomeData } from '@/admin/clubSetup'

import { seedWorld, type World } from './helpers/seed'

// The club home screen's data (plan part E): built only from the club's own records.

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const enquiry = (tenant: string, name: string) =>
  w.payload.create({
    collection: 'enquiries',
    data: {
      reference: `HOME-${name}`,
      purpose: 'general',
      name,
      email: 'visitor@example.com',
      message: 'Hello',
      status: 'new',
      tenant,
    },
    overrideAccess: true,
  })

describe('club home screen', () => {
  it("shows a club's own new messages and nothing of another club's", async () => {
    await enquiry(w.clubA.id, 'Alice from A')
    await enquiry(w.clubB.id, 'Bob from B')
    const a = await clubHomeData(w.payload, w.clubA.id)
    expect(a?.enquiries.map((e) => e.name)).toContain('Alice from A')
    expect(JSON.stringify(a)).not.toContain('Bob from B')
    expect(JSON.stringify(a)).not.toContain(w.clubB.name)
    expect(a?.newEnquiries).toBeGreaterThanOrEqual(1)
  })

  it('the checklist follows what the club has actually done', async () => {
    const club = await w.payload.create({ collection: 'tenants', data: { name: 'Fresh Club' } })
    const before = await clubHomeData(w.payload, club.id)
    expect(before?.steps.find((s) => s.key === 'home')?.done).toBe(false)
    expect(before?.steps.find((s) => s.key === 'colours')?.done).toBe(false)
    expect(before?.steps.find((s) => s.key === 'agreement')?.done).toBe(false)

    await w.payload.create({
      collection: 'pages',
      data: { _status: 'published', title: 'Home', slug: 'home', tenant: club.id },
    })
    const after = await clubHomeData(w.payload, club.id)
    expect(after?.steps.find((s) => s.key === 'home')?.done).toBe(true)
    expect(after?.doneCount).toBe((before?.doneCount ?? 0) + 1)
  })

  it('says when the course status is out of date', async () => {
    const tomorrow = new Date(Date.now() + 25 * 60 * 60 * 1000)
    expect((await clubHomeData(w.payload, w.clubA.id))?.courseStatus?.stale).toBe(false)
    expect((await clubHomeData(w.payload, w.clubA.id, tomorrow))?.courseStatus?.stale).toBe(true)
  })

  it('an unknown club shows nothing', async () => {
    expect(await clubHomeData(w.payload, '00000000-0000-4000-8000-000000000000')).toBeNull()
  })

  it("lists every club's progress for the super-admin", async () => {
    const clubs = await allClubsProgress(w.payload)
    expect(clubs.map((c) => c.name)).toEqual(expect.arrayContaining([w.clubA.name, w.clubB.name]))
    for (const c of clubs) expect(c.total).toBe(6)
  })
})
