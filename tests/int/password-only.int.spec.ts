/**
 * Safeguards that come with password-only club editors (decisions.md, 22 Oct): sessions end
 * after 8 hours, and a changed password is emailed to the account.
 */
import type { Payload, PayloadRequest } from 'payload'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { endLongEditorSessions } from '@/auth/sessionLimit'

import { PASSWORD, seedWorld, type World } from './helpers/seed'

let w: World
let p: Payload

beforeAll(async () => {
  w = await seedWorld()
  p = w.payload
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

type Session = { id: string; createdAt: string; expiresAt: string }
const sessionsOf = async (id: string) =>
  (
    (await p.db.findOne({ collection: 'users', where: { id: { equals: id } } })) as {
      sessions?: Session[]
    }
  ).sessions ?? []

const refresh = (user: { id: string; role?: string | null }, sid: string) =>
  endLongEditorSessions({
    args: {},
    operation: 'refresh',
    req: { user: { ...user, _sid: sid }, payload: p } as unknown as PayloadRequest,
    collection: p.collections.users.config,
    context: {},
  } as never)

describe('editor sessions end 8 hours after login', () => {
  it('renews a recent session, and deletes one older than 8 hours (signing the editor out)', async () => {
    const login = await p.login({
      collection: 'users',
      data: { email: 'editor-a@example.com', password: PASSWORD },
    })
    const [session] = (await sessionsOf(w.editorA.id)).slice(-1)
    expect(session).toBeDefined()
    await expect(refresh(w.editorA, session!.id)).resolves.toBeDefined()

    // Pretend the editor logged in 9 hours ago.
    const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString()
    const aged = (await sessionsOf(w.editorA.id)).map((s) =>
      s.id === session!.id ? { ...s, createdAt: nineHoursAgo } : s,
    )
    await p.db.updateOne({ collection: 'users', id: w.editorA.id, data: { sessions: aged } })
    await expect(refresh(w.editorA, session!.id)).rejects.toThrow(/8 hours/)
    expect((await sessionsOf(w.editorA.id)).map((s) => s.id)).not.toContain(session!.id)
    expect(login.token).toBeTruthy()
  })

  it("super-admins' sessions (with two-factor) are renewed as normal", async () => {
    const nineHoursAgo = new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString()
    const sid = 'old-super-admin-session'
    await p.db.updateOne({
      collection: 'users',
      id: w.superAdmin.id,
      data: {
        sessions: [
          {
            id: sid,
            createdAt: nineHoursAgo,
            expiresAt: new Date(Date.now() + 3600_000).toISOString(),
          },
        ],
      },
    })
    await expect(refresh(w.superAdmin, sid)).resolves.toBeDefined()
  })
})

describe('a changed password is emailed to the account', () => {
  it('when the account changes its own password', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only')
    const sent = vi.spyOn(p, 'sendEmail').mockResolvedValue(undefined)
    await p.update({
      collection: 'users',
      id: w.editorA2.id,
      data: { password: 'another-long-password' },
      overrideAccess: false,
      user: w.editorA2,
    })
    expect(sent).toHaveBeenCalledTimes(1)
    expect(sent.mock.calls[0]![0]).toMatchObject({ to: 'editor-a2@example.com' })
    expect(String((sent.mock.calls[0]![0] as { text: string }).text)).not.toContain('another-long')
  })

  it('not when something else about the account changes', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only')
    const sent = vi.spyOn(p, 'sendEmail').mockResolvedValue(undefined)
    await p.update({
      collection: 'users',
      id: w.editorA2.id,
      data: { name: 'New name' } as never,
      overrideAccess: true,
    })
    expect(sent).not.toHaveBeenCalled()
  })

  it('sends nothing where email is not set up', async () => {
    const sent = vi.spyOn(p, 'sendEmail').mockResolvedValue(undefined)
    await p.update({
      collection: 'users',
      id: w.editorA2.id,
      data: { password: 'yet-another-long-password' },
      overrideAccess: true,
    })
    expect(sent).not.toHaveBeenCalled()
  })
})

describe('"Forgot password?", the whole way through (with a stand-in mailbox)', () => {
  it('emails a one-time link; the link sets a new password; the old one stops working', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only')
    vi.stubEnv('ADMIN_URL', 'https://staging.example.com')
    const mailbox: { to: string; subject?: string; html?: string; text?: string }[] = []
    const toMailbox = async (message: unknown) => {
      mailbox.push(message as never)
    }
    // Payload sends its reset email through the adapter; our own emails use payload.sendEmail.
    vi.spyOn(p, 'sendEmail').mockImplementation(toMailbox)
    vi.spyOn(p.email, 'sendEmail').mockImplementation(toMailbox as never)
    const email = 'editor-b@example.com'
    await p.forgotPassword({ collection: 'users', data: { email }, disableEmail: false })

    const resetEmail = mailbox.find((m) => m.to === email && m.html?.includes('/admin/reset/'))
    expect(resetEmail, 'a reset email to the account').toBeDefined()
    const token = decodeURIComponent(/\/admin\/reset\/([^"]+)"/.exec(resetEmail!.html!)![1]!)
    expect(resetEmail!.html).toContain('https://staging.example.com/admin/reset/')

    await p.resetPassword({
      collection: 'users',
      data: { token, password: 'a-brand-new-password' },
      overrideAccess: true,
    })
    await expect(
      p.login({ collection: 'users', data: { email, password: 'a-brand-new-password' } }),
    ).resolves.toHaveProperty('token')
    await expect(
      p.login({ collection: 'users', data: { email, password: PASSWORD } }),
    ).rejects.toThrow()
    // And the account is told its password was set.
    expect(mailbox.some((m) => m.to === email && /password was set/i.test(String(m.subject)))).toBe(
      true,
    )
    // The link works once.
    await expect(
      p.resetPassword({
        collection: 'users',
        data: { token, password: 'a-third-password!' },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('answers the same whether or not the account exists (no email for an unknown one)', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only')
    vi.stubEnv('ADMIN_URL', 'https://staging.example.com')
    const sent = vi.spyOn(p.email, 'sendEmail').mockResolvedValue(undefined as never)
    // Payload's endpoint always replies "success"; what matters is that neither case throws.
    await expect(
      p.forgotPassword({
        collection: 'users',
        data: { email: 'nobody@example.com' },
        disableEmail: false,
      }),
    ).resolves.toBeNull()
    expect(sent).not.toHaveBeenCalled()
    // A second request within 15 minutes is also quiet: no email, no error.
    await expect(
      p.forgotPassword({
        collection: 'users',
        data: { email: 'editor-b@example.com' },
        disableEmail: false,
      }),
    ).resolves.toBeNull()
    expect(sent).not.toHaveBeenCalled()
  })
})
