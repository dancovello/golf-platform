import type { Payload } from 'payload'
import { getPayload } from 'payload'

import { allowAccountCreation } from '@/access/accountCreation'
import { createSuperAdmin } from '@/accounts/createSuperAdmin'
import config from '@/payload.config'
import type { Tenant, User } from '@/payload-types'

export const PASSWORD = 'a-long-test-password'

export type LoggedInUser = User & { collection: 'users' }

export type World = {
  payload: Payload
  clubA: Tenant
  clubB: Tenant
  superAdmin: LoggedInUser
  editorA: LoggedInUser
  editorA2: LoggedInUser
  editorB: LoggedInUser
}

/** Refuses to run against anything but the golf_test database. */
export const assertTestDatabase = () => {
  if (!/\/golf_test(\?|$)/.test(process.env.DATABASE_URL ?? '')) {
    throw new Error('Integration tests must run against the golf_test database')
  }
}

export const getTestPayload = async () => {
  assertTestDatabase()
  return getPayload({ config: await config })
}

export const resetDatabase = async (payload: Payload) => {
  const all = { id: { exists: true } }
  await payload.delete({ collection: 'payload-preferences', where: all })
  await payload.delete({ collection: 'users', where: all })
  await payload.delete({ collection: 'tenants', where: all })
}

/**
 * Loads a user exactly as Payload's login does for a request: findByID with hooks applied,
 * plus the `collection` marker (payload/dist/auth/strategies/jwt.js). The multi-tenant plugin
 * only scopes users that carry this marker, so tests must include it.
 */
export const asUser = async (payload: Payload, id: string): Promise<LoggedInUser> => {
  const user = await payload.findByID({ collection: 'users', id, depth: 0 })
  return { ...user, collection: 'users' }
}

const createEditor = async (payload: Payload, email: string, tenant: string) => {
  const created = await payload.create({
    collection: 'users',
    data: { email, password: PASSWORD, role: 'editor', tenant },
    context: allowAccountCreation,
  })
  return asUser(payload, created.id)
}

/** Two test clubs, an editor in each (two in club A), and a super-admin. */
export const seedWorld = async (): Promise<World> => {
  const payload = await getTestPayload()
  await resetDatabase(payload)

  const clubA = await payload.create({ collection: 'tenants', data: { name: 'Test Club A' } })
  const clubB = await payload.create({ collection: 'tenants', data: { name: 'Test Club B' } })
  const superAdmin = await asUser(
    payload,
    (await createSuperAdmin(payload, { email: 'super@example.com', password: PASSWORD })).id,
  )

  return {
    payload,
    clubA,
    clubB,
    superAdmin,
    editorA: await createEditor(payload, 'editor-a@example.com', clubA.id),
    editorA2: await createEditor(payload, 'editor-a2@example.com', clubA.id),
    editorB: await createEditor(payload, 'editor-b@example.com', clubB.id),
  }
}
