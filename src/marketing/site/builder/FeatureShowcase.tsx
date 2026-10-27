import type { CSSProperties, ReactNode } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import { DEMO_CLUBS } from '@/marketing/demo/clubs'
import type { MarketingFeatureShowcaseBlock } from '@/payload-types'
import { brandCSSVariables } from '@/theme/colour'

import { TypedQuery } from './TypedQuery'

type Feature = MarketingFeatureShowcaseBlock['items'][number]['feature']

const club = DEMO_CLUBS[0]

/** Course report: the status panel, with one row changing as the duty manager posts. */
const CourseReport = () => (
  <div className="mk-sc-panel">
    <div className="mk-sc-head">
      <p className="mk-sc-title">Course status</p>
      <p className="mk-sc-when">Updated 06:12</p>
    </div>
    <p className="mk-sc-pill">
      <span className="mk-sc-dot" />
      Course open
    </p>
    <dl className="mk-sc-rows">
      <div>
        <dt>Greens</dt>
        <dd>Cut &amp; rolled</dd>
      </div>
      <div>
        <dt>Tees</dt>
        <dd>Main tees in play</dd>
      </div>
      <div className="mk-sc-changing">
        <dt>Trolleys</dt>
        <dd>
          <span className="mk-sc-swap">
            <span>Allowed</span>
            <span>Paths only</span>
          </span>
        </dd>
      </div>
      <div>
        <dt>Bunkers</dt>
        <dd>Raked, playable</dd>
      </div>
    </dl>
  </div>
)

const EVENTS = [
  {
    day: 'Sat',
    date: '14',
    month: 'Jun',
    title: 'Captain’s Day',
    meta: 'Stableford · 08:00',
    badge: 'Entries open',
  },
  {
    day: 'Sun',
    date: '22',
    month: 'Jun',
    title: 'Mixed Greensomes',
    meta: 'Shotgun · 13:30',
    badge: null,
  },
  {
    day: 'Fri',
    date: '27',
    month: 'Jun',
    title: 'Summer Supper',
    meta: 'Clubhouse · 19:00',
    badge: null,
  },
]

/** Events: the next few fixtures, the first one lifted. */
const Events = () => (
  <ol className="mk-sc-events">
    {EVENTS.map((e, i) => (
      <li key={e.title} className={i === 0 ? 'is-lifted' : undefined}>
        <span className="mk-sc-date">
          <span>{e.day}</span>
          <strong>{e.date}</strong>
          <span>{e.month}</span>
        </span>
        <span className="mk-sc-event">
          <span className="mk-sc-event-title">{e.title}</span>
          <span className="mk-sc-event-meta">{e.meta}</span>
        </span>
        {e.badge ? <span className="mk-sc-badge">{e.badge}</span> : null}
      </li>
    ))}
  </ol>
)

/** Site search: a question typed, the answer from the club's own fees, then results. */
const Search = () => (
  <div className="mk-sc-search">
    <p className="mk-sc-field">
      <svg
        viewBox="0 0 20 20"
        width="16"
        height="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="9" r="6" />
        <path d="m14 14 4 4" strokeLinecap="round" />
      </svg>
      <TypedQuery text="winter green fees" />
    </p>
    <div className="mk-sc-answer">
      <p className="mk-sc-answer-eyebrow">Green fees · Winter</p>
      <dl className="mk-sc-rows">
        <div>
          <dt>Weekday</dt>
          <dd>£55</dd>
        </div>
        <div>
          <dt>Weekend</dt>
          <dd>£70</dd>
        </div>
      </dl>
    </div>
    <ul className="mk-sc-results">
      <li>
        <span>Page</span>Visitors &amp; green fees
      </li>
      <li>
        <span>Document</span>Winter rules (PDF)
      </li>
    </ul>
  </div>
)

/** Green fees: one rate changes, and a note says where it now shows. */
const GreenFees = () => (
  <div className="mk-sc-panel">
    <div className="mk-sc-head">
      <p className="mk-sc-title">Green fees</p>
      <p className="mk-sc-when">Winter rates</p>
    </div>
    <table className="mk-sc-table">
      <thead>
        <tr>
          <th />
          <th>Weekday</th>
          <th>Weekend</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th>18 holes</th>
          <td className="mk-sc-changing">
            <span className="mk-sc-swap">
              <span>£60</span>
              <span>£55</span>
            </span>
          </td>
          <td>£70</td>
        </tr>
        <tr>
          <th>Twilight</th>
          <td>£35</td>
          <td>£40</td>
        </tr>
        <tr>
          <th>Junior</th>
          <td>£20</td>
          <td>£25</td>
        </tr>
      </tbody>
    </table>
    <p className="mk-sc-toast">
      <span className="mk-sc-dot" />
      Saved · shows on 3 pages
    </p>
  </div>
)

const VISUALS: Record<Feature, () => ReactNode> = {
  courseStatus: CourseReport,
  events: Events,
  search: Search,
  greenFees: GreenFees,
}

/**
 * Feature showcase (Dan, 26 Oct, after Linear's AI page): up to four of a club site's everyday
 * features in a 2 × 2 grid. Each card zooms in on one piece of the demo club's site, in its
 * colours, fading out at the edges, with one small movement. The pictures are inert and hidden
 * from screen readers: each card's title and text carry the meaning.
 */
export const FeatureShowcase = ({ block }: { block: MarketingFeatureShowcaseBlock }) => {
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  return (
    <ul className="mk-showcase" data-count={block.items.length}>
      {block.items.map((item, i) => {
        const Visual = VISUALS[item.feature]
        return (
          <li key={item.id ?? i} className="mk-showcase-card">
            <div className="mk-showcase-stage" aria-hidden="true">
              <div className={`club-theme mk-sc mk-sc--${item.feature}`} style={theme} inert>
                <Visual />
              </div>
            </div>
            <div className="mk-showcase-text">
              <h3 className="mk-detail-title">{item.title}</h3>
              <p className="mk-detail-body">{item.body}</p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
