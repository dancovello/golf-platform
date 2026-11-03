import config from '@payload-config'
import { getPayload } from 'payload'

import { BRAND } from '@/brand'
import { hasHours, openDays, ukClock } from '@/marketing/booking/availability'
import { bookDemo } from '@/marketing/booking/actions'
import { bookingConfig, takenSlots } from '@/marketing/booking/config'
import { marketingSettings } from '@/marketing/settings'
import type { MarketingDemoIntroBlock } from '@/payload-types'

import { TextLink } from '../controls/controls'
import { MarketingIcon } from '../MarketingIcon'
import { MarketingButton } from '../parts'
import { DemoBooking } from './DemoBooking'

/**
 * Book a demo intro (187:7371): heading, what to expect and the email line, beside the booking
 * panel. The panel is our own calendar (Q4, decided 3 Nov 2026): the hours in Settings → Demo
 * calls, less anything booked. With no hours set, or if they can't be read, it offers email.
 */
export const DemoIntro = async ({ block }: { block: MarketingDemoIntroBlock }) => {
  const open = await openTimes()
  const mailto = `mailto:${BRAND.email}?subject=${encodeURIComponent('Demo')}`
  return (
    <div className="mk-demo-intro">
      <div className="mk-demo-intro-copy">
        <header className="mk-header mk-header--page mk-header--left">
          {block.eyebrow ? <p className="mk-eyebrow">{block.eyebrow}</p> : null}
          <h1 className="mk-header-title">{block.title}</h1>
          {block.subhead ? <p className="mk-header-body">{block.subhead}</p> : null}
        </header>
        {block.expect?.length ? (
          <ul className="mk-expect" aria-label="What to expect">
            {block.expect.map((item, i) => (
              <li key={item.id ?? i}>
                <MarketingIcon name="check" size={16} />
                {item.text}
              </li>
            ))}
          </ul>
        ) : null}
        {block.alt?.title && block.alt.label && block.alt.href ? (
          <div className="mk-alt-route">
            <p className="mk-alt-title">{block.alt.title}</p>
            {block.alt.body ? <p className="mk-alt-body">{block.alt.body}</p> : null}
            <TextLink href={block.alt.href}>{block.alt.label} →</TextLink>
          </div>
        ) : null}
      </div>
      <div className="mk-demo-intro-panel">
        {open ? (
          <DemoBooking open={open} book={bookDemo} />
        ) : (
          <div className="mk-booking-fallback">
            <h2 className="mk-booking-title">Pick a time by email</h2>
            <p className="mk-booking-text">
              Send us two or three weekday times that suit you, and we’ll send a video call invite.
              Bring anyone from the committee.
            </p>
            <MarketingButton label={`Email ${BRAND.email}`} href={mailto} variant="primary" />
          </div>
        )}
      </div>
      {/* Under "What to expect" on desktop; under the booking panel on phones (275:9682). */}
      <p className="mk-demo-email">
        <MarketingIcon name="mail" size={16} />
        <span>
          {block.emailLead ?? 'Rather email?'} <a href={mailto}>{BRAND.email}</a>
        </span>
      </p>
    </div>
  )
}

/** The times on offer now, or null when no hours are set (or the database can't be read). */
const openTimes = async () => {
  try {
    const settings = await marketingSettings()
    const booking = bookingConfig(settings)
    if (!hasHours(booking)) return null
    const now = new Date()
    const taken = await takenSlots(await getPayload({ config }), ukClock(now).date)
    return openDays(booking, taken, now)
  } catch (error) {
    console.error('Book a demo: could not read the booking times, showing email instead', error)
    return null
  }
}
