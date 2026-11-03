/**
 * The Book a demo calendar: hours from the settings, bookings saved for the super-admin alone,
 * each time bookable once, two emails after a booking, and deleted after 12 months.
 */
import { sql } from '@payloadcms/db-postgres'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteOldDemoBookings } from '@/privacy/cleanUp'
import { sendDemoBookingEmails } from '@/marketing/booking/alert'
import { GONE, submitDemoBooking } from '@/marketing/booking/submit'
import { DEMO_BOOKINGS_PER_HOUR } from '@/security/rateLimit'

import { seedWorld, type World } from './helpers/seed'

let w: World

// Monday 2 November 2026, 09:00 in London.
const NOW = new Date('2026-11-02T09:00:00Z')
const DAY = '2026-11-03' // Tuesday: 10:00 to 12:00 is on offer
const details = {
  name: 'Sam Secretary',
  role: 'Club secretary',
  club: 'Ashgrove Park Golf Club',
  email: 'secretary@ashgrove.example',
}

const setSettings = (demoCalls: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  w.payload.updateGlobal({
    slug: 'marketing-settings',
    data: { demoCalls, ...extra } as never,
    overrideAccess: true,
  })

const book = (date = DAY, time = '10:00', who = details, onSaved?: (id: string) => void) =>
  submitDemoBooking(who, date, time, NOW, onSaved)

const saved = async () =>
  (
    await w.payload.find({
      collection: 'demo-bookings',
      sort: 'createdAt',
      limit: 100,
      overrideAccess: true,
    })
  ).docs

const clear = async () => {
  await w.payload.delete({
    collection: 'demo-bookings',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
  await w.payload.db.drizzle.execute(sql`DELETE FROM rate_limits`)
  await setSettings({
    hours: [{ weekday: 'tue', from: '10:00', to: '12:00' }],
    slotMinutes: 30,
    daysAhead: 14,
    noticeHours: 24,
    videoLink: 'https://meet.example/dan',
  })
}

beforeAll(async () => {
  w = await seedWorld()
})
beforeEach(clear)
afterEach(() => {
  vi.restoreAllMocks()
  delete process.env.RESEND_API_KEY
})

describe('booking a demo', () => {
  it('only books a time the settings offer, and each time once', async () => {
    expect(await book()).toBe(true)
    const [booking] = await saved()
    expect(booking).toMatchObject({
      status: 'booked',
      date: DAY,
      time: '10:00',
      slotKey: `${DAY} 10:00`,
    })

    // Taken: the same time again, from another person.
    expect(await book(DAY, '10:00', { ...details, email: 'other@club.example' })).toBe(GONE)
    // Not on offer: between slots, after the hours, a weekend, a day with no hours, too soon.
    expect(await book(DAY, '10:15')).toBe(GONE)
    expect(await book(DAY, '12:00')).toBe(GONE)
    expect(await book('2026-11-07', '10:00')).toBe(GONE)
    expect(await book('2026-11-04', '10:00')).toBe(GONE)
    expect(await submitDemoBooking(details, '2026-11-02', '10:00', NOW)).toBe(GONE)
    expect(await saved()).toHaveLength(1)
  })

  it('refuses missing or bad details, and says booking is closed with no hours', async () => {
    expect(await book(DAY, '10:30', { ...details, name: ' ' })).not.toBe(true)
    expect(await book(DAY, '10:30', { ...details, email: 'not an email' })).not.toBe(true)
    expect(await saved()).toHaveLength(0)
    await setSettings({ hours: [] })
    expect(await book(DAY, '11:00')).toMatch(/email us/)
  })

  it('frees the time when a booking is cancelled', async () => {
    await book()
    const [booking] = await saved()
    await w.payload.update({
      collection: 'demo-bookings',
      id: booking.id,
      data: { status: 'cancelled' },
      overrideAccess: true,
    })
    expect(await book(DAY, '10:00', { ...details, email: 'next@club.example' })).toBe(true)
  })

  it('saves at most 20 an hour from everyone, and stops a visitor the limit refuses', async () => {
    await setSettings({
      hours: [{ weekday: 'tue', from: '09:00', to: '17:00' }],
      slotMinutes: 30,
      daysAhead: 14,
      noticeHours: 24,
    })
    const slots = ['2026-11-03', '2026-11-10'].flatMap((date) =>
      Array.from({ length: 16 }, (_, i) => [
        date,
        `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`,
      ]),
    )
    const results: (true | string)[] = []
    for (const [date, time] of slots.slice(0, DEMO_BOOKINGS_PER_HOUR.max + 1)) {
      results.push(await book(date, time))
    }
    expect(results.filter((r) => r === true)).toHaveLength(DEMO_BOOKINGS_PER_HOUR.max)
    expect(results.at(-1)).toMatch(/right now/)

    await clear()
    const refused = await submitDemoBooking(details, DAY, '10:30', NOW, undefined, {
      visitorAllowed: async () => false,
    })
    expect(refused).toMatch(/right now/)
    expect(await saved()).toHaveLength(0)
  })
})

describe('only the super-admin sees bookings', () => {
  it('club editors can’t read, change or delete them, and nobody creates them by hand', async () => {
    await book()
    const [booking] = await saved()
    const asEditor = { overrideAccess: false as const, user: w.editorA }
    await expect(w.payload.find({ collection: 'demo-bookings', ...asEditor })).rejects.toThrow()
    await expect(
      w.payload.update({
        collection: 'demo-bookings',
        id: booking.id,
        data: { status: 'cancelled' },
        ...asEditor,
      }),
    ).rejects.toThrow()
    await expect(
      w.payload.delete({ collection: 'demo-bookings', id: booking.id, ...asEditor }),
    ).rejects.toThrow()
    await expect(
      w.payload.create({
        collection: 'demo-bookings',
        data: { status: 'booked', date: DAY, time: '11:00', ...details },
        overrideAccess: false,
        user: w.superAdmin,
      }),
    ).rejects.toThrow()
    const asAdmin = { overrideAccess: false as const, user: w.superAdmin }
    expect((await w.payload.find({ collection: 'demo-bookings', ...asAdmin })).totalDocs).toBe(1)
    const changed = await w.payload.update({
      collection: 'demo-bookings',
      id: booking.id,
      data: { notes: 'Called back', email: 'changed@example.com' },
      ...asAdmin,
    })
    // What the visitor sent stays as sent.
    expect(changed.notes).toBe('Called back')
    expect(changed.email).toBe(details.email)
  })
})

describe('the emails', () => {
  const bookAndKeep = async () => {
    let id = ''
    await book(DAY, '10:00', details, (saved) => (id = saved))
    return id
  }

  it('sends nothing when email isn’t set up', async () => {
    const sendEmail = vi.spyOn(w.payload, 'sendEmail')
    expect(await sendDemoBookingEmails(await bookAndKeep())).toEqual({
      alert: 'email-off',
      confirmation: 'skipped',
    })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('emails the inbox, and confirms to the visitor with the video link', async () => {
    process.env.RESEND_API_KEY = 'test-only'
    await setSettings(
      {
        hours: [{ weekday: 'tue', from: '10:00', to: '12:00' }],
        slotMinutes: 30,
        daysAhead: 14,
        noticeHours: 24,
        videoLink: 'https://meet.example/dan',
      },
      { requests: { inbox: 'requests@company.example' } },
    )
    const sendEmail = vi.spyOn(w.payload, 'sendEmail').mockResolvedValue({})
    const id = await bookAndKeep()
    expect(await sendDemoBookingEmails(id)).toEqual({ alert: 'sent', confirmation: 'sent' })
    const [alert, confirmation] = sendEmail.mock.calls.map((c) => c[0] as Record<string, string>)
    expect(alert.to).toBe('requests@company.example')
    expect(alert.replyTo).toBe(details.email)
    expect(alert.text).toContain('Tuesday 3 November at 10:00 (UK time)')
    expect(confirmation.to).toBe(details.email)
    expect(confirmation.text).toContain('https://meet.example/dan')
    // Never says how long the call lasts (hand-off §6).
    expect(`${alert.text} ${confirmation.text}`).not.toMatch(/minutes|\bmins?\b|\bhour/i)
    const booking = await w.payload.findByID({
      collection: 'demo-bookings',
      id,
      overrideAccess: true,
    })
    expect(booking.alertSentAt).toBeTruthy()
    expect(booking.confirmationSentAt).toBeTruthy()
  })
})

describe('keeping bookings', () => {
  it('deletes them 12 months after the last change, and keeps newer ones', async () => {
    await book(DAY, '10:00')
    await book(DAY, '10:30', { ...details, email: 'b@club.example' })
    const [old] = await saved()
    await w.payload.db.drizzle.execute(
      sql`UPDATE demo_bookings SET updated_at = '2025-10-01T00:00:00Z' WHERE id = ${old.id}`,
    )
    expect(await deleteOldDemoBookings(w.payload, NOW)).toBe(1)
    expect(await saved()).toHaveLength(1)
  })
})
