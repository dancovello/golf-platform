import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

/**
 * Security audit of the public forms, 22 October 2026 (docs/security/audit-public-forms.md).
 *
 * Tests marked `it.fails` prove a finding: they describe what SHOULD happen, and fail today
 * because of the problem. `it.fails` turns that failure into a pass, so CI isn't blocked.
 * When a fix lands, its test starts "unexpectedly passing": change `it.fails` to `it` in the
 * fix's pull request.
 */

// The Contact form's Send button is a Next.js server action that reads the request's headers.
// Here we play the part of the proxy (src/proxy.ts): it sets x-club-host from the address the
// visitor used, and Vercel sets x-real-ip.
const request = { host: 'club-a.localhost', ip: '203.0.113.7' }
vi.mock('next/headers', () => ({
  headers: async () =>
    new Headers({ 'x-club-host': request.host, 'x-real-ip': request.ip, host: request.host }),
}))
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  // The alert email runs after the reply in the app; these tests don't need it.
  after: () => {},
}))
vi.mock('next/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/navigation')>()),
  notFound: () => {
    throw new Error('NOT_FOUND')
  },
}))

const { sendEnquiry } = await import('@/site/contact/actions')
const { sendEnquiryAlert } = await import('@/site/contact/alert')
const { issueFormToken } = await import('@/site/contact/formToken')
const { HOURLY_LIMIT, submitEnquiry } = await import('@/site/contact/submit')
const { enquiry, seedWorld } = await import('./helpers/seed')

type World = Awaited<ReturnType<typeof seedWorld>>
let w: World

const form = (tenantID: string, fields: Record<string, string> = {}, shownAt = Date.now()) => {
  const data = new FormData()
  // Shown 10 seconds ago: past the "too fast to be a person" check.
  data.set('token', issueFormToken(tenantID, shownAt - 10_000))
  const values = {
    purpose: 'general',
    name: 'Audit Visitor',
    email: 'audit.visitor@example.com',
    message: 'A question about the course.',
    ...fields,
  }
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

const fresh = { attempt: 0 } as Parameters<typeof sendEnquiry>[1]

const savedIn = async (tenant: string) =>
  (
    await w.payload.count({
      collection: 'enquiries',
      where: { tenant: { equals: tenant } },
      overrideAccess: true,
    })
  ).totalDocs

beforeAll(async () => {
  w = await seedWorld()
})

/** A club of its own for one test, so other tests' messages don't count towards its limits. */
const newClub = (name: string, hostname: string) =>
  w.payload.create({
    collection: 'tenants',
    data: { name, domains: [{ hostname }] },
    overrideAccess: true,
  })

afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.RESEND_API_KEY
  request.host = 'club-a.localhost'
  request.ip = '203.0.113.7'
})

describe('club separation on the Contact form (checked: no finding)', () => {
  it("saves into the club whose address it was sent to, whatever club the page's form names", async () => {
    const beforeA = await savedIn(w.clubA.id)
    const beforeB = await savedIn(w.clubB.id)
    // A visitor on club A's domain edits the form's hidden club name to club B's.
    const result = await sendEnquiry(String(w.clubB.slug), fresh, form(w.clubA.id))
    expect(result.sent).not.toBeNull()
    expect(await savedIn(w.clubA.id)).toBe(beforeA + 1)
    expect(await savedIn(w.clubB.id)).toBe(beforeB)
  })

  it("refuses club B's form token on club A's address, so a message can't be steered", async () => {
    const before = await savedIn(w.clubB.id)
    const result = await sendEnquiry(String(w.clubB.slug), fresh, form(w.clubB.id))
    expect(result.sent).toBeNull()
    expect(await savedIn(w.clubB.id)).toBe(before)
  })
})

describe('Finding 1 (medium): one visitor can use up a club’s whole hourly allowance', () => {
  // The only per-visitor limit is Vercel Firewall rule 3, which matches POSTs whose path ends
  // in /contact (docs/operations/rate-limits.md). A server action runs from ANY page address
  // (Next.js forwards it), so posting to "/" or "/news" skips that rule. The app itself only
  // counts per club. Each send still needs a Turnstile pass, but those can be bought cheaply.
  it('a second visitor can still send after one visitor has sent many in a row', async () => {
    request.host = 'club-b.localhost'
    const already = await savedIn(w.clubB.id)
    const token = form(w.clubB.id).get('token') as string
    request.ip = '203.0.113.66'
    // One visitor, one form token reused every time (it stays valid for 24 hours).
    for (let i = already; i < HOURLY_LIMIT; i++) {
      const data = form(w.clubB.id, { message: `Flood ${i}` })
      data.set('token', token)
      await sendEnquiry('ignored-on-a-club-domain', fresh, data)
    }
    // A real visitor, from a different address, a minute later.
    request.ip = '198.51.100.20'
    const real = await sendEnquiry('ignored', fresh, form(w.clubB.id))
    expect(real.formError).toBeNull()
    expect(real.sent).not.toBeNull()
  })
})

describe('Finding 2 (medium): one club’s messages can use up every club’s email allowance', () => {
  // Each new message emails the club. The platform's Resend plan allows 100 emails a day for
  // EVERY club's alerts AND every editor's password reset together (decisions.md, 16 Oct).
  // One club's form takes 20 an hour (480 a day), with no daily cap on alerts, so a flood at
  // one club stops other clubs' alerts and everyone's password-reset emails for the day.
  it('stops emailing one club before it has used a quarter of the daily allowance', async () => {
    // Club A's footer email is set by the seed, so its alerts have somewhere to go. These are
    // saved straight into the club (as the form would), spread over a day, all at once here.
    process.env.RESEND_API_KEY = 'test-only'
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    const ids: string[] = []
    for (let i = 0; i < 26; i++) {
      ids.push(String((await enquiry(w.payload, `Alert flood ${i}`, w.clubA.id)).id))
    }
    for (const id of ids) await sendEnquiryAlert(id).catch(() => undefined)
    expect(sendEmail.mock.calls.length).toBeLessThanOrEqual(25)
  })
})

describe('Finding 3 (low): the per-club hourly limit can be overshot', () => {
  // submit.ts counts the last hour's messages, then saves: two steps, not one. Messages
  // arriving at the same moment all see room for one more.
  it(`never saves more than ${HOURLY_LIMIT} in an hour, even when sent all at once`, async () => {
    const clubC = await newClub('Audit Club C', 'club-c.localhost')
    const now = new Date()
    await Promise.all(
      Array.from({ length: HOURLY_LIMIT + 15 }, (_, i) =>
        submitEnquiry(
          String(clubC.slug),
          { attempt: 0 },
          form(clubC.id, { message: `At once ${i}` }, now.getTime()),
          now,
        ),
      ),
    )
    expect(await savedIn(clubC.id)).toBeLessThanOrEqual(HOURLY_LIMIT)
  })
})

describe('Finding 4 (low): some email addresses pass the form but are refused on save', () => {
  // The form's own email check (validate.ts) is looser than Payload's (the collection's email
  // field). An address only the form accepts gets past every check, then the save throws: the
  // visitor sees an error page and their message is lost. Payload's stricter check is also what
  // stops "a,b@…" or "<…>" addresses reaching the email's Reply-To, so it must stay.
  it('shows a field error, not an error page, for an address it cannot save', async () => {
    const clubD = await newClub('Audit Club D', 'club-d.localhost')
    request.host = 'club-d.localhost'
    // Also refused on save today: "a,b@example.com", "a_b@sub_d.example.com".
    const result = await sendEnquiry(
      'ignored',
      fresh,
      form(clubD.id, { email: 'josé@example.com' }),
    )
    expect(result.errors.email).toBeTruthy()
    expect(await savedIn(clubD.id)).toBe(0)
  })
})
