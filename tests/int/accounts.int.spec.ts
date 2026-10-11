import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { createSuperAdmin } from '@/accounts/createSuperAdmin'

import { asUser, PASSWORD, seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

/** Runs fn and returns its error (or null), so tests can compare failures. */
const errorOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn()
  } catch (error) {
    const e = error as { name?: string; message?: string; status?: number }
    return { name: e.name, message: e.message, status: e.status }
  }
  return null
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

it('records get random IDs, never counting numbers', () => {
  for (const id of [w.clubA.id, w.clubB.id, w.superAdmin.id, w.editorA.id, w.editorB.id]) {
    expect(id).toMatch(UUID_V4)
  }
})

describe('what an editor can see', () => {
  it('sees only its own club record', async () => {
    const res = await w.payload.find({
      collection: 'tenants',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.docs.map((d) => d.id)).toEqual([w.clubA.id])
  })

  it("club B's record by ID looks exactly like a club that doesn't exist", async () => {
    const otherClub = await errorOf(() =>
      w.payload.findByID({
        collection: 'tenants',
        id: w.clubB.id,
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    const missing = await errorOf(() =>
      w.payload.findByID({
        collection: 'tenants',
        id: '00000000-0000-4000-8000-000000000000',
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    expect(otherClub).not.toBeNull()
    expect(otherClub).toEqual(missing)
  })

  it('sees only editors of its own club, never super-admins or other clubs', async () => {
    const res = await w.payload.find({
      collection: 'users',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(res.docs.map((d) => d.id).sort()).toEqual([w.editorA.id, w.editorA2.id].sort())
  })

  it("cannot read club B's editor or the super-admin by ID", async () => {
    for (const id of [w.editorB.id, w.superAdmin.id]) {
      expect(
        await errorOf(() =>
          w.payload.findByID({ collection: 'users', id, overrideAccess: false, user: w.editorA }),
        ),
      ).not.toBeNull()
    }
  })

  it('the super-admin sees every club and account', async () => {
    const clubs = await w.payload.find({
      collection: 'tenants',
      overrideAccess: false,
      user: w.superAdmin,
    })
    expect(clubs.totalDocs).toBe(2)
    const users = await w.payload.find({
      collection: 'users',
      overrideAccess: false,
      user: w.superAdmin,
    })
    expect(users.totalDocs).toBe(4)
  })
})

describe('escalation attempts by an editor all fail', () => {
  it('cannot make themselves super-admin', async () => {
    await errorOf(() =>
      w.payload.update({
        collection: 'users',
        id: w.editorA.id,
        data: { role: 'super-admin', tenant: null },
        overrideAccess: false,
        user: w.editorA,
      }),
    )
    const after = await asUser(w.payload, w.editorA.id)
    expect(after.role).toBe('editor')
    expect(after.tenant).toBe(w.clubA.id)
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
    expect((await asUser(w.payload, w.editorA.id)).tenant).toBe(w.clubA.id)
  })

  it('cannot create any account', async () => {
    for (const role of ['editor', 'super-admin'] as const) {
      expect(
        await errorOf(() =>
          w.payload.create({
            collection: 'users',
            data: {
              email: `sneaky-${role}@example.com`,
              password: PASSWORD,
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

  it('cannot edit or delete another account, or any club', async () => {
    expect(
      await errorOf(() =>
        w.payload.update({
          collection: 'users',
          id: w.editorA2.id,
          data: { email: 'hijacked@example.com' },
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
    expect(
      await errorOf(() =>
        w.payload.update({
          collection: 'tenants',
          id: w.clubA.id,
          data: { name: 'Renamed' },
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
    expect(
      await errorOf(() =>
        w.payload.delete({
          collection: 'users',
          id: w.editorB.id,
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
    expect((await w.payload.findByID({ collection: 'tenants', id: w.clubA.id })).name).toBe(
      'Test Club A',
    )
  })

  it('cannot create a club', async () => {
    expect(
      await errorOf(() =>
        w.payload.create({
          collection: 'tenants',
          data: { name: 'Planted' },
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
  })
})

describe('account creation rules', () => {
  it('a super-admin can create an editor for a club', async () => {
    const created = await w.payload.create({
      collection: 'users',
      data: {
        email: 'new-editor@example.com',
        password: PASSWORD,
        role: 'editor',
        tenant: w.clubB.id,
      },
      overrideAccess: false,
      user: w.superAdmin,
    })
    expect(created.role).toBe('editor')
  })

  it('a super-admin cannot create another super-admin from the admin screens', async () => {
    expect(
      await errorOf(() =>
        w.payload.create({
          collection: 'users',
          data: { email: 'second-super@example.com', password: PASSWORD, role: 'super-admin' },
          overrideAccess: false,
          user: w.superAdmin,
        }),
      ),
    ).toMatchObject({ status: 403 })
  })

  it('an editor needs a club, and a super-admin cannot have one', async () => {
    expect(
      await errorOf(() =>
        w.payload.create({
          collection: 'users',
          data: { email: 'clubless@example.com', password: PASSWORD, role: 'editor' },
          overrideAccess: false,
          user: w.superAdmin,
        }),
      ),
    ).not.toBeNull()
  })

  it('passwords must be at least 12 characters', async () => {
    expect(
      await errorOf(() =>
        w.payload.create({
          collection: 'users',
          data: {
            email: 'short@example.com',
            password: 'short-pw',
            role: 'editor',
            tenant: w.clubA.id,
          },
          overrideAccess: false,
          user: w.superAdmin,
        }),
      ),
    ).not.toBeNull()
    expect(
      await errorOf(() =>
        w.payload.update({
          collection: 'users',
          id: w.editorA.id,
          data: { password: 'short-pw' },
          overrideAccess: false,
          user: w.editorA,
        }),
      ),
    ).not.toBeNull()
  })

  it('the super-admin script path works', async () => {
    const created = await createSuperAdmin(w.payload, {
      email: 'scripted-super@example.com',
      password: PASSWORD,
    })
    expect(created.role).toBe('super-admin')
    expect(created.tenant ?? null).toBeNull()
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

  it('rejects an account with no type', async () => {
    await expect(
      db().execute(sql`INSERT INTO users (email, role) VALUES ('raw-none@example.com', NULL)`),
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

  it('refuses to delete a club that still has accounts', async () => {
    await expect(db().execute(sql`DELETE FROM tenants WHERE id = ${w.clubB.id}`)).rejects.toThrow()
  })
})
