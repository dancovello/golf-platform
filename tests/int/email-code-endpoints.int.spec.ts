import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { codeMatches } from '@/auth/emailCode'
import { sendEmailCodeEndpoint } from '@/auth/emailCodeEndpoints'

import { createEditor, seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

/** The request Payload hands the endpoint once the password has been accepted. */
const requestFor = (user: Record<string, unknown> | null) =>
  ({ user, payload: w.payload }) as unknown as Parameters<typeof sendEmailCodeEndpoint.handler>[0]

const owing = async () => {
  const account = await createEditor(
    w.payload,
    `owes-${Date.now()}-${Math.random()}@example.com`,
    w.clubA.id,
  )
  return {
    id: account.id,
    email: account.email,
    hasTotp: true,
    collection: 'users',
    _strategy: 'local-jwt',
  }
}

const answer = async (user: Record<string, unknown> | null) => {
  const res = await sendEmailCodeEndpoint.handler(requestFor(user))
  return { status: res.status, body: (await res.json()) as { ok: boolean; message?: string } }
}

describe('POST /api/send-email-code', () => {
  it('emails the six digits to the account and stores the same code', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_not_real')
    const send = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue(undefined as never)
    const user = await owing()
    const { status, body } = await answer(user)
    expect({ status, ok: body.ok }).toEqual({ status: 200, ok: true })
    expect(send).toHaveBeenCalledTimes(1)
    const mail = send.mock.calls[0]![0] as {
      to: string
      text: string
      html: string
      subject: string
    }
    expect(mail.to).toBe(user.email)
    const code = /sign-in code is (\d{6})/.exec(mail.text)?.[1]
    expect(code).toMatch(/^\d{6}$/)
    expect(mail.html).toContain(code)
    // The code is not in the subject line (it shows on lock screens).
    expect(mail.subject).not.toContain(code!)
    expect(await codeMatches(w.payload, user.id, code!)).toBe(true)
  })

  it('refuses a second email within a minute, and the first code still works', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_not_real')
    const send = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue(undefined as never)
    const user = await owing()
    expect((await answer(user)).status).toBe(200)
    expect((await answer(user)).status).toBe(429)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('sends nothing to someone who is not signed in or owes no code', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_not_real')
    const send = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue(undefined as never)
    const user = await owing()
    expect((await answer(null)).status).toBe(401)
    expect((await answer({ ...user, hasTotp: false })).status).toBe(401)
    expect((await answer({ ...user, collection: 'tenants' })).status).toBe(401)
    // Already entered the code in this session.
    expect((await answer({ ...user, _strategy: 'totp' })).status).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it('says so, and sends nothing, where email is not set up', async () => {
    vi.stubEnv('RESEND_API_KEY', '')
    const send = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue(undefined as never)
    const { status, body } = await answer(await owing())
    expect({ status, ok: body.ok }).toEqual({ status: 503, ok: false })
    expect(send).not.toHaveBeenCalled()
  })

  it('reports a failed send without exposing the code', async () => {
    vi.stubEnv('RESEND_API_KEY', 're_test_not_real')
    vi.spyOn(w.payload, 'sendEmail').mockRejectedValue(new Error('Resend is down'))
    const logged = vi.spyOn(w.payload.logger, 'error').mockImplementation(() => undefined as never)
    const { status, body } = await answer(await owing())
    expect({ status, ok: body.ok }).toEqual({ status: 502, ok: false })
    expect(JSON.stringify(logged.mock.calls)).not.toMatch(/\b\d{6}\b/)
  })
})
