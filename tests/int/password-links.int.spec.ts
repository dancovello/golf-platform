import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { linkEmailContent, resetLinkEmailLimit } from '@/accounts/inviteEmail'
import { createPasswordLink, inviteEditor, PASSWORD_LINK_HOURS } from '@/accounts/passwordLinks'
import { adminURL, resetEmailHTML } from '@/accounts/resetEmail'

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

describe('public "Forgot password?" is off where email isn\'t set up', () => {
  it('refuses, for real and made-up addresses alike', async () => {
    for (const email of [w.editorA.email, 'nobody@example.com']) {
      await expect(
        w.payload.forgotPassword({ collection: 'users', data: { email }, disableEmail: true }),
      ).rejects.toThrow(/Ask your platform administrator/)
    }
  })
})

describe('"Forgot password?" by email, where email is set up', () => {
  const on = () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only-not-a-real-key')
    vi.stubEnv('ADMIN_URL', 'https://admin.example.com/')
  }
  afterEach(() => vi.unstubAllEnvs())

  const tokenFor = async (id: string) =>
    (
      (await w.payload.findByID({
        collection: 'users',
        id,
        overrideAccess: true,
        showHiddenFields: true,
      })) as { resetPasswordToken?: string | null }
    ).resetPasswordToken ?? null

  it('answers the same for real and made-up addresses', async () => {
    on()
    for (const email of [w.editorA.email, 'nobody@example.com']) {
      await expect(
        w.payload.forgotPassword({ collection: 'users', data: { email }, disableEmail: true }),
      ).resolves.not.toThrow()
    }
  })

  it('sends at most one email per account every 15 minutes, and keeps the first link working', async () => {
    on()
    const email = w.editorB.email
    await w.payload.forgotPassword({ collection: 'users', data: { email } })
    const first = await tokenFor(w.editorB.id)
    expect(first).toBeTruthy()
    // A minute later (past Payload's own 15-second default): still ignored.
    vi.useFakeTimers({ toFake: ['Date'], now: Date.now() + 60_000 })
    try {
      await w.payload.forgotPassword({ collection: 'users', data: { email } })
      expect(await tokenFor(w.editorB.id)).toBe(first)
      // 16 minutes later: a new email and link.
      vi.setSystemTime(Date.now() + 15 * 60_000)
      await w.payload.forgotPassword({ collection: 'users', data: { email } })
      expect(await tokenFor(w.editorB.id)).not.toBe(first)
    } finally {
      vi.useRealTimers()
    }
  })

  it('links to ADMIN_URL, never to the address a request came from', () => {
    on()
    expect(resetEmailHTML('abc123')).toContain(
      'href="https://admin.example.com/admin/reset/abc123"',
    )
  })

  it('needs a proper ADMIN_URL', () => {
    for (const bad of ['', 'not a url', 'http://admin.example.com', 'ftp://admin.example.com']) {
      vi.stubEnv('ADMIN_URL', bad)
      expect(adminURL(), bad).toBeNull()
    }
    vi.stubEnv('ADMIN_URL', 'http://localhost:3000')
    expect(adminURL()).toBe('http://localhost:3000')
  })

  it('still refuses without ADMIN_URL, even with email set up', async () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only-not-a-real-key')
    await expect(
      w.payload.forgotPassword({
        collection: 'users',
        data: { email: w.editorA.email },
        disableEmail: true,
      }),
    ).rejects.toThrow(/Ask your platform administrator/)
  })
})

describe('invitations and new links by email (plan part C)', () => {
  const on = () => {
    vi.stubEnv('RESEND_API_KEY', 'test-only-not-a-real-key')
    vi.stubEnv('ADMIN_URL', 'https://admin.example.com/')
  }
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    resetLinkEmailLimit()
  })

  it('emails the invitation, naming the club, with a link on ADMIN_URL', async () => {
    on()
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    const invite = await inviteEditor(w.payload, {
      email: 'emailed@example.com',
      tenant: w.clubA.id,
      serverURL: 'https://forged.example.net',
    })
    expect(invite.emailed).toBe(true)
    expect(invite.link).toMatch(/^https:\/\/admin\.example\.com\/admin\/reset\/[a-f0-9]+$/)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const sent = sendEmail.mock.calls[0][0] as Record<string, string>
    expect(sent.to).toBe('emailed@example.com')
    expect(sent.subject).toBe(`You're invited to edit the ${w.clubA.name} website`)
    expect(sent.text).toContain(invite.link)
    expect(sent.text).toContain(`${PASSWORD_LINK_HOURS} hours`)
    expect(sent.text).not.toContain('forged.example.net')
    expect(sent.text).not.toContain(w.clubB.name)
  })

  it('sends nothing where email or ADMIN_URL is missing, and the link is still shown', async () => {
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    const noEmail = await createPasswordLink(w.payload, {
      userID: w.editorA2.id,
      serverURL: SERVER,
    })
    expect(noEmail).toMatchObject({ emailed: false, emailNote: null })
    vi.stubEnv('RESEND_API_KEY', 'test-only-not-a-real-key')
    const noAdminURL = await createPasswordLink(w.payload, {
      userID: w.editorA2.id,
      serverURL: SERVER,
    })
    expect(noAdminURL.emailed).toBe(false)
    expect(noAdminURL.link.startsWith(SERVER)).toBe(true)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('a second link within 15 minutes is shown but not emailed again', async () => {
    on()
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    const first = await createPasswordLink(w.payload, { userID: w.editorA2.id, serverURL: SERVER })
    const second = await createPasswordLink(w.payload, { userID: w.editorA2.id, serverURL: SERVER })
    expect(first.emailed).toBe(true)
    expect(second.emailed).toBe(false)
    expect(second.emailNote).toContain('last 15 minutes')
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })

  it("a failed email doesn't lose the link", async () => {
    on()
    vi.spyOn(w.payload, 'sendEmail').mockRejectedValue(new Error('Resend is down'))
    const result = await createPasswordLink(w.payload, { userID: w.editorA2.id, serverURL: SERVER })
    expect(result.emailed).toBe(false)
    expect(result.emailNote).toContain("couldn't be sent")
    expect(result.link).toContain('/admin/reset/')
  })

  it('keeps the club name from breaking the subject line', () => {
    const { subject } = linkEmailContent({
      to: 'x@example.com',
      clubName: 'Evil\r\nBcc: everyone@example.com',
      link: 'https://admin.example.com/admin/reset/abc',
      expiresInHours: 72,
      kind: 'new-link',
    })
    expect(subject).not.toMatch(/[\r\n]/)
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
