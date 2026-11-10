/**
 * Deleted club content in the audit log (src/audit/content.ts, audit fix plan step 12b).
 */
import type { Payload } from 'payload'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'

import { course, enquiry, event, seedWorld, type World } from './helpers/seed'

let w: World
let p: Payload

beforeAll(async () => {
  w = await seedWorld()
  p = w.payload
})

beforeEach(async () => {
  await p.delete({ collection: 'audit-log', where: { id: { exists: true } } })
})

const entries = async (action = 'content-deleted') =>
  (
    await p.find({
      collection: 'audit-log',
      where: { action: { equals: action } },
      sort: 'createdAt',
      limit: 100,
      pagination: false,
      overrideAccess: true,
    })
  ).docs

const page = (title: string, tenant: string, slug: string) =>
  p.create({
    collection: 'pages',
    data: { title, slug, tenant, _status: 'draft' } as never,
    overrideAccess: true,
  })

describe('deleted club content', () => {
  it('records who deleted what, from which club, and only its name', async () => {
    const aPage = await page('Audit page', w.clubA.id, 'audit-page')
    const anEvent = await event(p, 'Audit open day', w.clubA.id)
    await p.delete({
      collection: 'pages',
      id: aPage.id,
      overrideAccess: false,
      user: w.editorA,
    })
    await p.delete({
      collection: 'events',
      id: anEvent.id,
      overrideAccess: false,
      user: w.editorA,
    })
    expect(await entries()).toMatchObject([
      {
        target: 'Page: Audit page',
        actorEmail: 'editor-a@example.com',
        actorRole: 'editor',
        clubId: w.clubA.id,
        clubName: w.clubA.name,
      },
      { target: 'Event: Audit open day', clubId: w.clubA.id },
    ])
  })

  it('names an enquiry by its reference, never by the visitor or their message', async () => {
    const made = await enquiry(p, 'Private Person', w.clubA.id)
    await p.delete({ collection: 'enquiries', id: made.id, overrideAccess: false, user: w.editorA })
    const [entry] = await entries()
    expect(entry!.target).toBe(`Enquiry: ${made.reference}`)
    expect(JSON.stringify(entry)).not.toContain('Private Person')
    expect(JSON.stringify(entry)).not.toContain('visitor@example.com')
  })

  it('records each club separately', async () => {
    const bCourse = await course(p, 'Audit nine', w.clubB.id)
    await p.delete({
      collection: 'courses',
      id: bCourse.id,
      overrideAccess: false,
      user: w.editorB,
    })
    expect(await entries()).toMatchObject([
      { target: 'Course: Audit nine', clubId: w.clubB.id, clubName: w.clubB.name },
    ])
  })

  it('leaves out what no signed-in person did: scripts and scheduled jobs', async () => {
    const made = await event(p, 'Cleaned up', w.clubA.id)
    await p.delete({ collection: 'events', id: made.id, overrideAccess: true })
    expect(await entries()).toEqual([])
  })

  it('deleting a whole club is one "club deleted" entry, not one per item', async () => {
    const club = await p.create({
      collection: 'tenants',
      data: { name: 'Audit Delete Club' },
      overrideAccess: true,
      user: w.superAdmin,
    })
    await page('Goes with the club', club.id, 'goes-with-club')
    await event(p, 'Goes too', club.id)
    await p.delete({ collection: 'tenants', id: club.id, overrideAccess: true, user: w.superAdmin })
    expect(await entries()).toEqual([])
    expect(await entries('club-deleted')).toMatchObject([
      { target: 'Audit Delete Club', actorRole: 'super-admin' },
    ])
  })
})
