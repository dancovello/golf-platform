import { sql } from '@payloadcms/db-postgres'
import { beforeAll, describe, expect, it } from 'vitest'

import { resetTwoFactor } from '@/auth/resetTwoFactor'

import { seedWorld, TEST_TOTP_SECRET, withoutCode, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const rawSecret = async (id: string) => {
  const result = await w.payload.db.drizzle.execute(
    sql`SELECT totp_secret FROM users WHERE id = ${id}`,
  )
  return (result.rows[0] as { totp_secret: string | null }).totp_secret
}

describe('until the two-factor code is entered, a password alone gets nothing', () => {
  for (const who of ['editorA', 'superAdmin'] as const) {
    it(`${who} with only a password can't read pages, clubs or settings`, async () => {
      const user = withoutCode(w[who])
      for (const collection of ['pages', 'club-settings', 'tenants'] as const) {
        const result = await w.payload
          .find({ collection, overrideAccess: false, user })
          .then((r) => r.totalDocs)
          .catch(() => 0)
        expect({ who, collection, visible: result }).toEqual({ who, collection, visible: 0 })
      }
    })
  }

  it("with only a password, an editor can't change anything", async () => {
    await w.payload
      .update({
        collection: 'pages',
        id: w.pageA.id,
        data: { title: 'Changed without a code' },
        overrideAccess: false,
        user: withoutCode(w.editorA),
      })
      .catch(() => null)
    const page = await w.payload.findByID({ collection: 'pages', id: w.pageA.id })
    expect(page.title).not.toBe('Changed without a code')
  })
})

describe('two-factor secrets are stored encrypted', () => {
  it('the database never holds the secret itself', async () => {
    const stored = await rawSecret(w.editorA.id)
    expect(stored).toMatch(/^v1:/)
    expect(stored).not.toContain(TEST_TOTP_SECRET)
  })

  it('the app reads back the real secret', async () => {
    const user = await w.payload.findByID({
      collection: 'users',
      id: w.editorA.id,
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
    const attackersSecret = 'KRUGS4ZANFZSAYJAONSWG4TFOQQGC5DUMFRWW4TS'
    await w.payload.db.drizzle.execute(
      sql`UPDATE users SET totp_secret = ${attackersSecret} WHERE id = ${victim}`,
    )
    await expect(
      w.payload.findByID({
        collection: 'users',
        id: victim,
        showHiddenFields: true,
        overrideAccess: true,
      }),
    ).rejects.toThrow(/not encrypted/)
  })
})

describe('resetting two-factor (lost phone)', () => {
  it('clears the secret, so they set it up again at next login', async () => {
    await resetTwoFactor(w.payload, w.editorB.id)
    expect(await rawSecret(w.editorB.id)).toBeNull()
  })
})
