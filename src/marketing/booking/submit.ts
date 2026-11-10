import config from '@payload-config'
import { getPayload } from 'payload'

import { EMAIL_ADDRESS } from '@/email/address'
import { allowRequest, DEMO_BOOKINGS_PER_HOUR } from '@/security/rateLimit'
import { checkFormToken } from '@/site/contact/formToken'
import { verifyTurnstile } from '@/site/contact/turnstile'

import { hasHours, isOpen, slotKey, ukClock } from './availability'
import { bookingConfig, takenSlots } from './config'
import { BOOKING_FORM_SCOPE, BOOKING_TURNSTILE_ACTION, type BookingProof } from './proof'
import type { BookingDetails } from '../site/booking/DemoBooking'
import { marketingSettings } from '../settings'

/** Most bookings the site takes in an hour, so a flood of junk can't take every slot. */
export const HOURLY_LIMIT = 20

export const GONE = 'That time has just gone. Please pick another.'
const INVALID = 'Please check your details and try again.'
const BUSY = 'We’re receiving a lot of bookings right now. Please try again later, or email us.'
const CLOSED = 'Booking isn’t open just now. Please email us instead.'
const EXPIRED = 'This page has been open a long time. Please reload it and try again.'
const NOT_CHECKED = 'We couldn’t confirm this came from a person. Please press Confirm again.'
const CHECK_UNAVAILABLE =
  'We couldn’t book that just now. Please try again in a minute, or email us instead.'

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
 * still on offer (hours from the settings, minus anything booked), then the limits. Spam checks,
 * the same as the Homepage Request Form's, none storing anything about the visitor:
 * - a hidden "website" box only robots fill in;
 * - the page's signed time check: too quick to be a person, or long expired;
 * - Cloudflare's "are you a person?" check, when switched on.
 * A robot caught by the first two is told "booked" but nothing is saved or sent, so it learns
 * nothing. Two people
 * choosing one time at once can't both have it: the slot is unique in the database.
 * `onSaved` gets the new booking's ID (the action emails it after answering the visitor).
 */
export const submitDemoBooking = async (
  input: BookingDetails,
  date: string,
  time: string,
  proof: BookingProof,
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
  if (typeof proof?.website === 'string' && proof.website.trim()) return true
  const timed = checkFormToken(proof?.token, BOOKING_FORM_SCOPE, now.getTime())
  if (timed === 'too-fast') return true
  if (timed !== 'ok') return EXPIRED
  // Checked after the details: an answer works only once, so the page asks for a new one
  // after any refusal. If Cloudflare can't be reached nothing is booked.
  const person = await verifyTurnstile(proof?.turnstile, BOOKING_TURNSTILE_ACTION)
  if (person === 'failed') return NOT_CHECKED
  if (person === 'unavailable') return CHECK_UNAVAILABLE

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
