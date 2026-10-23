import { BRAND } from '@/brand'
import type { MarketingDemoIntroBlock } from '@/payload-types'

import { MarketingIcon } from '../MarketingIcon'
import { MarketingButton } from '../parts'

/**
 * Book a demo intro (187:7371): heading, what to expect and the email line, beside the booking
 * panel. Until a calendar is connected (open question Q4) the panel offers email: the plan's
 * agreed fallback. The working Demo Booking component is on the review page (/dev/components).
 */
export const DemoIntro = ({ block }: { block: MarketingDemoIntroBlock }) => {
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
      </div>
      <div className="mk-demo-intro-panel">
        <div className="mk-booking-fallback">
          <h2 className="mk-booking-title">Pick a time by email</h2>
          <p className="mk-booking-text">
            Send us two or three weekday times that suit you, and we’ll send a video call invite.
            Bring anyone from the committee.
          </p>
          <MarketingButton label={`Email ${BRAND.email}`} href={mailto} variant="primary" />
        </div>
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
