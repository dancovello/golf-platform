/**
 * The data processing agreement (src/agreement): a club's editors can't save its settings
 * until the club has accepted the current version, and acceptance records can't be changed
 * or deleted by anyone.
 */
import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { clubHasAccepted } from '@/agreement/acceptance'
import { AGREEMENT_VERSION } from '@/agreement/text'

import { allowAccountCreation } from '@/access/accountCreation'

import { asUser, enrolTwoFactor, PASSWORD, seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const errorOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    return error as { message?: string; status?: number }
  }
  return null
}

/** A new club with an editor, where nobody has accepted the agreement yet. */
const newClub = async (name: string) => {
  const club = await w.payload.create({ collection: 'tenants', data: { name } })
  const { docs } = await w.payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: club.id } },
  })
  const created = await w.payload.create({
    collection: 'users',
    data: {
      email: `editor@${club.slug}.example`,
      password: PASSWORD,
      role: 'editor',
      tenant: club.id,
    },
    context: allowAccountCreation,
  })
  await enrolTwoFactor(w.payload, created.id)
  return { club, settings: docs[0]!, editor: await asUser(w.payload, created.id) }
}

describe('saving Club Settings needs the agreement', () => {
  it("refuses an editor's save until the club accepts, then allows it", async () => {
    const { club, settings, editor } = await newClub('Not Yet Signed')
    const save = () =>
      w.payload.update({
        collection: 'club-settings',
        id: settings.id,
        data: { clubName: 'Renamed', footer: { email: 'a@b.example', address: '1 Lane' } },
        overrideAccess: false,
        user: editor,
      })

    const refused = await errorOf(save)
    expect(refused?.status).toBe(403)
    expect(refused?.message).toMatch(/accept the data processing agreement/)

    await w.payload.create({
      collection: 'agreement-acceptances',
      data: {
        fullName: 'Sam Secretary',
        jobTitle: 'Club Secretary',
        authorised: true,
        tenant: club.id,
      },
      overrideAccess: false,
      user: editor,
    })
    expect(await clubHasAccepted(w.payload, club.id)).toBe(true)
    expect((await save()).clubName).toBe('Renamed')
  })

  it('the super-admin can still set up a club that has not accepted', async () => {
    const { settings } = await newClub('Set Up First')
    const saved = await w.payload.update({
      collection: 'club-settings',
      id: settings.id,
      data: { clubName: 'Set up by Dan', footer: { email: 'a@b.example', address: '1 Lane' } },
      overrideAccess: false,
      user: w.superAdmin,
    })
    expect(saved.clubName).toBe('Set up by Dan')
  })

  it('an acceptance of an older version no longer counts', async () => {
    const { club } = await newClub('Old Version')
    await w.payload.create({
      collection: 'agreement-acceptances',
      data: { fullName: 'Old', jobTitle: 'Old', authorised: true, tenant: club.id },
    })
    await w.payload.db.drizzle.execute(
      sql`UPDATE agreement_acceptances SET version = 'older' WHERE tenant_id = ${club.id}`,
    )
    expect(await clubHasAccepted(w.payload, club.id)).toBe(false)
  })
})

describe('acceptance records', () => {
  it('record the version, account and time from the server, not the form', async () => {
    const { club, editor } = await newClub('Stamped')
    const record = await w.payload.create({
      collection: 'agreement-acceptances',
      data: {
        fullName: 'Pat Manager',
        jobTitle: 'General Manager',
        authorised: true,
        tenant: club.id,
        version: 'made-up',
        acceptedBy: w.superAdmin.id,
        acceptedAt: '2000-01-01T00:00:00.000Z',
      } as never,
      overrideAccess: false,
      user: editor,
    })
    expect(record.version).toBe(AGREEMENT_VERSION)
    const by = record.acceptedBy
    expect(typeof by === 'object' && by ? by.id : by).toBe(editor.id)
    expect(Date.now() - new Date(record.acceptedAt!).getTime()).toBeLessThan(60_000)
  })

  it('need the authority box ticked', async () => {
    const { club, editor } = await newClub('Unticked')
    const e = await errorOf(() =>
      w.payload.create({
        collection: 'agreement-acceptances',
        data: { fullName: 'X', jobTitle: 'Y', authorised: false, tenant: club.id },
        overrideAccess: false,
        user: editor,
      }),
    )
    expect(e).not.toBeNull()
    expect(await clubHasAccepted(w.payload, club.id)).toBe(false)
  })

  it("can't be changed or deleted by the club or the super-admin", async () => {
    for (const user of [w.editorA, w.superAdmin]) {
      await errorOf(() =>
        w.payload.update({
          collection: 'agreement-acceptances',
          id: w.agreementA.id,
          data: { fullName: 'Changed' },
          overrideAccess: false,
          user,
        }),
      )
      await errorOf(() =>
        w.payload.delete({
          collection: 'agreement-acceptances',
          id: w.agreementA.id,
          overrideAccess: false,
          user,
        }),
      )
    }
    const after = await w.payload.findByID({
      collection: 'agreement-acceptances',
      id: w.agreementA.id,
    })
    expect(after.fullName).toBe('Alice Secretary')
  })

  it("the super-admin can't accept on a club's behalf", async () => {
    const { club } = await newClub('Not By Dan')
    const e = await errorOf(() =>
      w.payload.create({
        collection: 'agreement-acceptances',
        data: { fullName: 'Dan', jobTitle: 'Provider', authorised: true, tenant: club.id },
        overrideAccess: false,
        user: w.superAdmin,
      }),
    )
    expect(e).not.toBeNull()
    expect(await clubHasAccepted(w.payload, club.id)).toBe(false)
  })

  it("the website's database account can add records but never change or delete them", async () => {
    const client = await (
      w.payload.db as unknown as {
        pool: {
          connect: () => Promise<{ query: (s: string) => Promise<unknown>; release: () => void }>
        }
      }
    ).pool.connect()
    try {
      await client.query('SET ROLE golf_app')
      await expect(
        client.query(`UPDATE agreement_acceptances SET full_name = 'x'`),
      ).rejects.toThrow(/permission denied/)
      await expect(client.query(`DELETE FROM agreement_acceptances`)).rejects.toThrow(
        /permission denied/,
      )
    } finally {
      await client.query('RESET ROLE')
      client.release()
    }
  })
})
