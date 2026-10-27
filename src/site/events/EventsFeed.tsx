import type { EventsFeedBlock } from '@/payload-types'

import { Photo } from '../blocks/parts'
import { ArrowRight } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import { featuredEvent, upcomingEvents, type SiteEvent } from '../events'
import type { ClubSite } from '../loadClub'
import { NewsCarousel } from '../news/NewsCarousel'
import { bookingLabel, EventCard, eventDay, eventMeta, eventMonth, eventPrice } from './EventCard'

// Styles (events.css) are loaded by RenderBlocks after the shared button styles.

/** Events block B, Agenda: an intro beside the next few events as rows. */
export const EventsAgenda = ({
  eyebrow,
  heading,
  intro,
  allHref,
  events,
  base,
}: {
  eyebrow: string
  heading: string
  intro?: string | null
  allHref: string
  events: SiteEvent[]
  base: string
}) => (
  <section className="blk events-block events-agenda on-subtle">
    <div className="blk-container events-agenda-layout">
      <div className="events-agenda-intro">
        <p className="t-eyebrow blk-eyebrow">{eyebrow}</p>
        <h2 className="t-heading-l blk-heading">{heading}</h2>
        {intro ? <p className="t-body-m events-agenda-text">{intro}</p> : null}
        <a className="btn btn-outline t-label-button" href={allHref}>
          See all events <ArrowRight />
        </a>
      </div>
      <div className="events-rows">
        {events.map((e) => (
          <EventCard key={e.id} event={e} base={base} layout="row" />
        ))}
      </div>
    </div>
  </section>
)

/**
 * The Events block (doc 14 "Events — carousel block options"): A Card carousel (the next six,
 * ending on "All events"), B Agenda (the next four beside an intro) and C Featured (the event
 * marked featured, or else the next one, with places left, and the next two). Past events
 * drop off by themselves; nothing shows until there is an upcoming event.
 */
export const EventsFeed = async ({
  block,
  club,
  base,
}: {
  block: EventsFeedBlock
  club: ClubSite
  base: string
}) => {
  const style = block.style ?? 'carousel'
  const eyebrow = block.eyebrow?.trim() || 'What’s on'
  const allHref =
    block.category && style !== 'featured'
      ? `${base}/events?category=${block.category}`
      : `${base}/events`

  if (style === 'featured') {
    const lead = await featuredEvent(club.tenantID)
    if (!lead) return null
    const others = (await upcomingEvents(club.tenantID, 3)).filter((e) => e.id !== lead.id)
    const price = eventPrice(lead)
    return (
      <section className="blk events-block events-featured on-brand">
        <div className="blk-container">
          <div className="blk-header">
            <div>
              <p className="t-eyebrow blk-eyebrow">{eyebrow}</p>
              <h2 className="t-heading-l blk-heading">{block.heading}</h2>
            </div>
            <a className="btn btn-link is-on-dark t-label-button" href={allHref}>
              All events <ArrowRight />
            </a>
          </div>
          <div className="events-featured-layout">
            <div className="events-featured-image">
              {lead.image ? (
                <Photo image={lead.image} sizes="(max-width: 1023px) 100vw, 640px" alt="" />
              ) : null}
            </div>
            <div className="events-featured-text">
              <p className="t-data-label events-featured-tag">
                {lead.categoryLabel} · {Number(eventDay(lead.startsAt))} {eventMonth(lead.startsAt)}
              </p>
              <h3 className="t-heading-l">{lead.title}</h3>
              {lead.summary ? (
                <p className="t-body-m events-featured-summary">{lead.summary}</p>
              ) : null}
              <p className="t-body-s events-featured-meta">
                <time dateTime={lead.startsAt}>{eventMeta(lead)}</time>
                {price ? ` · ${price}` : ''}
              </p>
              {lead.link ? (
                <a
                  className="btn btn-accent t-label-button events-featured-button"
                  href={siteHref(base, lead.link)}
                  {...linkTarget(lead.link)}
                >
                  {lead.booking === 'enquire' ? 'Enquire' : 'Book tickets'} <ArrowRight />
                </a>
              ) : lead.booking === 'soldOut' ? (
                <p className="t-label-button events-featured-sold-out">{bookingLabel(lead)}</p>
              ) : null}
              {lead.placesLeft != null && lead.capacity && lead.booking !== 'soldOut' ? (
                <p className="t-label-s events-featured-places">
                  {lead.placesLeft} of {lead.capacity} places left
                </p>
              ) : null}
              {others.length > 0 ? (
                <div className="events-rows">
                  {others.slice(0, 2).map((e) => (
                    <EventCard key={e.id} event={e} base={base} layout="row" />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    )
  }

  const events = await upcomingEvents(club.tenantID, style === 'agenda' ? 4 : 6, block.category)
  if (events.length === 0) return null

  if (style === 'agenda') {
    return (
      <EventsAgenda
        eyebrow={eyebrow}
        heading={block.heading}
        intro={block.intro}
        allHref={allHref}
        events={events}
        base={base}
      />
    )
  }

  return (
    <NewsCarousel eyebrow={eyebrow} heading={block.heading} allHref={allHref} allLabel="All events">
      {events.map((e) => (
        <EventCard key={e.id} event={e} base={base} />
      ))}
    </NewsCarousel>
  )
}
