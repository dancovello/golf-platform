import { EVENT_CATEGORIES, eventCategoryLabel } from '@/collections/eventCategories'

import { type eventsArchive, EVENTS_STEP, type SiteEvent } from '../events'
import { EventCard } from './EventCard'

import '../blocks/blocks.css'
import '../components/buttons.css'
import './events.css'

type Archive = Awaited<ReturnType<typeof eventsArchive>>

const archiveHref = (base: string, f: { category?: string | null; show?: number }) => {
  const params = new URLSearchParams()
  if (f.category) params.set('category', f.category)
  if (f.show && f.show > EVENTS_STEP) params.set('show', String(f.show))
  const query = params.toString()
  return `${base}/events${query ? `?${query}` : ''}`
}

const monthOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Europe/London',
  })

/** Events after the first three, in month groups, in date order. */
const byMonth = (events: SiteEvent[]) => {
  const groups: { month: string; events: SiteEvent[] }[] = []
  for (const e of events) {
    const month = monthOf(e.startsAt)
    const last = groups[groups.length - 1]
    if (last?.month === month) last.events.push(e)
    else groups.push({ month, events: [e] })
  }
  return groups
}

/**
 * The events archive (Figma "Events archive"): category pills ("All events" first, kept in the
 * address); the next three as cards under "Coming up"; the rest grouped by month as rows;
 * "Show more events" adds six more. Past events have already dropped off. Works without
 * JavaScript (links only).
 */
export const EventsArchive = ({ archive, base }: { archive: Archive; base: string }) => {
  const { category, events, total, show } = archive
  const [next, later] = [events.slice(0, 3), events.slice(3)]

  return (
    <section className="blk events-archive">
      <div className="blk-container">
        <header className="events-archive-header">
          <p className="t-eyebrow blk-eyebrow">What’s on</p>
          <h1 className="t-display-l">Upcoming events</h1>
          <p className="t-body-l events-archive-intro">
            Dinners, competitions and clinics at the club. Most events are open to guests.
          </p>
        </header>

        <nav className="events-pills" aria-label="Event categories">
          {[{ label: 'All events', value: null as string | null }, ...EVENT_CATEGORIES].map((c) => (
            <a
              key={c.label}
              className={`events-pill t-label-s${category === c.value ? ' is-active' : ''}`}
              href={archiveHref(base, { category: c.value })}
              aria-current={category === c.value ? 'page' : undefined}
            >
              {c.label}
            </a>
          ))}
        </nav>

        {events.length === 0 ? (
          <div className="events-empty">
            <p className="t-heading-m">
              {category
                ? `No ${eventCategoryLabel(category).toLowerCase()} events coming up.`
                : 'No events coming up yet.'}
            </p>
            {category ? (
              <a className="btn btn-outline t-label-button" href={archiveHref(base, {})}>
                Show all events
              </a>
            ) : null}
          </div>
        ) : (
          <>
            <section className="events-group" aria-labelledby="events-next">
              <h2 id="events-next" className="t-heading-m events-group-title">
                Coming up
              </h2>
              <div className="events-grid">
                {next.map((e) => (
                  <EventCard key={e.id} event={e} base={base} />
                ))}
              </div>
            </section>
            {byMonth(later).map((g) => (
              <section key={g.month} className="events-group">
                <h2 className="t-heading-m events-group-title">{g.month}</h2>
                <div className="events-rows">
                  {g.events.map((e) => (
                    <EventCard key={e.id} event={e} base={base} layout="row" />
                  ))}
                </div>
              </section>
            ))}
            <div className="events-more">
              {total > events.length ? (
                <a
                  className="btn btn-outline t-label-button"
                  href={archiveHref(base, { category, show: show + EVENTS_STEP })}
                >
                  Show more events
                </a>
              ) : null}
              <p className="t-label-s events-count">
                Showing {events.length} of {total} {total === 1 ? 'event' : 'events'}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
