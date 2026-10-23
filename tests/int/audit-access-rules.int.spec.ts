/**
 * Access-rules audit, 22 Oct 2026 (docs/security/audit-access-rules.md).
 *
 * Each test here proves one finding. They are written as `it.fails`: the test body asserts the
 * SAFE behaviour, which the code doesn't have yet, so the body fails and Vitest reports it as
 * passing. That keeps CI green until Dan approves a fix. When a fix lands, its `it.fails` starts
 * failing: change it to a plain `it` in the fix PR.
 */
import type { Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

import { PASSWORD, seedWorld, type World } from './helpers/seed'

let w: World
let p: Payload

beforeAll(async () => {
  w = await seedWorld()
  p = w.payload
})

/** The HTTP status Payload would answer with: 200 for success, else the error's status. */
const statusOf = async (fn: () => Promise<unknown>): Promise<number> => {
  try {
    await fn()
    return 200
  } catch (error) {
    return (error as { status?: number }).status ?? 500
  }
}

describe('A1 (medium): company-website drafts are readable by club editors', () => {
  // Fixed 23 Oct: marketing-pages defines readVersions (super-admin only).
  it("a club editor can't list the company website's page versions or drafts", async () => {
    const draft = await p.create({
      collection: 'marketing-pages',
      draft: true,
      data: { _status: 'draft', title: 'Unreleased pricing', slug: 'audit-a1-draft' } as never,
    })
    const asEditor = { overrideAccess: false as const, user: w.editorA }

    expect(
      await statusOf(() => p.findVersions({ collection: 'marketing-pages', ...asEditor })),
    ).toBe(403)

    const { docs } = await p.findVersions({
      collection: 'marketing-pages',
      where: { parent: { equals: draft.id } },
    })
    expect(
      await statusOf(() =>
        p.findVersionByID({ collection: 'marketing-pages', id: docs[0]!.id, ...asEditor }),
      ),
    ).toBe(403)
  })
})

describe('A2 (low): the access guards only check four of the six operations', () => {
  /** A club editor who has entered their two-factor code: the most an editor can be. */
  const editor = {
    id: '11111111-1111-4111-8111-111111111111',
    collection: 'users',
    role: 'editor',
    tenant: '22222222-2222-4222-8222-222222222222',
    hasTotp: true,
    _strategy: 'totp',
  }

  // Fixed 23 Oct: tests/unit/access-guard.spec.ts and tests/int/config-access.int.spec.ts check
  // readVersions on every collection with a history.
  it("no collection with a version history gives a club editor a plain 'yes' to it", async () => {
    const cfg = await config
    const plainYes: string[] = []
    for (const c of cfg.collections) {
      if (!c.versions) continue
      const result = await (c.access.readVersions as (args: unknown) => unknown)({
        req: { user: editor, payload: { config: cfg }, headers: new Headers(), context: {} },
      })
      if (result === true) plainYes.push(c.slug)
    }
    expect(plainYes).toEqual([])
  })
})

describe('A3 (low): changing your own email reveals which addresses have accounts', () => {
  // Fixed 23 Oct by sign-in audit A1: only a super-admin can change an account's email, so an
  // editor gets the same answer (no change) for a taken address and a free one.
  it('a taken address (another club’s editor) and a free one get the same answer', async () => {
    const asEditor = { overrideAccess: false as const, user: w.editorA }
    const original = w.editorA.email
    const tryEmail = (email: string) =>
      statusOf(() =>
        p.update({ collection: 'users', id: w.editorA.id, data: { email }, ...asEditor }),
      )

    const taken = await tryEmail(w.editorB.email) // club B's editor
    const free = await tryEmail('audit-a3-nobody@example.com')
    // Put it back so the rest of this file sees the seeded account.
    await p.update({ collection: 'users', id: w.editorA.id, data: { email: original } })

    expect(taken).toBe(free)
  })
})

describe('A4 (low): a signed-in session can change the password without the current one', () => {
  // ACCEPTED FOR V1 (Dan, 23 Oct 2026, with sign-in audit A2): the email half is fixed (only a
  // super-admin can change it). Asking for the current password waits until before member
  // logins or booking. Remove `.fails` when that's built.
  it.fails('an editor’s session alone can’t set a new password', async () => {
    const status = await statusOf(() =>
      p.update({
        collection: 'users',
        id: w.editorA2.id,
        data: { password: 'taken-over-password-123' } as never,
        overrideAccess: false,
        user: w.editorA2,
      }),
    )
    // Put the seeded password back whatever happened.
    await p.update({
      collection: 'users',
      id: w.editorA2.id,
      data: { password: PASSWORD } as never,
    })
    expect(status).not.toBe(200)
  })
})
