import { eventCategoryLabel } from '@/collections/eventCategories'

import { RichTextContent } from '../blocks/RichTextContent'
import { Photo } from '../blocks/parts'
import { ArrowRight, Clock, Pin } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import type { SiteEventPage } from '../events'
import { NewsCarousel } from '../news/NewsCarousel'
import { EventResults } from './EventResults'
import { ShareLink } from '../news/ShareLink'
import {
  BOOKING_LABELS,
  bookingLabel,
  EventCard,
  entryStatus,
  eventFormat,
  eventPrice,
  eventTime,
  eventWho,
} from './EventCard'

import '../blocks/blocks.css'
import '../blocks/richText.css'
import '../components/buttons.css'
import '../news/news.css'
import './events.css'

/** "Saturday 12 April 2027" (UK time). */
const longDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  })

/**
 * An event's own page (24 Nov 2026, Dan: "like a news post"). No Figma frame yet: it borrows
 * the news article's layout. Breadcrumb, title, summary; the details (when, where, who can
 * enter, format, price, places left) with the Book / Enter / Enquire button; the photo; the
 * club's write-up; then more of what's on. After the day the button gives way to the results,
 * when the club has added them, or a short "this has taken place" line. Results built into the
 * event (EventResults) show below the write-up.
 */
export const EventPage = ({ event, base }: { event: SiteEventPage; base: string }) => {
  const status = entryStatus(event)
  // Results built in show once the event has taken place (24 Nov 2026, plan part 2).
  const shownResults = event.past ? event.builtInResults : null
  const who = eventWho(event)
  const format = eventFormat(event)
  const price = eventPrice(event)
  const places =
    event.placesLeft != null && event.capacity && event.booking !== 'soldOut'
      ? `${event.placesLeft} of ${event.capacity} places left`
      : null
  const details = [
    {
      key: 'when',
      label: 'When',
      icon: <Clock />,
      value: (
        <time dateTime={event.startsAt}>
          {[longDate(event.startsAt), eventTime(event)].filter(Boolean).join(' · ')}
        </time>
      ),
    },
    event.venue && { key: 'where', label: 'Where', icon: <Pin />, value: event.venue },
    who && { key: 'who', label: 'Who can enter', value: who },
    format && { key: 'format', label: 'Format', value: format },
    price && { key: 'price', label: 'Price', value: price },
    !event.past && places && { key: 'places', label: 'Places', value: places },
  ].filter(Boolean) as {
    key: string
    label: string
    icon?: React.ReactNode
    value: React.ReactNode
  }[]

  return (
    <>
      <article className="news-post event-post">
        <header className="news-page news-post-header">
          <div className="news-post-titles">
            <nav className="t-label-s news-breadcrumb" aria-label="Breadcrumb">
              <a href={`${base}/events`}>What’s on</a>
              <span aria-hidden="true">/</span>
              <a href={`${base}/events?category=${event.category}`}>
                {eventCategoryLabel(event.category)}
              </a>
            </nav>
            <h1 className="t-display-l">{event.title}</h1>
            {event.summary ? <p className="t-body-l news-post-summary">{event.summary}</p> : null}
            <div className="event-post-panel">
              <dl className="event-post-details">
                {details.map((d) => (
                  <div key={d.key} className="event-post-detail">
                    <dt className="t-data-label">{d.label}</dt>
                    <dd className="t-body-m">
                      {d.icon ?? null}
                      {d.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="event-post-actions">
                {event.past ? (
                  shownResults ? (
                    <a className="btn btn-solid t-label-button" href="#results">
                      See the results <ArrowRight />
                    </a>
                  ) : event.results ? (
                    <a
                      className="btn btn-solid t-label-button"
                      href={siteHref(base, event.results)}
                      {...linkTarget(event.results)}
                    >
                      See the results <ArrowRight />
                    </a>
                  ) : (
                    <p className="t-body-s event-post-note">This event has taken place.</p>
                  )
                ) : event.link && !status ? (
                  <a
                    className="btn btn-solid t-label-button"
                    href={siteHref(base, event.link)}
                    {...linkTarget(event.link)}
                  >
                    {BOOKING_LABELS[event.booking]} <ArrowRight />
                  </a>
                ) : event.booking === 'soldOut' || status ? (
                  <p className="t-label-button event-action is-sold-out">{bookingLabel(event)}</p>
                ) : null}
                <ShareLink title={event.title} />
              </div>
            </div>
          </div>
          {event.image ? (
            <figure className="news-post-image">
              <Photo
                image={event.image}
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) calc(100vw - 80px), 1200px"
                eager
              />
            </figure>
          ) : null}
        </header>
        {event.body ? (
          <div className="blk rt rt-article">
            <div className="blk-container rt-layout">
              <div className="rt-prose">
                <RichTextContent value={event.body} ctx={event.ctx} base={base} />
              </div>
            </div>
          </div>
        ) : null}
        {shownResults ? (
          <EventResults results={shownResults} file={event.results} ctx={event.ctx} base={base} />
        ) : null}
        <footer className="news-page news-post-footer">
          <a className="btn btn-outline t-label-button" href={`${base}/events`}>
            All events
          </a>
        </footer>
      </article>
      {event.more.length > 0 ? (
        <NewsCarousel
          eyebrow="What’s on"
          heading="More events"
          allHref={`${base}/events`}
          allLabel="All events"
        >
          {event.more.map((e) => (
            <EventCard key={e.id} event={e} base={base} />
          ))}
        </NewsCarousel>
      ) : null}
    </>
  )
}
