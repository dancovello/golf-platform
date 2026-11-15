import { sql } from '@payloadcms/db-postgres'
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

  it('the course-status age follows the course check, not edits to planned notices (G4)', async () => {
    const status = await w.payload.findByID({
      collection: 'course-status',
      id: w.statusA.id,
      overrideAccess: true,
    })
    // Checked two days ago; a notice was edited just now (which keeps the old check time).
    await w.payload.db.drizzle.execute(
      sql`UPDATE course_status SET state_changed_at = now() - interval '2 days' WHERE id = ${status.id}`,
    )
    expect((await clubHomeData(w.payload, w.clubA.id))?.courseStatus?.stale).toBe(true)
  })

  it('the attention list holds only this club’s things', async () => {
    const club = await w.payload.create({ collection: 'tenants', data: { name: 'Attention Club' } })
    const other = await w.payload.create({ collection: 'tenants', data: { name: 'Other Club' } })
    const ended = {
      blockType: 'rateTable',
      style: 'classic',
      heading: 'Green fees',
      columns: [{ label: 'Weekday' }],
      tabs: [
        {
          label: 'Summer',
          sections: [
            {
              rows: [{ label: 'Visitor', price1: '£90' }],
              validFrom: '2026-04-01T00:00:00.000Z',
              validUntil: '2026-10-31T00:00:00.000Z',
            },
          ],
        },
      ],
    }
    await w.payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Fees',
        slug: 'fees',
        tenant: club.id,
        layout: [ended],
      } as never,
    })
    await w.payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Other fees',
        slug: 'fees',
        tenant: other.id,
        layout: [ended],
      } as never,
    })
    // The club has used Events but has nothing coming up.
    await w.payload.create({
      collection: 'events',
      data: {
        title: 'Old do',
        status: 'published',
        category: 'social',
        booking: 'book',
        startsAt: new Date(Date.now() - 86_400_000).toISOString(),
        tenant: club.id,
      } as never,
    })
    const items = (await clubHomeData(w.payload, club.id))!.attention
    expect(items.some((i) => i.key.startsWith('prices-ended-'))).toBe(true)
    expect(items.some((i) => i.key === 'no-events')).toBe(true)
    expect(JSON.stringify(items)).not.toContain('Other fees')
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
