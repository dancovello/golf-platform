import config from '@payload-config'
import { getPayload } from 'payload'

import { EMAIL_ADDRESS } from '@/email/address'
import { allowRequest, DEMO_BOOKINGS_PER_HOUR } from '@/security/rateLimit'

import { hasHours, isOpen, slotKey, ukClock } from './availability'
import { bookingConfig, takenSlots } from './config'
import type { BookingDetails } from '../site/booking/DemoBooking'
import { marketingSettings } from '../settings'

/** Most bookings the site takes in an hour, so a flood of junk can't take every slot. */
export const HOURLY_LIMIT = 20

export const GONE = 'That time has just gone. Please pick another.'
const INVALID = 'Please check your details and try again.'
const BUSY = 'We’re receiving a lot of bookings right now. Please try again later, or email us.'
const CLOSED = 'Booking isn’t open just now. Please email us instead.'

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, max) : ''

/** True for the error Postgres gives when a unique value (the slot) is already taken. */
const isTaken = (error: unknown): boolean => {
  const code = (e: unknown) => (e as { code?: string } | null)?.code
  const cause = (error as { cause?: unknown } | null)?.cause
  return (
    code(error) === '23505' ||
    code(cause) === '23505' ||
    /unique|duplicate/i.test(String((error as Error)?.message))
  )
}

/**
 * Books one demo call. Returns true when booked, otherwise a sentence to show the visitor.
 * Checked on the server, whatever the page showed: the details, then that the day and time are
 * still on offer (hours from the settings, minus anything booked), then the limits. Two people
 * choosing one time at once can't both have it: the slot is unique in the database.
 * `onSaved` gets the new booking's ID (the action emails it after answering the visitor).
 */
export const submitDemoBooking = async (
  input: BookingDetails,
  date: string,
  time: string,
  now = new Date(),
  onSaved?: (id: string) => void,
  { visitorAllowed }: { visitorAllowed?: () => Promise<boolean> } = {},
): Promise<true | string> => {
  const details = {
    name: clean(input?.name, 100),
    role: clean(input?.role, 100),
    club: clean(input?.club, 120),
    email: clean(input?.email, 254),
  }
  if (!details.name || !details.club || !EMAIL_ADDRESS.test(details.email)) return INVALID

  const payload = await getPayload({ config })
  const settings = await marketingSettings()
  const booking = bookingConfig(settings)
  if (!hasHours(booking)) return CLOSED
  const today = ukClock(now).date
  const taken = await takenSlots(payload, today)
  if (!isOpen(booking, taken, now, date, time)) return GONE

  if (visitorAllowed && !(await visitorAllowed())) return BUSY
  // Counted and checked in one database step, so bookings made at the same moment can't all
  // see room for one more.
  const db = (payload.db as unknown as { drizzle: Parameters<typeof allowRequest>[0] }).drizzle
  if (!(await allowRequest(db, DEMO_BOOKINGS_PER_HOUR, 'all', now))) return BUSY

  try {
    const saved = await payload.create({
      collection: 'demo-bookings',
      data: { status: 'booked', date, time, slotKey: slotKey(date, time), ...details },
      overrideAccess: true,
    })
    onSaved?.(String(saved.id))
    return true
  } catch (error) {
    if (isTaken(error)) return GONE
    payload.logger.error({ err: error }, 'Demo booking could not be saved')
    return 'We couldn’t book that just now. Please try again, or email us.'
  }
}
