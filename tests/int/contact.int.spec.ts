import { beforeAll, describe, expect, it } from 'vitest'

import { issueFormToken } from '@/site/contact/formToken'
import { HOURLY_LIMIT, submitEnquiry } from '@/site/contact/submit'

import { enquiry, seedWorld, type World } from './helpers/seed'

let w: World

// A Friday afternoon in UK summer time.
const NOW = new Date('2026-10-16T14:00:00Z')

const form = (fields: Record<string, string>, opts: { tenant?: string; age?: number } = {}) => {
  const data = new FormData()
  data.set('token', issueFormToken(opts.tenant ?? w.clubA.id, NOW.getTime() - (opts.age ?? 10_000)))
  const values = {
    purpose: 'membership',
    name: 'Dan Visitor',
    email: 'dan@example.com',
    membershipType: 'Five-day',
    message: 'Is there a waiting list for five-day membership?',
    ...fields,
  }
  for (const [key, value] of Object.entries(values)) data.set(key, value)
  return data
}

const send = (data: FormData, club = w.clubA) =>
  submitEnquiry(String(club.slug), { attempt: 0 }, data, NOW)

const savedIn = async (tenant: string) =>
  (
    await w.payload.find({
      collection: 'enquiries',
      where: { tenant: { equals: tenant } },
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })
  ).docs

beforeAll(async () => {
  w = await seedWorld()
  // Club A names who replies to membership messages and links to a page of its own.
  await w.payload.update({
    collection: 'club-settings',
    id: w.settingsA.id,
    data: {
      contact: {
        replyDays: 1,
        purposes: [
          {
            purpose: 'membership',
            replier: 'Sarah Cole, our membership secretary',
            nextLink: { label: 'Explore membership', type: 'page', page: w.pageA.id },
          },
        ],
        membershipTypes: [{ label: 'Five-day' }, { label: 'Seven-day' }],
      },
    },
    overrideAccess: true,
  })
})

describe('sending a message from the Contact page', () => {
  it('saves it in the club’s own Enquiries and says who replies, by when, with a reference', async () => {
    const before = (await savedIn(w.clubA.id)).length
    const result = await send(form({}))
    expect(result?.errors).toEqual({})
    expect(result?.sent).toMatchObject({
      firstName: 'Dan',
      replier: 'Sarah Cole, our membership secretary',
      email: 'dan@example.com',
      // Sent on a Friday with one working day to reply.
      replyBy: 'Monday 19 October',
      purposeLabel: 'Membership',
      next: { label: 'Explore membership', href: `/preview/${w.clubA.slug}/membership` },
    })
    expect(result?.sent?.reference).toMatch(/^TCA-ENQ-\d{4}$/)

    const saved = await savedIn(w.clubA.id)
    expect(saved).toHaveLength(before + 1)
    expect(saved[0]).toMatchObject({
      reference: result?.sent?.reference,
      purpose: 'membership',
      membershipType: 'Five-day',
      status: 'new',
      // Club A has no newsletter service, so the box isn't offered or saved.
      newsletter: false,
    })
    expect(await savedIn(w.clubB.id)).toHaveLength(1)
  })

  it('names "someone from the club" for a topic with nobody set', async () => {
    const result = await send(form({ purpose: 'feedback' }))
    expect(result?.sent?.replier).toBe('Someone from the club')
    expect(result?.sent?.next).toBeNull()
  })

  it('only saves the fields the chosen topic shows', async () => {
    await send(form({ purpose: 'general', membershipType: 'Seven-day', groupSize: '4' }))
    const [saved] = await savedIn(w.clubA.id)
    expect(saved.purpose).toBe('general')
    expect(saved.membershipType).toBeNull()
    expect(saved.groupSize).toBeNull()
  })

  it('shows what to fix, keeps what was typed, and saves nothing', async () => {
    const before = (await savedIn(w.clubA.id)).length
    const result = await send(
      form({ email: 'dan@example', message: ' ', membershipType: 'Not offered' }),
    )
    expect(result?.errors).toEqual({
      email: 'Enter an email address like name@example.com',
      membershipType: 'Choose a membership type',
      message: 'Tell us how we can help',
    })
    expect(result?.values.email).toBe('dan@example')
    expect(result?.sent).toBeNull()
    expect(await savedIn(w.clubA.id)).toHaveLength(before)
  })

  it('refuses a date in the past and a silly group size', async () => {
    const result = await send(
      form({ purpose: 'visitor', preferredDate: '2026-10-01', groupSize: '9999' }),
    )
    expect(result?.errors).toEqual({
      preferredDate: 'Choose a date from today onwards',
      groupSize: 'Enter a number of people between 1 and 500',
    })
  })
})

describe('spam checks', () => {
  it('quietly drops a message with the hidden box filled in', async () => {
    const before = (await savedIn(w.clubA.id)).length
    const result = await send(form({ website: 'http://spam.example' }))
    expect(result?.sent?.reference).toMatch(/-ENQ-/)
    expect(await savedIn(w.clubA.id)).toHaveLength(before)
  })

  it('quietly drops a message sent within seconds of the page loading', async () => {
    const before = (await savedIn(w.clubA.id)).length
    const result = await send(form({}, { age: 1_000 }))
    expect(result?.sent).not.toBeNull()
    expect(await savedIn(w.clubA.id)).toHaveLength(before)
  })

  it('refuses a form token from another club, a forged one and an expired one', async () => {
    const before = (await savedIn(w.clubA.id)).length
    const otherClub = await send(form({}, { tenant: w.clubB.id }))
    expect(otherClub?.formError).toMatch(/press Send message again/)
    const forged = form({})
    forged.set('token', `${w.clubA.id}.${NOW.getTime() - 10_000}.not-a-signature`)
    expect((await send(forged))?.formError).toMatch(/press Send message again/)
    const expired = await send(form({}, { age: 25 * 60 * 60 * 1000 }))
    expect(expired?.formError).toMatch(/press Send message again/)
    // Each refusal hands out a fresh token, so pressing Send again works.
    expect(expired?.token).not.toBe(form({}).get('token'))
    expect(await savedIn(w.clubA.id)).toHaveLength(before)
  })

  it(`takes at most ${HOURLY_LIMIT} messages an hour per club`, async () => {
    const existing = (await savedIn(w.clubB.id)).length
    for (let i = existing; i < HOURLY_LIMIT; i++) await enquiry(w.payload, `Flood ${i}`, w.clubB.id)
    const result = await send(form({ purpose: 'general' }, { tenant: w.clubB.id }), w.clubB)
    expect(result?.formError).toMatch(/a lot of messages/)
    expect(await savedIn(w.clubB.id)).toHaveLength(HOURLY_LIMIT)
    // Club A isn't affected by club B's flood.
    expect((await send(form({})))?.sent).not.toBeNull()
  })

  it('returns nothing for a club that doesn’t exist', async () => {
    expect(await submitEnquiry('no-such-club', { attempt: 0 }, form({}), NOW)).toBeNull()
  })
})

describe('who can do what with enquiries', () => {
  const data = {
    reference: 'X',
    purpose: 'general' as const,
    name: 'X',
    email: 'x@example.com',
    message: 'X',
    status: 'new' as const,
  }

  it('nobody can add one through the admin or the API, not even the super-admin', async () => {
    for (const user of [w.editorA, w.superAdmin]) {
      await expect(
        w.payload.create({
          collection: 'enquiries',
          data: { ...data, tenant: w.clubA.id },
          user,
          overrideAccess: false,
        }),
      ).rejects.toThrow()
    }
    await expect(
      w.payload.create({
        collection: 'enquiries',
        data: { ...data, tenant: w.clubA.id },
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('visitors can’t read them', async () => {
    await expect(
      w.payload.find({ collection: 'enquiries', overrideAccess: false }),
    ).rejects.toThrow()
  })

  it('editors can mark one handled and add notes, but what was sent stays as sent', async () => {
    const updated = await w.payload.update({
      collection: 'enquiries',
      id: w.enquiryA.id,
      data: { status: 'handled', notes: 'Called back', message: 'Changed', email: 'x@example.com' },
      user: w.editorA,
      overrideAccess: false,
    })
    expect(updated).toMatchObject({
      status: 'handled',
      notes: 'Called back',
      message: 'Hello',
      email: 'visitor@example.com',
    })
  })
})

describe('Club Settings → Contact page', () => {
  it('refuses a button that links to another club’s page', async () => {
    await expect(
      w.payload.update({
        collection: 'club-settings',
        id: w.settingsA.id,
        data: {
          contact: {
            replyDays: 1,
            purposes: [
              {
                purpose: 'visitor',
                nextLink: { label: 'Visitors', type: 'page', page: w.pageB.id },
              },
            ],
          },
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('refuses the same topic listed twice', async () => {
    await expect(
      w.payload.update({
        collection: 'club-settings',
        id: w.settingsA.id,
        data: {
          contact: {
            replyDays: 1,
            purposes: [{ purpose: 'visitor' }, { purpose: 'visitor' }],
          },
        },
        overrideAccess: true,
      }),
    ).rejects.toThrow(/Who replies/)
  })
})
