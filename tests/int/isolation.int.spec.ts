import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { asUser, seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const errorOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    const e = error as { name?: string; message?: string; status?: number }
    return { name: e.name, message: e.message, status: e.status }
  }
  return null
}

describe('editor A sees nothing from club B (data layer)', () => {
  it('lists only club A pages', async () => {
    const res = await w.payload.find({
      collection: 'pages',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.docs.map((d) => d.id)).toEqual([w.pageA.id])
  })

  it('counts only club A pages', async () => {
    const res = await w.payload.count({
      collection: 'pages',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.totalDocs).toBe(1)
  })

  it("club B's page by ID looks exactly like a page that doesn't exist", async () => {
    const otherClub = await errorOf(() =>
      w.payload.findByID({
        collection: 'pages',
        id: w.pageB.id,
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    const missing = await errorOf(() =>
      w.payload.findByID({
        collection: 'pages',
        id: 999_999,
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    expect(otherClub).not.toBeNull()
    expect(otherClub).toEqual(missing)
  })

  it('sees only its own club record', async () => {
    const res = await w.payload.find({
      collection: 'tenants',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.docs.map((d) => d.id)).toEqual([w.clubA.id])
  })

  it('sees only its own club settings', async () => {
    const res = await w.payload.find({
      collection: 'club-settings',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.docs.map((d) => d.id)).toEqual([w.settingsA.id])
  })

  it('sees only editors of its own club, never super-admins', async () => {
    const res = await w.payload.find({
      collection: 'users',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.docs.map((d) => d.id).sort()).toEqual([w.editorA.id, w.editorA2.id].sort())
  })

  it("cannot read club B's preferences", async () => {
    // Written directly: Payload's own preference form takes the owner from the request.
    await w.payload.db.create({
      collection: 'payload-preferences',
      data: {
        key: 'b-pref',
        value: { club: 'B' },
        user: { relationTo: 'users', value: w.editorB.id },
      },
    })
    expect((await w.payload.find({ collection: 'payload-preferences' })).totalDocs).toBeGreaterThan(
      0,
    )
    const res = await w.payload.find({
      collection: 'payload-preferences',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.docs).toHaveLength(0)
  })
})

describe('editor A cannot change club B or escalate (escalation tests)', () => {
  it('cannot make themselves super-admin', async () => {
    await errorOf(() =>
      w.payload.update({
        collection: 'users',
        id: w.editorA.id,
        data: { role: 'super-admin' },
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    const after = await asUser(w.payload, w.editorA.id)
    expect(after.role).toBe('editor')
  })

  it('cannot move themselves to club B', async () => {
    await errorOf(() =>
      w.payload.update({
        collection: 'users',
        id: w.editorA.id,
        data: { tenant: w.clubB.id },
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    const after = await asUser(w.payload, w.editorA.id)
    expect(after.tenant).toBe(w.clubA.id)
  })

  it('cannot create any account', async () => {
    for (const role of ['editor', 'super-admin'] as const) {
      expect(
        await errorOf(() =>
          w.payload.create({
            collection: 'users',
            data: {
              email: `sneaky-${role}@example.com`,
              password: 'a-long-test-password',
              role,
              tenant: role === 'editor' ? w.clubA.id : null,
            },
            overrideAccess: false,
            user: w.editorA,
          }),
        ),
      ).not.toBeNull()
    }
  })

  it("cannot edit club B's page or settings", async () => {
    expect(
      await errorOf(() =>
        w.payload.update({
          collection: 'pages',
          id: w.pageB.id,
          data: { title: 'hacked' },
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
    expect(
      await errorOf(() =>
        w.payload.update({
          collection: 'club-settings',
          id: w.settingsB.id,
          data: { clubName: 'hacked' },
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
    const pageB = await w.payload.findByID({ collection: 'pages', id: w.pageB.id })
    expect(pageB.title).toBe('Membership (B)')
  })

  it('cannot create a page in club B', async () => {
    expect(
      await errorOf(() =>
        w.payload.create({
          collection: 'pages',
          data: { title: 'planted', slug: 'planted', tenant: w.clubB.id },
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
  })

  it("cannot delete club B's page", async () => {
    await errorOf(() =>
      w.payload.delete({
        collection: 'pages',
        id: w.pageB.id,
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    const stillThere = await w.payload.findByID({ collection: 'pages', id: w.pageB.id })
    expect(stillThere.id).toBe(w.pageB.id)
  })

  it('can create a page with a slug that only club B uses', async () => {
    await w.payload.create({
      collection: 'pages',
      data: { title: 'B only', slug: 'b-only', tenant: w.clubB.id },
    })
    const created = await w.payload.create({
      collection: 'pages',
      data: { title: 'A copy', slug: 'b-only', tenant: w.clubA.id },
      overrideAccess: false,
      user: w.editorA,
    })
    expect(created.slug).toBe('b-only')
  })
})

describe('the database enforces the account rules on its own', () => {
  const db = () => w.payload.db.drizzle

  it('rejects an editor with no club', async () => {
    await expect(
      db().execute(
        sql`INSERT INTO users (email, role) VALUES ('raw-editor@example.com', 'editor')`,
      ),
    ).rejects.toThrow()
  })

  it('rejects a super-admin with a club', async () => {
    await expect(
      db().execute(
        sql`INSERT INTO users (email, role, tenant_id) VALUES ('raw-super@example.com', 'super-admin', ${w.clubA.id})`,
      ),
    ).rejects.toThrow()
  })

  it("rejects changing an account's type or club", async () => {
    await expect(
      db().execute(
        sql`UPDATE users SET role = 'super-admin', tenant_id = NULL WHERE id = ${w.editorA.id}`,
      ),
    ).rejects.toThrow()
    await expect(
      db().execute(sql`UPDATE users SET tenant_id = ${w.clubB.id} WHERE id = ${w.editorA.id}`),
    ).rejects.toThrow()
  })

  it('rejects club pages with no club', async () => {
    await expect(
      db().execute(sql`INSERT INTO pages (title, slug) VALUES ('orphan', 'orphan')`),
    ).rejects.toThrow()
  })

  it('refuses to delete a club that still has accounts or content', async () => {
    await expect(db().execute(sql`DELETE FROM tenants WHERE id = ${w.clubB.id}`)).rejects.toThrow()
  })
})
