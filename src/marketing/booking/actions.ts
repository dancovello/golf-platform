'use server'

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { after } from 'next/server'

import { withinLimit } from '@/security/limitRequest'
import { DEMO_BOOKING_VISITOR_LIMIT } from '@/security/rateLimit'
import { CLUB_HOST_HEADER } from '@/site/resolveSite'

import type { BookingDetails } from '../site/booking/DemoBooking'
import { sendDemoBookingEmails } from './alert'
import { submitDemoBooking } from './submit'

/**
 * The Demo Booking's "Confirm" button (React server action). Only the company website takes
 * bookings: sent through a club's address (src/proxy.ts marks those), it's refused. The emails
 * go after the visitor has their answer, so a slow or failed email never holds up the booking;
 * it is already saved either way. Returns true when booked, otherwise a sentence to show.
 */
export async function bookDemo(
  details: BookingDetails,
  date: string,
  time: string,
): Promise<true | string> {
  const requestHeaders = await headers()
  if (requestHeaders.get(CLUB_HOST_HEADER)) notFound()
  const onSaved = (id: string) => after(() => sendDemoBookingEmails(id).then(() => undefined))
  // At most 5 bookings per visitor in 10 minutes, checked here rather than by page address: a
  // server action runs from any page address.
  const visitorAllowed = () => withinLimit(DEMO_BOOKING_VISITOR_LIMIT, requestHeaders)
  return submitDemoBooking(details, String(date), String(time), new Date(), onSaved, {
    visitorAllowed,
  })
}
