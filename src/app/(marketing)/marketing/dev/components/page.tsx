import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import {
  Field,
  FilterChips,
  IconButton,
  NavLink,
  TextLink,
  TimeSlots,
} from '@/marketing/site/controls/controls'
import {
  FaqItem,
  PillTabs,
  Segmented,
  Switch,
  TenantChips,
} from '@/marketing/site/controls/interactive'
import { AvailabilityBadge, BrowserChrome, MarketingButton } from '@/marketing/site/parts'
import { isSignedInSuperAdmin } from '@/marketing/superAdmin'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Components',
  robots: { index: false, follow: false },
}

const Row = ({ name, node, children }: { name: string; node: string; children: ReactNode }) => (
  <section className="mk-review-row" aria-labelledby={`review-${node}`}>
    <h2 className="mk-review-name" id={`review-${node}`}>
      {name} <span className="mk-review-node">Figma {node}</span>
    </h2>
    <div className="mk-review-items">{children}</div>
  </section>
)

/**
 * Every marketing control, for Dan to review against the Figma page (plan phase 2). Hover,
 * press and focus are real: try them with a mouse and the keyboard. Only the super-admin,
 * signed in, can see this page.
 */
export default async function ComponentsReview() {
  if (!(await isSignedInSuperAdmin())) notFound()
  return (
    <main id="main" className="mk-section">
      <div className="mk-container">
        <header className="mk-header mk-header--section">
          <p className="mk-eyebrow">For review</p>
          <h1 className="mk-header-title">Marketing controls</h1>
          <p className="mk-header-body">
            Every control from the Figma page, with its real states. Hover, press and use the
            keyboard to try them.
          </p>
        </header>

        <Row name="Button" node="174:1846">
          <MarketingButton label="Book a demo" href="#" variant="primary" />
          <MarketingButton label="Book a demo" href="#" variant="secondary" arrow />
          <MarketingButton label="Book a demo" href="#" variant="ghost" />
          <MarketingButton label="Book a demo" variant="primary" disabled />
          <MarketingButton label="Book a demo" variant="secondary" arrow disabled />
          <MarketingButton label="Book a demo" variant="ghost" disabled />
        </Row>
        <Row name="Nav Link" node="174:1853">
          <NavLink href="#">Website builder</NavLink>
          <NavLink href="#" current>
            Pricing
          </NavLink>
        </Row>
        <Row name="Text Link" node="219:8400">
          <TextLink href="#">Website builder</TextLink>
        </Row>
        <Row name="Icon Button" node="219:8373">
          <IconButton icon="chevron-right" label="Next" />
          <IconButton icon="chevron-right" label="Next (disabled)" disabled />
        </Row>
        <Row name="Switch" node="219:8357">
          <Switch label="Card guarantee" defaultChecked />
          <Switch label="No-show fee" />
          <Switch label="On, disabled" defaultChecked disabled />
          <Switch label="Off, disabled" disabled />
        </Row>
        <Row name="Pill Tab" node="219:8393">
          <PillTabs label="Facilities" tabs={['Range', 'Activities', 'Spa']} />
        </Row>
        <Row name="Segment Option" node="183:2637">
          <Segmented label="Screen size" options={['Desktop', 'Tablet', 'Mobile']} />
        </Row>
        <Row name="Tenant Chip" node="176:1947">
          <TenantChips
            label="Demo clubs"
            clubs={[
              { name: 'Ashgrove Park', style: 'Heritage', swatch: '#1B2A22' },
              { name: 'Saltmarsh Links', style: 'Coastal', swatch: '#1E3F46' },
              { name: 'Harrow Vale', style: 'Booking-led', swatch: '#5A1F2B' },
            ]}
          />
        </Row>
        <Row name="Filter Chip" node="186:3939">
          <FilterChips
            name="review-filter"
            legend="Filter"
            options={[
              { value: 'all', label: 'All', count: 12, selected: true },
              { value: 'course', label: 'Course', count: 4 },
            ]}
          />
        </Row>
        <Row name="Time Slot" node="219:8384">
          <TimeSlots
            name="review-slot"
            legend="Pick a time"
            slots={[
              { value: '1000', label: '10:00' },
              { value: '1130', label: '11:30', selected: true },
              { value: '1400', label: '14:00', taken: true },
            ]}
          />
        </Row>
        <Row name="Field" node="185:3608">
          <Field id="review-club" label="Club name" placeholder="Ashgrove Park Golf Club" />
          <Field
            id="review-club-error"
            label="Club name"
            defaultValue=""
            error="Please add your club’s name"
          />
          <Field id="review-club-off" label="Club name" placeholder="Disabled" disabled />
        </Row>
        <Row name="FAQ Item" node="185:3621">
          <div className="mk-review-wide">
            <FaqItem question="How long is the contract?" defaultOpen>
              <p>Twelve months to start, then monthly.</p>
            </FaqItem>
            <FaqItem question="Who owns our content?">
              <p>You do.</p>
            </FaqItem>
          </div>
        </Row>
        <Row name="Availability Badge" node="263:8726">
          <AvailabilityBadge status="live" />
          <AvailabilityBadge status="coming-next" />
          <AvailabilityBadge status="live" size="small" />
          <AvailabilityBadge status="coming-next" size="small" />
        </Row>
        <Row name="Browser Chrome" node="176:1929">
          <div className="mk-review-wide">
            <BrowserChrome address="ashgrovepark.golf" />
          </div>
        </Row>
      </div>
    </main>
  )
}
