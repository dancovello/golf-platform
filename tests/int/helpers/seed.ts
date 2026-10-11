import type { Payload } from 'payload'
import { getPayload } from 'payload'

import { allowAccountCreation } from '@/access/accountCreation'
import { createSuperAdmin } from '@/accounts/createSuperAdmin'
import config from '@/payload.config'
import type { ClubSetting, Media, Page, Tenant, User } from '@/payload-types'

import { ensureMediaBucket, pngFile } from '../../shared/media'
import { TEST_TOTP_SECRET } from '../../shared/totp'

export const PASSWORD = 'a-long-test-password'

export { TEST_TOTP_SECRET }

/** Gives an account two-factor, as if they'd scanned the QR code. Stored encrypted. */
export const enrolTwoFactor = (payload: Payload, id: string) =>
  payload.update({
    collection: 'users',
    id,
    data: { totpSecret: TEST_TOTP_SECRET } as never,
    overrideAccess: true,
  })

export type LoggedInUser = User & { collection: 'users'; _strategy?: string }

export type World = {
  payload: Payload
  clubA: Tenant
  clubB: Tenant
  superAdmin: LoggedInUser
  editorA: LoggedInUser
  editorA2: LoggedInUser
  editorB: LoggedInUser
  pageA: Page
  pageB: Page
  settingsA: ClubSetting
  settingsB: ClubSetting
  mediaA: Media
  mediaB: Media
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
  await payload.delete({ collection: 'pages', where: all })
  await payload.delete({ collection: 'media', where: all })
  await payload.delete({ collection: 'club-settings', where: all })
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
  // `_strategy: 'totp'` is how payload-totp marks a session whose code has been entered.
  return { ...user, collection: 'users', _strategy: 'totp' }
}

/** The same user part-way through logging in: password accepted, no code entered yet. */
export const withoutCode = (user: LoggedInUser): LoggedInUser => {
  const { _strategy: _ignored, ...rest } = user as LoggedInUser & { _strategy?: string }
  return { ...rest, _strategy: 'local-jwt' } as LoggedInUser
}

const createEditor = async (payload: Payload, email: string, tenant: string) => {
  const created = await payload.create({
    collection: 'users',
    data: { email, password: PASSWORD, role: 'editor', tenant },
    context: allowAccountCreation,
  })
  await enrolTwoFactor(payload, created.id)
  return asUser(payload, created.id)
}

/** Two test clubs, an editor in each (two in club A), and a super-admin. */
export const seedWorld = async (): Promise<World> => {
  const payload = await getTestPayload()
  await ensureMediaBucket()
  await resetDatabase(payload)

  const clubA = await payload.create({ collection: 'tenants', data: { name: 'Test Club A' } })
  const clubB = await payload.create({ collection: 'tenants', data: { name: 'Test Club B' } })
  const superAdminID = (
    await createSuperAdmin(payload, { email: 'super@example.com', password: PASSWORD })
  ).id
  await enrolTwoFactor(payload, superAdminID)
  const superAdmin = await asUser(payload, superAdminID)

  // Both clubs have a page with the same slug: slugs are unique per club, not globally.
  const page = (title: string, tenant: string) =>
    payload.create({ collection: 'pages', data: { title, slug: 'membership', tenant } })
  // Created automatically with each club (src/collections/Tenants.ts).
  const settings = async (_clubName: string, tenant: string) =>
    (await payload.find({ collection: 'club-settings', where: { tenant: { equals: tenant } } }))
      .docs[0]

  const media = (alt: string, tenant: string) =>
    payload.create({ collection: 'media', data: { alt, tenant }, file: pngFile('photo.png') })

  return {
    payload,
    clubA,
    clubB,
    superAdmin,
    editorA: await createEditor(payload, 'editor-a@example.com', clubA.id),
    editorA2: await createEditor(payload, 'editor-a2@example.com', clubA.id),
    editorB: await createEditor(payload, 'editor-b@example.com', clubB.id),
    pageA: await page('Membership (Club A)', clubA.id),
    pageB: await page('Membership (Club B)', clubB.id),
    settingsA: await settings('Test Club A', clubA.id),
    settingsB: await settings('Test Club B', clubB.id),
    // Same file name in both clubs: each is stored in its own random folder.
    mediaA: await media('Club A photo', clubA.id),
    mediaB: await media('Club B photo', clubB.id),
  }
}
