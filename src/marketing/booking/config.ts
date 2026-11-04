import type { Payload } from 'payload'

import { marketingSettings } from '../settings'
import type { BookingConfig, Hours } from './availability'

type Settings = Awaited<ReturnType<typeof marketingSettings>>

/** The settings' demo-call hours in the shape the booking rules use. */
export const bookingConfig = (settings: Settings): BookingConfig => ({
  hours: (settings.demoCalls?.hours ?? []) as Hours[],
  slotMinutes: settings.demoCalls?.slotMinutes ?? 30,
  daysAhead: settings.demoCalls?.daysAhead ?? 21,
  noticeHours: settings.demoCalls?.noticeHours ?? 24,
})

/** The slots already booked from `fromDate` on, as `slotKey`s. */
export const takenSlots = async (payload: Payload, fromDate: string): Promise<Set<string>> => {
  const { docs } = await payload.find({
    collection: 'demo-bookings',
    where: { and: [{ status: { equals: 'booked' } }, { date: { greater_than_equal: fromDate } }] },
    pagination: false,
    depth: 0,
    select: { slotKey: true },
    overrideAccess: true,
  })
  return new Set(docs.map((d) => d.slotKey).filter((k): k is string => Boolean(k)))
}
