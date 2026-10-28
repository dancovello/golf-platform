'use client'

import { addDays, isWeekend, type OpenDay } from '@/marketing/booking/calendar'

import { DemoBooking } from './DemoBooking'

/**
 * The Demo Booking component with sample times, for the review page only. Nothing is booked:
 * until a calendar is connected (open question Q4) there are no real times to offer.
 * Sample: the weekdays of the next three weeks, starting two days from today, missing every
 * fourth one (fully booked), with Figma's four times.
 */
const sampleDays = (today: string): OpenDay[] => {
  const open: OpenDay[] = []
  for (let i = 2, n = 0; i < 23; i++) {
    const date = addDays(today, i)
    if (isWeekend(date)) continue
    if (n++ % 4 === 3) continue
    open.push({ date, times: ['10:00', '11:30', '14:00', '15:30'] })
  }
  return open
}

export const DemoBookingPreview = ({ today }: { today: string }) => (
  <DemoBooking open={sampleDays(today)} book={async () => true} />
)
