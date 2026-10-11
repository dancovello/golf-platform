import { beforeAll, describe, expect, it } from 'vitest'

import { createPasswordLink, inviteEditor, PASSWORD_LINK_HOURS } from '@/accounts/passwordLinks'

import { seedWorld, type World } from './helpers/seed'

let w: World
const SERVER = 'https://staging.example.com'
const tokenOf = (link: string) => link.split('/admin/reset/')[1]

beforeAll(async () => {
  w = await seedWorld()
})

describe('inviting a club editor', () => {
  it('creates an editor in the chosen club, with a one-time link to set their password', async () => {
    const invite = await inviteEditor(w.payload, {
      email: 'invited@example.com',
      tenant: w.clubA.id,
      serverURL: SERVER,
    })
    expect(invite.link).toMatch(new RegExp(`^${SERVER}/admin/reset/[a-f0-9]+$`))
    expect(invite.expiresInHours).toBe(PASSWORD_LINK_HOURS)

    const created = await w.payload.find({
      collection: 'users',
      where: { email: { equals: 'invited@example.com' } },
      depth: 0,
    })
    expect(created.docs[0]).toMatchObject({ role: 'editor', tenant: w.clubA.id })
  })

  it('the link lets them set a password once, and then stops working', async () => {
    const { link } = await inviteEditor(w.payload, {
      email: 'once@example.com',
      tenant: w.clubA.id,
      serverURL: SERVER,
    })
    const token = tokenOf(link)
    await w.payload.resetPassword({
      collection: 'users',
      data: { token, password: 'a-brand-new-password' },
      overrideAccess: true,
    })
    await expect(
      w.payload.resetPassword({
        collection: 'users',
        data: { token, password: 'another-new-password' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('a password set through a link must be at least 12 characters', async () => {
    const { link } = await createPasswordLink(w.payload, {
      userID: w.editorA2.id,
      serverURL: SERVER,
    })
    await expect(
      w.payload.resetPassword({
        collection: 'users',
        data: { token: tokenOf(link), password: 'short-pw' },
        overrideAccess: true,
      }),
    ).rejects.toThrow(/12 characters/)
  })

  it('links are only made for club editors, never super-admins', async () => {
    await expect(
      createPasswordLink(w.payload, { userID: w.superAdmin.id, serverURL: SERVER }),
    ).rejects.toThrow(/club editors/)
  })
})

describe('public "Forgot password?" is off until an email provider is chosen', () => {
  it('refuses, for real and made-up addresses alike', async () => {
    for (const email of [w.editorA.email, 'nobody@example.com']) {
      await expect(
        w.payload.forgotPassword({ collection: 'users', data: { email }, disableEmail: true }),
      ).rejects.toThrow(/Ask your platform administrator/)
    }
  })
})

describe('clubs get their settings automatically', () => {
  it('creating a club creates its one Club Settings record', async () => {
    const club = await w.payload.create({ collection: 'tenants', data: { name: 'New Club' } })
    const settings = await w.payload.find({
      collection: 'club-settings',
      where: { tenant: { equals: club.id } },
    })
    expect(settings.docs.map((d) => d.clubName)).toEqual(['New Club'])
  })
})
