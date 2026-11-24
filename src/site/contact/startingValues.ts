import { isEnquiryPurpose } from '@/collections/enquiryPurposes'

import { ukToday } from './replyBy'
import { EMPTY_VALUES } from './validate'

/** The event an Enquire button came from (src/site/events.ts bookingLink). */
export type EnquiryEvent = { title: string; startsAt: string }

/**
 * What the form starts with. From an event's Enquire button (24 Nov 2026): the Events topic, the
 * event's day as the preferred date, and the message started with which event it is about, so
 * the visitor only adds their own details. Otherwise just the topic `about` names, if any.
 */
export const startingValues = (about: string | null, event: EnquiryEvent | null) => {
  if (!event) {
    return { ...EMPTY_VALUES, purpose: isEnquiryPurpose(about) ? about : 'general' }
  }
  // "Mon 12 Apr 2027", as the event cards write it (without the comma some systems add).
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Date(event.startsAt).toLocaleDateString('en-GB', {
      ...options,
      timeZone: 'Europe/London',
    })
  const day = [
    part({ weekday: 'short' }),
    part({ day: 'numeric' }),
    part({ month: 'short' }).replace('Sept', 'Sep'),
    part({ year: 'numeric' }),
  ].join(' ')
  return {
    ...EMPTY_VALUES,
    purpose: 'events' as const,
    preferredDate: ukToday(new Date(event.startsAt)),
    message: `About: ${event.title}, ${day}\n\n`,
  }
}
