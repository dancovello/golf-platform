import {
  EVENT_CATEGORIES,
  EVENT_ENTRANTS,
  eventCategoryLabel,
  eventEntrantLabel,
} from '@/collections/eventCategories'

import { type eventsArchive, EVENTS_STEP, type SiteEvent } from '../events'
import { linkTarget, siteHref } from '../components/links'
import { EventCard, eventDay, eventMonth } from './EventCard'

import '../blocks/blocks.css'
import '../components/buttons.css'
import './events.css'

type Archive = Awaited<ReturnType<typeof eventsArchive>>

const archiveHref = (
  base: string,
  f: { category?: string | null; entrant?: string | null; show?: number },
) => {
  const params = new URLSearchParams()
  if (f.category) params.set('category', f.category)
  if (f.entrant) params.set('for', f.entrant)
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
const yearOf = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { year: 'numeric', timeZone: 'Europe/London' })

/** Past results in year groups, newest first (they arrive newest first). */
const byYear = (events: SiteEvent[]) => {
  const groups: { year: string; events: SiteEvent[] }[] = []
  for (const e of events) {
    const year = yearOf(e.startsAt)
    const last = groups[groups.length - 1]
    if (last?.year === year) last.events.push(e)
    else groups.push({ year, events: [e] })
  }
  return groups
}

/**
 * Results (G3): past events whose results the club has added, by year. Shown under all events
 * and under Competitions (narrowed to the chosen Men / Ladies / … filter); not under the other
 * categories, which rarely have results.
 */
const Results = ({ results, base }: { results: SiteEvent[]; base: string }) => (
  <section className="events-group events-results" aria-labelledby="events-results">
    <h2 id="events-results" className="t-heading-m events-group-title">
      Results
    </h2>
    {byYear(results).map((g) => (
      <div key={g.year} className="events-results-year">
        <h3 className="t-label-s events-results-year-title">{g.year}</h3>
        <ul className="events-results-list">
          {g.events.map((e) => (
            <li key={e.id} className="events-result">
              <span className="t-data-label events-result-date">
                {Number(eventDay(e.startsAt))} {eventMonth(e.startsAt)}
              </span>
              <a
                className="t-body-m events-result-link"
                href={siteHref(base, e.results!)}
                {...linkTarget(e.results!)}
              >
                {e.title}
                <span className="visually-hidden">: results</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </section>
)

export const EventsArchive = ({
  archive,
  results = [],
  base,
}: {
  archive: Archive
  results?: SiteEvent[]
  base: string
}) => {
  const { category, entrant, events, total, show } = archive
  const shownResults =
    category === null || category === 'competition'
      ? results.filter(
          (r) =>
            (category === null || r.category === 'competition') &&
            (!entrant || r.entrants.includes(entrant)),
        )
      : []
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
        {category === 'competition' ? (
          <nav className="events-pills is-secondary" aria-label="Who can enter">
            {[{ label: 'Everyone', value: null as string | null }, ...EVENT_ENTRANTS].map((c) => (
              <a
                key={c.label}
                className={`events-pill t-label-s${entrant === c.value ? ' is-active' : ''}`}
                href={archiveHref(base, { category, entrant: c.value })}
                aria-current={entrant === c.value ? 'page' : undefined}
              >
                {c.label}
              </a>
            ))}
          </nav>
        ) : null}

        {events.length === 0 ? (
          <div className="events-empty">
            <p className="t-heading-m">
              {entrant
                ? `No competitions for ${eventEntrantLabel(entrant).toLowerCase()} coming up.`
                : category
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
                  href={archiveHref(base, { category, entrant, show: show + EVENTS_STEP })}
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
        {shownResults.length > 0 ? <Results results={shownResults} base={base} /> : null}
      </div>
    </section>
  )
}
