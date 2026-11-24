import { Photo } from '../blocks/parts'
import { ArrowRight, ChevronRight, Clock, Pin } from '../components/Icons'
import { siteHref } from '../components/links'
import { eventEntrantLabel } from '@/collections/eventCategories'

import type { SiteEvent } from '../events'
import type { SiteLink } from '../loadClub'
import { siteToday } from '../today'

const LONDON = { timeZone: 'Europe/London' } as const

/** The address of an event's own page (24 Nov 2026), or the events page before it has one. */
export const eventPageLink = (e: Pick<SiteEvent, 'slug'>): SiteLink => ({
  kind: 'page',
  slug: e.slug ? `events/${e.slug}` : 'events',
})

export const eventDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', ...LONDON })
// Three letters always ("Sep", not the UK style's "Sept"), as the design shows.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const londonMonth = (d: Date) =>
  MONTHS[Number(d.toLocaleDateString('en-GB', { month: 'numeric', ...LONDON })) - 1]

export const eventMonth = (iso: string) => londonMonth(new Date(iso))

/** "Fri 24 Oct", and "19:00" (with a time note: "08:00 shotgun"); no time if none is set. */
const dayAndTime = (e: SiteEvent) => {
  const d = new Date(e.startsAt)
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short', ...LONDON })
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', ...LONDON })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', ...LONDON })
  return {
    day: `${weekday} ${date} ${londonMonth(d)}`,
    time: e.noStartTime ? e.timeNote : e.timeNote ? `${time} ${e.timeNote}` : time,
  }
}

/** "Fri 24 Oct · 19:00 · Clubhouse" (with a time note: "08:00 shotgun"; no time if none is set). */
export const eventMeta = (e: SiteEvent) => {
  const { day, time } = dayAndTime(e)
  return [day, time, e.venue].filter(Boolean).join(' · ')
}

/** "19:00" (with a time note: "08:00 shotgun"), or null with no set time and no note. */
export const eventTime = (e: SiteEvent) => dayAndTime(e).time

/** "Thu 22 Oct · 19:00" (with a time note: "08:00 shotgun"), without the place. */
export const eventWhen = (e: SiteEvent) => {
  const { day, time } = dayAndTime(e)
  return [day, time].filter(Boolean).join(' · ')
}

/** "£45 · Members £38" */
export const eventPrice = (e: SiteEvent) =>
  [e.price, e.memberPrice ? `Members ${e.memberPrice}` : null].filter(Boolean).join(' · ') || null

/** "Thu 15 Jan, 10:00" (UK time). */
const dayMonthTime = (iso: string) => {
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short', ...LONDON })
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', ...LONDON })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', ...LONDON })
  return `${weekday} ${date} ${londonMonth(d)}, ${time}`
}

/**
 * Where a competition's entries stand (G3): not open yet ("Entries open Thu 15 Jan, 10:00")
 * or closed. Null while entries are open, or when the club gave no dates.
 */
export const entryStatus = (e: SiteEvent, now = siteToday()) => {
  if (e.booking === 'soldOut') return null
  if (e.entriesOpen && now < new Date(e.entriesOpen)) {
    return { state: 'notOpen' as const, label: `Entries open ${dayMonthTime(e.entriesOpen)}` }
  }
  if (e.entriesClose && now > new Date(e.entriesClose)) {
    return { state: 'closed' as const, label: 'Entries closed' }
  }
  return null
}

export const BOOKING_LABELS = {
  book: 'Book',
  enter: 'Enter',
  enquire: 'Enquire',
  soldOut: 'Sold out',
}

/** The card's action: the entry window's state first, then Book / Enter / Enquire / Sold out. */
export const bookingLabel = (e: SiteEvent) => entryStatus(e)?.label ?? BOOKING_LABELS[e.booking]

/** "Men · Ladies · Handicap index 18.4 or less" (who can enter and the rules). */
export const eventWho = (e: SiteEvent) =>
  [...e.entrants.map(eventEntrantLabel), e.eligibility].filter(Boolean).join(' · ') || null

/** "Stableford, yellow tees · Ballot". */
export const eventFormat = (e: SiteEvent) =>
  [e.format, e.ballot ? 'Places by ballot' : null].filter(Boolean).join(' · ') || null

/** Figma "Date badge": the day large, the month small. */
export const DateBadge = ({ iso, className = '' }: { iso: string; className?: string }) => (
  <span className={`event-date ${className}`} aria-hidden="true">
    <span className="t-data-serif">{eventDay(iso)}</span>
    <span className="t-data-label">{eventMonth(iso)}</span>
  </span>
)

/** The title, linking to the event's own page (24 Nov 2026), which has the booking button. */
const Title = ({
  event,
  base,
  className,
}: {
  event: SiteEvent
  base: string
  className: string
}) => (
  <a className={`event-link ${className}`} href={siteHref(base, eventPageLink(event))}>
    {event.title}
  </a>
)

/**
 * Figma "Event Card". Stacked (grids and carousels): photo with the date badge, category tag,
 * title, date and place, price and Book / Enquire / Sold out. Row (lists): date box, category,
 * title, date and place, and an arrow. The whole card opens the event's own page.
 */
export const EventCard = ({
  event,
  base,
  layout = 'stacked',
}: {
  event: SiteEvent
  base: string
  layout?: 'stacked' | 'row'
}) => {
  const price = eventPrice(event)
  if (layout === 'row') {
    return (
      <article className="event-card is-row has-link">
        <DateBadge iso={event.startsAt} />
        <div className="event-row-body">
          <p className="t-eyebrow event-category">{event.categoryLabel}</p>
          <h3 className="t-heading-m event-title">
            <Title event={event} base={base} className="event-title-text" />
          </h3>
          <p className="t-body-s event-meta">
            <time dateTime={event.startsAt}>{eventMeta(event)}</time>
            {event.booking === 'soldOut' ? ' · Sold out' : ''}
            {entryStatus(event) ? ` · ${entryStatus(event)!.label}` : ''}
          </p>
        </div>
        <span className="event-chevron" aria-hidden="true">
          <ChevronRight />
        </span>
      </article>
    )
  }
  // Sold out, entries not open yet or closed: the action is shown muted, without an arrow.
  const muted = event.booking === 'soldOut' || entryStatus(event) !== null
  const who = eventWho(event)
  const format = eventFormat(event)
  return (
    <article className="event-card is-stacked has-link">
      <div className="event-image">
        {event.image ? (
          <Photo
            image={event.image}
            sizes="(max-width: 767px) 272px, (max-width: 1279px) 45vw, 384px"
            alt=""
          />
        ) : null}
        <DateBadge iso={event.startsAt} className="is-on-image" />
      </div>
      <div className="event-body">
        <p className="t-data-label event-tag">{event.categoryLabel}</p>
        <h3 className="t-heading-m event-title">
          <Title event={event} base={base} className="event-title-text" />
        </h3>
        {/* When, where and how much, together (Dan, 2026-10-17). */}
        <dl className="event-details">
          <div className="event-detail is-when">
            <dt className="t-data-label">When</dt>
            <dd className="t-body-s">
              <Clock />
              <time dateTime={event.startsAt}>{eventWhen(event)}</time>
            </dd>
          </div>
          {event.venue ? (
            <div className="event-detail is-where">
              <dt className="t-data-label">Where</dt>
              <dd className="t-body-s">
                <Pin />
                {event.venue}
              </dd>
            </div>
          ) : null}
          {who ? (
            <div className="event-detail is-who">
              <dt className="t-data-label">Who</dt>
              <dd className="t-body-s">{who}</dd>
            </div>
          ) : null}
          {format ? (
            <div className="event-detail is-format">
              <dt className="t-data-label">Format</dt>
              <dd className="t-body-s">{format}</dd>
            </div>
          ) : null}
          {price ? (
            <div className="event-detail is-price">
              <dt className="t-data-label">Price</dt>
              <dd className="t-body-m event-price">{price}</dd>
            </div>
          ) : null}
        </dl>
        <span
          className={`t-label-button event-action${muted ? ' is-sold-out' : ''}`}
          aria-hidden="true"
        >
          {bookingLabel(event)}
          {muted ? null : <ArrowRight />}
        </span>
      </div>
    </article>
  )
}
