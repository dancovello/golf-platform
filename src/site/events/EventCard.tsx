import { Photo } from '../blocks/parts'
import { ArrowRight, ChevronRight } from '../components/Icons'
import { isExternal, siteHref } from '../components/links'
import type { SiteEvent } from '../events'

const LONDON = { timeZone: 'Europe/London' } as const

export const eventDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', ...LONDON })
// Three letters always ("Sep", not the UK style's "Sept"), as the design shows.
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const londonMonth = (d: Date) =>
  MONTHS[Number(d.toLocaleDateString('en-GB', { month: 'numeric', ...LONDON })) - 1]

export const eventMonth = (iso: string) => londonMonth(new Date(iso))

/** "Fri 24 Oct · 19:00 · Clubhouse" (with a time note: "08:00 shotgun"). */
export const eventMeta = (e: SiteEvent) => {
  const d = new Date(e.startsAt)
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short', ...LONDON })
  const date = d.toLocaleDateString('en-GB', { day: 'numeric', ...LONDON })
  const day = `${weekday} ${date} ${londonMonth(d)}`
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', ...LONDON })
  return [day, e.timeNote ? `${time} ${e.timeNote}` : time, e.venue].filter(Boolean).join(' · ')
}

/** "£45 · Members £38" */
export const eventPrice = (e: SiteEvent) =>
  [e.price, e.memberPrice ? `Members ${e.memberPrice}` : null].filter(Boolean).join(' · ') || null

export const bookingLabel = (e: SiteEvent) =>
  e.booking === 'soldOut' ? 'Sold out' : e.booking === 'enquire' ? 'Enquire' : 'Book'

/** Figma "Date badge": the day large, the month small. */
export const DateBadge = ({ iso, className = '' }: { iso: string; className?: string }) => (
  <span className={`event-date ${className}`} aria-hidden="true">
    <span className="t-data-serif">{eventDay(iso)}</span>
    <span className="t-data-label">{eventMonth(iso)}</span>
  </span>
)

/** The title, linking to the booking page when there is one. */
const Title = ({
  event,
  base,
  className,
}: {
  event: SiteEvent
  base: string
  className: string
}) =>
  event.link ? (
    <a
      className={`event-link ${className}`}
      href={siteHref(base, event.link)}
      {...(isExternal(event.link) ? { rel: 'noopener' } : {})}
    >
      {event.title}
    </a>
  ) : (
    <span className={className}>{event.title}</span>
  )

/**
 * Figma "Event Card". Stacked (grids and carousels): photo with the date badge, category tag,
 * title, date and place, price and Book / Enquire / Sold out. Row (lists): date box, category,
 * title, date and place, and an arrow. The whole card follows the button's link.
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
      <article className={`event-card is-row${event.link ? ' has-link' : ''}`}>
        <DateBadge iso={event.startsAt} />
        <div className="event-row-body">
          <p className="t-eyebrow event-category">{event.categoryLabel}</p>
          <h3 className="t-heading-m event-title">
            <Title event={event} base={base} className="event-title-text" />
          </h3>
          <p className="t-body-s event-meta">
            <time dateTime={event.startsAt}>{eventMeta(event)}</time>
            {event.booking === 'soldOut' ? ' · Sold out' : ''}
          </p>
        </div>
        {event.link ? (
          <span className="event-chevron" aria-hidden="true">
            <ChevronRight />
          </span>
        ) : null}
      </article>
    )
  }
  return (
    <article className={`event-card is-stacked${event.link ? ' has-link' : ''}`}>
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
        <p className="t-body-s event-meta">
          <time dateTime={event.startsAt}>{eventMeta(event)}</time>
        </p>
        <div className="event-foot">
          {price ? <p className="t-label-s event-price">{price}</p> : <span />}
          <span
            className={`t-label-button event-action${event.booking === 'soldOut' ? ' is-sold-out' : ''}`}
            aria-hidden="true"
          >
            {bookingLabel(event)}
            {event.link ? <ArrowRight /> : null}
          </span>
        </div>
      </div>
    </article>
  )
}
