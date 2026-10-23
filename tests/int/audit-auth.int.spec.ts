/**
 * Auth and two-factor audit, 22 October 2026 (docs/security/audit-auth.md).
 *
 * Tests marked `it.fails` prove a finding: they describe the SAFE behaviour, and fail today
 * because the code doesn't do it yet. Vitest counts a failing `it.fails` as a pass, so they
 * don't block CI. When a fix lands, the test starts passing, `it.fails` then reports it as a
 * failure, and the fix PR changes `it.fails` to `it`.
 *
 * The plain `it` tests at the end are guards for things the audit checked and found safe, but
 * which hang on one setting each.
 */
import type { Payload } from 'payload'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { ClubHome } from '@/admin/ClubHome'
import { PageTree } from '@/admin/PageTree'

import {
  createEditor,
  enquiry,
  type LoggedInUser,
  PASSWORD,
  seedWorld,
  withoutCode,
  type World,
} from './helpers/seed'

// The admin screens read the club selector's cookie; outside a real request there is none.
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

let w: World
let p: Payload
/** A club A editor who chose to set up two-factor. */
let editorWithCode: LoggedInUser

beforeAll(async () => {
  w = await seedWorld()
  p = w.payload
  editorWithCode = await createEditor(p, 'audit-2fa@example.com', w.clubA.id, { twoFactor: true })
  await enquiry(p, 'Private Person', w.clubA.id)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('Finding A1 (medium): an editor can change their own sign-in email, unnoticed', () => {
  it('an editor cannot change the email address they sign in with', async () => {
    const editor = await createEditor(p, 'audit-email@example.com', w.clubA.id)
    await p
      .update({
        collection: 'users',
        id: editor.id,
        data: { email: 'attacker@example.net' },
        overrideAccess: false,
        user: editor,
      })
      .catch(() => null)
    const after = await p.findByID({ collection: 'users', id: editor.id, overrideAccess: true })
    expect(after.email).toBe('audit-email@example.com')
  })

  it('…and if it ever can, the old address is told', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only')
    const sent = vi.spyOn(p, 'sendEmail').mockResolvedValue(undefined)
    const editor = await createEditor(p, 'audit-email2@example.com', w.clubA.id)
    await p
      .update({
        collection: 'users',
        id: editor.id,
        data: { email: 'attacker2@example.net' },
        overrideAccess: false,
        user: editor,
      })
      .catch(() => null)
    const after = await p.findByID({ collection: 'users', id: editor.id, overrideAccess: true })
    // Safe if the change was refused, or if the old address heard about it.
    const refused = after.email === 'audit-email2@example.com'
    const told = sent.mock.calls.some(
      ([m]) => (m as { to?: string }).to === 'audit-email2@example.com',
    )
    expect(refused || told).toBe(true)
  })
})

describe('A1 fix: a super-admin can still change an editor’s email', () => {
  it('when an editor changes address, the super-admin updates it', async () => {
    const editor = await createEditor(p, 'audit-email3@example.com', w.clubA.id)
    await p.update({
      collection: 'users',
      id: editor.id,
      data: { email: 'new-address@example.com' },
      overrideAccess: false,
      user: w.superAdmin,
    })
    const after = await p.findByID({ collection: 'users', id: editor.id, overrideAccess: true })
    expect(after.email).toBe('new-address@example.com')
  })
})

describe('Finding A2 (low): a password can be changed without the current password', () => {
  // ACCEPTED FOR V1 (Dan, 23 Oct 2026): with A1 fixed, the "your password was set" email reaches
  // the real editor. Revisit before member logins or booking; remove `.fails` when built.
  it.fails('changing your own password needs the current one', async () => {
    const editor = await createEditor(p, 'audit-pw@example.com', w.clubA.id)
    await p
      .update({
        collection: 'users',
        id: editor.id,
        data: { password: 'chosen-by-whoever-has-the-session' },
        overrideAccess: false,
        user: editor,
      })
      .catch(() => null)
    // The original password should still work.
    await expect(
      p.login({ collection: 'users', data: { email: 'audit-pw@example.com', password: PASSWORD } }),
    ).resolves.toHaveProperty('token')
  })
})

describe('Finding A3 (low): admin screens that skip access rules don’t check the code', () => {
  // Today the admin's two-factor redirect stops these screens rendering before the code is
  // entered. These tests check each screen protects itself too, so a change to the redirect
  // (or a new way to render the screen) can't expose another club's data.
  it('the club home screen shows nothing to an editor who has not entered their code', async () => {
    const rendered = await ClubHome({ payload: p, user: withoutCode(editorWithCode) } as never)
    expect(rendered).toBeNull()
  })

  it('the club home screen shows no clubs to a super-admin who has not entered their code', async () => {
    const rendered = await ClubHome({ payload: p, user: withoutCode(w.superAdmin) } as never)
    expect(rendered).toBeNull()
  })

  it('the page tree shows nothing to an editor who has not entered their code', async () => {
    const rendered = await PageTree({ payload: p, user: withoutCode(editorWithCode) } as never)
    expect(rendered).toBeNull()
  })

  it('(control) the club home screen does render for a fully signed-in editor', async () => {
    const rendered = await ClubHome({ payload: p, user: w.editorA } as never)
    expect(rendered).not.toBeNull()
  })
})

describe('Finding A4 (low): the sign-in lockout tells a stranger which emails have accounts', () => {
  const failedLogin = (email: string) =>
    p
      .login({ collection: 'users', data: { email, password: 'wrong-password-xyz' } })
      .then(() => 'signed in')
      .catch((e: Error) => e.message)

  it('a locked account answers exactly like an address with no account', async () => {
    const email = 'audit-lock@example.com'
    await createEditor(p, email, w.clubB.id)
    for (let i = 0; i < 5; i++) await failedLogin(email)
    const locked = await failedLogin(email)
    const unknown = await failedLogin('no-such-account@example.com')
    expect(locked).toBe(unknown)
  })
})

describe('Finding A5 (low): Payload’s cross-site request check is switched off', () => {
  it('the login cookie is only accepted from the admin’s own address', () => {
    // With an empty list Payload accepts the login cookie from any Origin, leaving only the
    // cookie's SameSite=Lax setting (src/collections/Users.ts) to stop cross-site requests.
    expect(p.config.csrf.length).toBeGreaterThan(0)
  })
})

describe('guards: checked and safe today', () => {
  it('an editor cannot unlock another account (which would also clear its code lockout)', async () => {
    // Users has no `unlock` rule; it is refused only because usersAccessResultOverride
    // (src/payload.config.ts) returns false for a rule that doesn't exist.
    await expect(
      p.unlock({
        collection: 'users',
        data: { email: 'super@example.com' } as never,
        overrideAccess: false,
        req: { user: w.editorA } as never,
      }),
    ).rejects.toThrow()
  })

  it('an editor cannot clear their own two-factor secret by saving their account', async () => {
    await p
      .update({
        collection: 'users',
        id: editorWithCode.id,
        data: { totpSecret: null } as never,
        overrideAccess: false,
        user: editorWithCode,
      })
      .catch(() => null)
    const me = await p.findByID({
      collection: 'users',
      id: editorWithCode.id,
      overrideAccess: true,
      depth: 0,
    })
    expect((me as { hasTotp?: boolean }).hasTotp).toBe(true)
  })

  it('a super-admin with their code cannot move an editor to another club', async () => {
    await expect(
      p.update({
        collection: 'users',
        id: w.editorA2.id,
        data: { tenant: w.clubB.id },
        overrideAccess: false,
        user: w.superAdmin,
      }),
    ).resolves.toBeDefined() // the field is silently ignored…
    const after = await p.findByID({ collection: 'users', id: w.editorA2.id, depth: 0 })
    expect(after.tenant).toBe(w.clubA.id) // …so the editor stays in club A
  })
})
