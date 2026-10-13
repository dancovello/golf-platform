import { STATUS_STATES, type StatusState } from '@/collections/courseStatusStates'
import type { CourseStatusBlock } from '@/payload-types'

import { ArrowRight, Clock } from '../components/Icons'
import { siteHref } from '../components/links'
import type { ClubSite } from '../loadClub'
import { siteToday } from '../today'
import { Paragraphs } from './parts'
import type { BlockContext, SiteCourseStatus } from './resolve'

const stateLabel = (s: StatusState) => STATUS_STATES.find((x) => x.value === s)?.label ?? s

/** Figma status dot: system colour, always beside the words. */
const Dot = ({ state }: { state: StatusState }) => (
  <span className={`status-dot is-${state}`} aria-hidden="true" />
)

const LONDON = 'Europe/London'
const day = (d: Date) => d.toLocaleDateString('en-GB', { timeZone: LONDON })

/** "07:40 today", or "12 Oct, 07:40". */
const when = (iso: string) => {
  const d = new Date(iso)
  const time = d.toLocaleTimeString('en-GB', {
    timeZone: LONDON,
    hour: '2-digit',
    minute: '2-digit',
  })
  return day(d) === day(siteToday())
    ? `${time} today`
    : `${d.toLocaleDateString('en-GB', { timeZone: LONDON, day: 'numeric', month: 'short' })}, ${time}`
}

/** The honest fallback (doc 05) when the status hasn't been changed for 24 hours. */
const staleText = (club: ClubSite) =>
  club.header.phone
    ? `Please call the club on ${club.header.phone} before you travel.`
    : 'Please call the club before you travel.'

const Updated = ({ status, long = false }: { status: SiteCourseStatus; long?: boolean }) => (
  <p className="t-label-s status-updated" data-volatile>
    {long ? (
      <>
        Last changed {when(status.updatedAt)}
        {status.changedBy ? ` by ${status.changedBy}` : ''}
      </>
    ) : (
      <>
        <Clock /> Updated {when(status.updatedAt)}
      </>
    )}
  </p>
)

const Facilities = ({ status }: { status: SiteCourseStatus }) => (
  <ul className="status-list">
    {status.facilities.map((f, i) => (
      <li key={i}>
        <span className="t-body-m status-list-label">{f.label}</span>
        <span className="t-label-s status-list-value">
          <Dot state={f.state} />
          {f.value ?? stateLabel(f.state)}
        </span>
      </li>
    ))}
  </ul>
)

/** One item in the band: a link to the full board when there is one. */
const BandItem = ({ href, children }: { href: string | null; children: React.ReactNode }) =>
  href ? (
    <a className="status-band-item" href={href}>
      {children}
    </a>
  ) : (
    <div className="status-band-item">{children}</div>
  )

/**
 * Course status (docs/design/09), three styles over the club's one Course status record:
 * A Board (headline state, reason, who changed it and when, and each part's status),
 * B Band (a compact strip on the brand colour, e.g. under the hero) and C Widget (a small
 * card beside some text). If it hasn't been changed for 24 hours, it says so and asks
 * visitors to call, rather than showing an old status. Weather (Figma B) waits for a
 * weather provider decision.
 */
export const CourseStatus = ({
  block,
  ctx,
  club,
  base,
}: {
  block: CourseStatusBlock
  ctx: BlockContext
  club: ClubSite
  base: string
}) => {
  const status = ctx.courseStatus
  if (!status) return null
  const style = block.style ?? 'board'
  const page = ctx.link(block.statusPage, 'Full report')
  const pageHref = page ? siteHref(base, page.link) : null

  const heading =
    block.heading || block.eyebrow ? (
      <div>
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        {block.heading ? <h2 className="t-heading-l blk-heading">{block.heading}</h2> : null}
      </div>
    ) : null

  if (style === 'band') {
    const items = status.stale ? [] : status.facilities.slice(0, 4)
    return (
      <section className="blk status status-band on-brand" aria-label="Course status">
        <div className="blk-container status-band-row">
          {status.stale ? (
            <BandItem href={pageHref}>
              <span className="t-data-label">Course status</span>
              <span className="t-data-serif">Not updated today</span>
              <span className="t-label-s">{staleText(club)}</span>
            </BandItem>
          ) : items.length > 0 ? (
            items.map((f, i) => (
              <BandItem key={i} href={pageHref}>
                <span className="t-data-label">{f.label}</span>
                <span className="t-data-serif status-band-value">
                  <Dot state={f.state} />
                  {f.value ?? stateLabel(f.state)}
                </span>
              </BandItem>
            ))
          ) : (
            <BandItem href={pageHref}>
              <span className="t-data-label">Course</span>
              <span className="t-data-serif status-band-value">
                <Dot state={status.state} />
                {stateLabel(status.state)}
              </span>
            </BandItem>
          )}
        </div>
      </section>
    )
  }

  const headline = status.stale ? (
    <>
      <p className="status-headline">
        <span className="t-heading-m">Status not updated today</span>
      </p>
      <p className="t-body-s status-reason">{staleText(club)}</p>
    </>
  ) : null

  if (style === 'widget') {
    return (
      <section className="blk status status-widget-block">
        <div className="blk-container status-widget-layout">
          <div className="status-widget-intro">
            {heading}
            {block.intro ? <Paragraphs text={block.intro} className="t-body-l" /> : null}
          </div>
          <aside className="status-widget" aria-label="Course status">
            {headline ?? (
              <>
                <p className="status-headline">
                  <Dot state={status.state} />
                  <span className="t-heading-m">
                    Course {stateLabel(status.state).toLowerCase()}
                  </span>
                </p>
                {status.reason ? <p className="t-body-s status-reason">{status.reason}</p> : null}
                <Facilities status={status} />
              </>
            )}
            <div className="status-widget-footer">
              <Updated status={status} />
              {page && pageHref ? (
                <a className="btn btn-link t-label-button" href={pageHref}>
                  {page.label} <ArrowRight />
                </a>
              ) : null}
            </div>
          </aside>
        </div>
      </section>
    )
  }

  return (
    <section className="blk status status-board">
      <div className="blk-container">
        <div className="blk-header">
          {heading}
          <Updated status={status} />
        </div>
        <div className="status-board-layout">
          <div className="status-card">
            {headline ?? (
              <>
                <p className="status-headline">
                  <Dot state={status.state} />
                  <span className="t-display-l">{stateLabel(status.state)}</span>
                </p>
                {status.reason ? <p className="t-body-l status-reason">{status.reason}</p> : null}
                <Updated status={status} long />
              </>
            )}
          </div>
          {!status.stale && status.facilities.length > 0 ? <Facilities status={status} /> : null}
        </div>
      </div>
    </section>
  )
}
