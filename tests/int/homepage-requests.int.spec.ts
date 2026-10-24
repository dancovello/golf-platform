/**
 * The Homepage Request Form on the Switching page (plan phase 5.2): saved for the super-admin
 * alone, protected like the club Contact form, emailed, and deleted after 12 months.
 */
import { sql } from '@payloadcms/db-postgres'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteOldHomepageRequests } from '@/privacy/cleanUp'
import { sendHomepageRequestEmails } from '@/marketing/requests/alert'
import {
  HOURLY_LIMIT,
  REQUEST_FORM_SCOPE,
  submitHomepageRequest,
} from '@/marketing/requests/submit'
import {
  allowRequest,
  HOMEPAGE_REQUEST_VISITOR_LIMIT,
  HOMEPAGE_REQUESTS_EMAILED_PER_DAY,
  WEBSITE_FORM_EMAILS,
} from '@/security/rateLimit'
import { issueFormToken } from '@/site/contact/formToken'

import { seedWorld, type World } from './helpers/seed'

let w: World

// Tuesday 20 October 2026, mid-morning: due Thursday 22 October (the Figma example).
const NOW = new Date('2026-10-20T10:00:00Z')

const form = (
  fields: Record<string, string> = {},
  opts: { scope?: string; age?: number; at?: Date } = {},
) => {
  const data = new FormData()
  const shownAt = (opts.at ?? NOW).getTime() - (opts.age ?? 10_000)
  data.set('token', issueFormToken(opts.scope ?? REQUEST_FORM_SCOPE, shownAt))
  const values = {
    clubName: 'Ashgrove Park Golf Club',
    currentSite: 'ashgroveparkgc.co.uk',
    email: 'secretary@ashgrove.example',
    ...fields,
  }
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

const send = (data: FormData, onSaved?: (id: string) => void) =>
  submitHomepageRequest({ attempt: 0 }, data, NOW, onSaved)

const saved = async () =>
  (
    await w.payload.find({
      collection: 'homepage-requests',
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })
  ).docs

type Executor = Parameters<typeof allowRequest>[0]
const db = () => (w.payload.db as unknown as { drizzle: Executor }).drizzle

// Requests and the limit counts both start empty in each test.
const clear = async () => {
  await w.payload.delete({
    collection: 'homepage-requests',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
  await db().execute(sql`DELETE FROM rate_limits`)
}

beforeAll(async () => {
  w = await seedWorld()
})
beforeEach(clear)

describe('asking for a free homepage', () => {
  it('saves the request and promises it two UK working days later', async () => {
    const result = await send(form())
    expect(result.sent).toEqual({
      email: 'secretary@ashgrove.example',
      dueBy: 'Thursday 22 October',
    })
    expect(result.values.clubName).toBe('')
    const [request] = await saved()
    expect(request.clubName).toBe('Ashgrove Park Golf Club')
    // The address is tidied: "https://" added, as the form accepts it without.
    expect(request.website).toBe('https://ashgroveparkgc.co.uk')
    expect(request.status).toBe('new')
    expect(request.dueBy.slice(0, 10)).toBe('2026-10-22')
  })

  it('sends mistakes back with the typed values kept', async () => {
    const result = await send(form({ clubName: ' ', currentSite: 'not a site', email: 'nope' }))
    expect(result.sent).toBeNull()
    expect(Object.keys(result.errors).sort()).toEqual(['clubName', 'email', 'website'])
    expect(result.values.website).toBe('not a site')
    expect(await saved()).toHaveLength(0)
  })

  it('a person pressing the button at once on an empty form is told what to fill in', async () => {
    const result = await send(form({ clubName: '', currentSite: '', email: '' }, { age: 500 }))
    expect(result.sent).toBeNull()
    expect(Object.keys(result.errors)).toHaveLength(3)
    expect(await saved()).toHaveLength(0)
  })

  it('bots that fill the hidden box, or send too fast, see "sent" but nothing is saved', async () => {
    const trapped = form({ website: 'https://spam.example' })
    expect((await send(trapped)).sent).not.toBeNull()
    expect((await send(form({}, { age: 500 }))).sent).not.toBeNull()
    expect(await saved()).toHaveLength(0)
  })

  it('refuses an old form, or a token from another form', async () => {
    expect((await send(form({}, { age: 25 * 60 * 60 * 1000 }))).formError).toMatch(
      /open a long time/,
    )
    expect((await send(form({}, { scope: w.clubA.id }))).formError).toMatch(/open a long time/)
    expect(await saved()).toHaveLength(0)
  })

  it(`takes at most ${HOURLY_LIMIT} requests an hour`, async () => {
    for (let i = 0; i < HOURLY_LIMIT; i++) {
      await w.payload.create({
        collection: 'homepage-requests',
        data: {
          status: 'new',
          clubName: `Flood ${i}`,
          website: 'https://flood.example',
          email: 'flood@example.com',
          dueBy: NOW.toISOString(),
        },
        overrideAccess: true,
      })
    }
    // The flood was saved just now, in real time, so the form is sent "now" too.
    const now = new Date()
    const result = await submitHomepageRequest({ attempt: 0 }, form({}, { at: now }), now)
    expect(result.formError).toMatch(/a lot of requests/)
    expect(await saved()).toHaveLength(HOURLY_LIMIT)
  })
})

describe("Cloudflare's spam check is made for this form", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  const cloudflare = (answer: Record<string, unknown>) => {
    vi.stubEnv('TURNSTILE_SITE_KEY', 'test-site-key')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test-only-not-a-real-secret')
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(answer)),
    )
  }

  it('accepts a check made for the homepage form, and refuses one made for the Contact form', async () => {
    cloudflare({ success: true, action: 'contact' })
    const other = form()
    other.set('turnstile', 'token')
    expect((await send(other)).formError).toMatch(/came from a person/)
    cloudflare({ success: true, action: 'homepage' })
    const ours = form()
    ours.set('turnstile', 'token')
    expect((await send(ours)).sent).not.toBeNull()
    expect(await saved()).toHaveLength(1)
  })
})

describe('only the super-admin sees requests', () => {
  it('club editors can’t read, change or delete them, and nobody creates them by hand', async () => {
    await send(form())
    const [request] = await saved()
    const asEditor = { overrideAccess: false as const, user: w.editorA }
    await expect(w.payload.find({ collection: 'homepage-requests', ...asEditor })).rejects.toThrow()
    await expect(
      w.payload.update({
        collection: 'homepage-requests',
        id: request.id,
        data: { status: 'closed' },
        ...asEditor,
      }),
    ).rejects.toThrow()
    await expect(
      w.payload.delete({ collection: 'homepage-requests', id: request.id, ...asEditor }),
    ).rejects.toThrow()
    await expect(
      w.payload.create({
        collection: 'homepage-requests',
        data: {
          status: 'new',
          clubName: 'X',
          website: 'https://x.example',
          email: 'x@x.example',
          dueBy: NOW.toISOString(),
        },
        overrideAccess: false,
        user: w.superAdmin,
      }),
    ).rejects.toThrow()
    const asAdmin = { overrideAccess: false as const, user: w.superAdmin }
    const found = await w.payload.find({ collection: 'homepage-requests', ...asAdmin })
    expect(found.totalDocs).toBe(1)
    const marked = await w.payload.update({
      collection: 'homepage-requests',
      id: request.id,
      data: { status: 'sent', email: 'changed@example.com' },
      ...asAdmin,
    })
    // What the club sent stays as sent.
    expect(marked.status).toBe('sent')
    expect(marked.email).toBe('secretary@ashgrove.example')
  })
})

describe('limits, as on the club Contact form (public forms audit)', () => {
  it('one visitor gets 5 sends in 10 minutes; another visitor can still send', async () => {
    const asVisitor = (ip: string) => () =>
      allowRequest(db(), HOMEPAGE_REQUEST_VISITOR_LIMIT, ip, NOW)
    for (let i = 0; i < HOMEPAGE_REQUEST_VISITOR_LIMIT.max; i++) {
      const ok = await submitHomepageRequest(
        { attempt: 0 },
        form({ clubName: `Club ${i}` }),
        NOW,
        undefined,
        {
          visitorAllowed: asVisitor('203.0.113.9'),
        },
      )
      expect(ok.sent).not.toBeNull()
    }
    const sixth = await submitHomepageRequest({ attempt: 0 }, form(), NOW, undefined, {
      visitorAllowed: asVisitor('203.0.113.9'),
    })
    expect(sixth.formError).toMatch(/a lot of requests/)
    const other = await submitHomepageRequest({ attempt: 0 }, form(), NOW, undefined, {
      visitorAllowed: asVisitor('198.51.100.4'),
    })
    expect(other.sent).not.toBeNull()
  })

  it(`never saves more than ${HOURLY_LIMIT} in an hour, even when sent all at once`, async () => {
    await Promise.all(
      Array.from({ length: HOURLY_LIMIT + 15 }, (_, i) => send(form({ clubName: `At once ${i}` }))),
    )
    expect((await saved()).length).toBeLessThanOrEqual(HOURLY_LIMIT)
  })

  it('refuses addresses that could not be saved or could add reply addresses', async () => {
    for (const email of [
      'a,b@example.com',
      'A <a@example.com>',
      '"a"@example.com',
      'josé@example.com',
    ]) {
      const result = await send(form({ email }))
      expect(result.errors.email, email).toMatch(/like you@yourclub/)
    }
    expect(await saved()).toHaveLength(0)
  })
})

describe('emails', () => {
  afterEach(async () => {
    vi.restoreAllMocks()
    delete process.env.RESEND_API_KEY
    await w.payload.updateGlobal({
      slug: 'marketing-settings',
      data: { requests: { inbox: null } } as never,
      overrideAccess: true,
    })
  })
  const sendAndKeepID = async () => {
    let id = ''
    await send(form(), (saved) => {
      id = saved
    })
    return id
  }

  it('sends nothing when email isn’t set up', async () => {
    const sendEmail = vi.spyOn(w.payload, 'sendEmail')
    const id = await sendAndKeepID()
    expect(await sendHomepageRequestEmails(id)).toEqual({
      alert: 'email-off',
      confirmation: 'email-off',
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('emails the inbox from Settings, and a plain confirmation to the club without their link', async () => {
    process.env.RESEND_API_KEY = 'test-only'
    await w.payload.updateGlobal({
      slug: 'marketing-settings',
      data: { requests: { inbox: 'requests@company.example' } } as never,
      overrideAccess: true,
    })
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    const id = await sendAndKeepID()
    expect(await sendHomepageRequestEmails(id)).toEqual({ alert: 'sent', confirmation: 'sent' })
    const [alert, confirmation] = sendEmail.mock.calls.map((c) => c[0] as Record<string, string>)
    expect(alert.to).toBe('requests@company.example')
    expect(alert.replyTo).toBe('secretary@ashgrove.example')
    expect(alert.subject).toBe(
      'Homepage request: Ashgrove Park Golf Club (due Thursday 22 October)',
    )
    expect(alert.text).toContain('Current website: https://ashgroveparkgc.co.uk')
    expect(confirmation.to).toBe('secretary@ashgrove.example')
    expect(confirmation.replyTo).toBe('requests@company.example')
    expect(confirmation.text).toContain('by Thursday 22 October')
    expect(confirmation.text).not.toContain('ashgroveparkgc')
    expect(confirmation).not.toHaveProperty('html')
    const request = await w.payload.findByID({
      collection: 'homepage-requests',
      id,
      overrideAccess: true,
    })
    expect(request.alertSentAt).toBeTruthy()
    expect(request.confirmationSentAt).toBeTruthy()
  })

  it(`emails at most ${HOMEPAGE_REQUESTS_EMAILED_PER_DAY.max} requests a day, and keeps the rest`, async () => {
    process.env.RESEND_API_KEY = 'test-only'
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    vi.spyOn(w.payload.logger, 'warn').mockImplementation(() => undefined)
    const results = []
    for (let i = 0; i <= HOMEPAGE_REQUESTS_EMAILED_PER_DAY.max; i++) {
      results.push(await sendHomepageRequestEmails(await sendAndKeepID()))
    }
    expect(results.at(-1)).toEqual({ alert: 'daily-limit', confirmation: 'daily-limit' })
    // No inbox set: one confirmation each, for the first 10 only.
    expect(sendEmail).toHaveBeenCalledTimes(HOMEPAGE_REQUESTS_EMAILED_PER_DAY.max)
    expect(await saved()).toHaveLength(HOMEPAGE_REQUESTS_EMAILED_PER_DAY.max + 1)
  })

  it('sends nothing once the website forms have used their shared daily emails', async () => {
    process.env.RESEND_API_KEY = 'test-only'
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    vi.spyOn(w.payload.logger, 'warn').mockImplementation(() => undefined)
    // The Contact form has used the whole allowance today (the 30 kept back are for
    // password resets and invitations, which don't count here).
    for (let i = 0; i < WEBSITE_FORM_EMAILS.max; i++) {
      await allowRequest(db(), WEBSITE_FORM_EMAILS, 'all')
    }
    const id = await sendAndKeepID()
    expect(await sendHomepageRequestEmails(id)).toEqual({
      alert: 'no-inbox',
      confirmation: 'daily-limit',
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('without an inbox, still confirms to the club and keeps the request', async () => {
    process.env.RESEND_API_KEY = 'test-only'
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    vi.spyOn(w.payload.logger, 'warn').mockImplementation(() => undefined)
    const id = await sendAndKeepID()
    expect(await sendHomepageRequestEmails(id)).toEqual({ alert: 'no-inbox', confirmation: 'sent' })
    expect(sendEmail).toHaveBeenCalledTimes(1)
  })
})

describe('kept 12 months after the last contact (decision F)', () => {
  it('the nightly clean-up deletes requests untouched for 12 months, and only those', async () => {
    await send(form())
    const later = new Date(Date.now() + 366 * 24 * 60 * 60 * 1000)
    const soon = new Date(Date.now() + 300 * 24 * 60 * 60 * 1000)
    expect(await deleteOldHomepageRequests(w.payload, soon)).toBe(0)
    expect(await saved()).toHaveLength(1)
    expect(await deleteOldHomepageRequests(w.payload, later)).toBe(1)
    expect(await saved()).toHaveLength(0)
  })
})
