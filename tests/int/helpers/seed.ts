import type { Payload } from 'payload'
import { getPayload } from 'payload'

import { allowAccountCreation } from '@/access/accountCreation'
import config from '@/payload.config'
import type { ClubSetting, Page, Tenant, User } from '@/payload-types'

export const PASSWORD = 'a-long-test-password'

export type World = {
  payload: Payload
  clubA: Tenant
  clubB: Tenant
  superAdmin: User
  editorA: User
  editorA2: User
  editorB: User
  pageA: Page
  pageB: Page
  settingsA: ClubSetting
  settingsB: ClubSetting
}

/** Refuses to run against anything but the golf_test database. */
export const assertTestDatabase = () => {
  if (!/\/golf_test(\?|$)/.test(process.env.DATABASE_URL ?? '')) {
    throw new Error('Integration tests must run against the golf_test database')
  }
}

export const resetDatabase = async (payload: Payload) => {
  const all = { id: { exists: true } }
  await payload.delete({ collection: 'pages', where: all })
  await payload.delete({ collection: 'club-settings', where: all })
  await payload.delete({ collection: 'users', where: all })
  await payload.delete({ collection: 'tenants', where: all })
}

/**
 * Loads a user exactly as Payload's login does for a request: findByID with hooks applied,
 * then the `collection` marker (payload/dist/auth/strategies/jwt.js). The multi-tenant
 * plugin only scopes users that carry this marker, so tests must include it.
 */
export const asUser = async (payload: Payload, id: number) => {
  const user = await payload.findByID({ collection: 'users', id, depth: 0 })
  return { ...user, collection: 'users' as const } as User & { collection: 'users' }
}

const createUser = async (payload: Payload, data: Partial<User>) => {
  const created = await payload.create({
    collection: 'users',
    data: { password: PASSWORD, ...data } as User & { password: string },
    context: allowAccountCreation,
  })
  return asUser(payload, created.id)
}

/** Two test clubs, an editor in each (two in club A), and a super-admin. */
export const seedWorld = async (): Promise<World> => {
  assertTestDatabase()
  const payload = await getPayload({ config: await config })
  await resetDatabase(payload)

  const clubA = await payload.create({ collection: 'tenants', data: { name: 'Test Club A' } })
  const clubB = await payload.create({ collection: 'tenants', data: { name: 'Test Club B' } })

  const superAdmin = await createUser(payload, { email: 'super@example.com', role: 'super-admin' })
  const editorA = await createUser(payload, {
    email: 'editor-a@example.com',
    role: 'editor',
    tenant: clubA.id,
  })
  const editorA2 = await createUser(payload, {
    email: 'editor-a2@example.com',
    role: 'editor',
    tenant: clubA.id,
  })
  const editorB = await createUser(payload, {
    email: 'editor-b@example.com',
    role: 'editor',
    tenant: clubB.id,
  })

  // Both clubs have a page with the same slug: slugs are unique per club, not globally.
  const pageA = await payload.create({
    collection: 'pages',
    data: { title: 'Membership (A)', slug: 'membership', tenant: clubA.id },
  })
  const pageB = await payload.create({
    collection: 'pages',
    data: { title: 'Membership (B)', slug: 'membership', tenant: clubB.id },
  })
  const settingsA = await payload.create({
    collection: 'club-settings',
    data: { clubName: 'Test Club A', tenant: clubA.id },
  })
  const settingsB = await payload.create({
    collection: 'club-settings',
    data: { clubName: 'Test Club B', tenant: clubB.id },
  })

  return {
    payload,
    clubA,
    clubB,
    superAdmin,
    editorA,
    editorA2,
    editorB,
    pageA,
    pageB,
    settingsA,
    settingsB,
  }
}
