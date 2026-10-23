import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { createSuperAdmin } from '@/accounts/createSuperAdmin'
import { resetTwoFactor } from '@/auth/resetTwoFactor'

import {
  asUser,
  createEditor,
  type LoggedInUser,
  PASSWORD,
  seedWorld,
  TEST_TOTP_SECRET,
  withoutCode,
  type World,
} from './helpers/seed'

let w: World
/** A club A editor who chose to set two-factor up. */
let editorWithCode: LoggedInUser

beforeAll(async () => {
  w = await seedWorld()
  editorWithCode = await createEditor(w.payload, 'editor-with-code@example.com', w.clubA.id, {
    twoFactor: true,
  })
})

const rawSecret = async (id: string) => {
  const result = await w.payload.db.drizzle.execute(
    sql`SELECT totp_secret FROM users WHERE id = ${id}`,
  )
  return (result.rows[0] as { totp_secret: string | null }).totp_secret
}

describe('who needs the two-factor code (decisions.md, 22 Oct)', () => {
  // A super-admin, and a club editor who chose to set two-factor up: password accepted, no code.
  const halfSignedIn = () => ({
    superAdmin: withoutCode(w.superAdmin),
    'editor with two-factor': withoutCode(editorWithCode),
  })

  for (const who of ['superAdmin', 'editor with two-factor'] as const) {
    it(`${who}, with only a password, can't read pages, clubs, settings or accounts`, async () => {
      const user = halfSignedIn()[who]
      for (const collection of ['pages', 'club-settings', 'tenants', 'enquiries'] as const) {
        const result = await w.payload
          .find({ collection, overrideAccess: false, user })
          .then((r) => r.totalDocs)
          .catch(() => 0)
        expect({ who, collection, visible: result }).toEqual({ who, collection, visible: 0 })
      }
      // Only their own account, which the code screens need.
      const accounts = await w.payload.find({ collection: 'users', overrideAccess: false, user })
      expect(accounts.docs.map((d) => d.id)).toEqual([user.id])
    })

    it(`${who}, with only a password, can't change anything`, async () => {
      await w.payload
        .update({
          collection: 'pages',
          id: w.pageA.id,
          data: { title: 'Changed without a code' },
          overrideAccess: false,
          user: halfSignedIn()[who],
        })
        .catch(() => null)
      const page = await w.payload.findByID({ collection: 'pages', id: w.pageA.id })
      expect(page.title).not.toBe('Changed without a code')
    })
  }

  it('a super-admin who never set two-factor up reaches nothing, even signed in', async () => {
    const created = await createSuperAdmin(w.payload, {
      email: `no-code-${Date.now()}@example.com`,
      password: PASSWORD,
    })
    const user = await asUser(w.payload, created.id) // password only: no two-factor yet
    for (const collection of ['pages', 'club-settings', 'tenants', 'users'] as const) {
      const visible = await w.payload
        .find({ collection, overrideAccess: false, user })
        .then((r) => r.docs.filter((d) => d.id !== user.id).length)
        .catch(() => 0)
      expect({ collection, visible }).toEqual({ collection, visible: 0 })
    }
    expect(
      await w.payload
        .findGlobal({ slug: 'marketing-settings', overrideAccess: false, user })
        .catch(() => null),
    ).toBeNull()
  })

  it("a password-only club editor reaches their own club's content, and only that", async () => {
    const pages = await w.payload.find({
      collection: 'pages',
      overrideAccess: false,
      user: w.editorA,
    })
    expect(pages.docs.map((d) => d.id)).toContain(w.pageA.id)
    expect(pages.docs.map((d) => d.id)).not.toContain(w.pageB.id)
  })
})

describe('two-factor secrets are stored encrypted', () => {
  it('the database never holds the secret itself', async () => {
    const stored = await rawSecret(editorWithCode.id)
    expect(stored).toMatch(/^v1:/)
    expect(stored).not.toContain(TEST_TOTP_SECRET)
  })

  it('the app reads back the real secret', async () => {
    const user = await w.payload.findByID({
      collection: 'users',
      id: editorWithCode.id,
      showHiddenFields: true,
      overrideAccess: true,
      depth: 0,
    })
    expect((user as { totpSecret?: string }).totpSecret).toBe(TEST_TOTP_SECRET)
  })

  it('an editor cannot read their own secret through the API', async () => {
    const me = await w.payload.findByID({
      collection: 'users',
      id: w.editorA.id,
      overrideAccess: false,
      user: w.editorA,
    })
    expect(me).not.toHaveProperty('totpSecret')
  })

  it("a secret of someone's own choosing, planted unencrypted in the database, is refused", async () => {
    const victim = w.editorA2.id
    const attackersSecret = 'A'.repeat(32) // valid format, obviously not a real secret
    await w.payload.db.drizzle.execute(
      sql`UPDATE users SET totp_secret = ${attackersSecret} WHERE id = ${victim}`,
    )
    try {
      await expect(
        w.payload.findByID({
          collection: 'users',
          id: victim,
          showHiddenFields: true,
          overrideAccess: true,
        }),
      ).rejects.toThrow(/not encrypted/)
    } finally {
      // Take it out again: an account that can't be read can't be deleted either, so it (and
      // its club) would be left behind and break the next test file's set-up.
      await w.payload.db.drizzle.execute(
        sql`UPDATE users SET totp_secret = NULL WHERE id = ${victim}`,
      )
    }
  })
})

describe('resetting two-factor (lost phone)', () => {
  it('clears the secret, so they set it up again at next login', async () => {
    await resetTwoFactor(w.payload, editorWithCode.id)
    expect(await rawSecret(editorWithCode.id)).toBeNull()
  })
})
