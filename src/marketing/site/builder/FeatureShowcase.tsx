import type { ReactNode } from 'react'

import type { MarketingFeatureShowcaseBlock } from '@/payload-types'

import { SearchIllustration, Spotlight } from './ShowcaseClient'

type Feature = MarketingFeatureShowcaseBlock['items'][number]['feature']

const Dot = ({ tone = 'live' }: { tone?: 'live' | 'warn' }) => (
  <i className={`mk-li-dot is-${tone}`} />
)

/** Course report: the club's status rows, with the trolley rule changing as the duty manager posts. */
const CourseStatus = () => (
  <>
    <div className="mk-li-panel">
      <header className="mk-li-bar">
        <span className="mk-li-title">Course status</span>
        <span className="mk-li-pill">
          <Dot />
          Course open
        </span>
      </header>
      <p className="mk-li-sub">Updated 06:12 · by the duty manager</p>
      <dl className="mk-li-rows">
        <div>
          <dt>Greens</dt>
          <dd>
            <Dot />
            Cut &amp; rolled
          </dd>
        </div>
        <div>
          <dt>Tees</dt>
          <dd>
            <Dot />
            Main tees in play
          </dd>
        </div>
        <div className="is-focus">
          <dt>Trolleys</dt>
          <dd>
            <span className="mk-li-swap">
              <span>
                <Dot />
                Allowed
              </span>
              <span>
                <Dot tone="warn" />
                Paths only
              </span>
            </span>
          </dd>
        </div>
        <div>
          <dt>Bunkers</dt>
          <dd>
            <Dot />
            Raked, playable
          </dd>
        </div>
      </dl>
    </div>
    <p className="mk-li-toast is-late">
      <Dot />
      Shown on your homepage
    </p>
  </>
)

const EVENTS = [
  {
    day: 'Sat',
    date: '12',
    month: 'Jun',
    tag: 'Competition',
    title: 'Captain’s Day',
    meta: '08:00 · First tee',
    price: '£45',
  },
  {
    day: 'Sun',
    date: '20',
    month: 'Jun',
    tag: 'Competition',
    title: 'Mixed Greensomes',
    meta: '13:30 · First tee',
    price: '£30',
  },
  {
    day: 'Fri',
    date: '25',
    month: 'Jun',
    tag: 'Social',
    title: 'Summer Supper',
    meta: '19:00 · Clubhouse',
    price: '£28',
  },
]

/** Events: the next fixtures as the club lists them, the first one in focus. */
const Events = () => (
  <div className="mk-li-panel">
    <header className="mk-li-bar">
      <span className="mk-li-title">What’s on</span>
      <span className="mk-li-link">All events →</span>
    </header>
    <ol className="mk-li-events">
      {EVENTS.map((e, i) => (
        <li key={e.title} className={i === 0 ? 'is-focus' : undefined}>
          <span className="mk-li-date">
            <small>{e.day}</small>
            <strong>{e.date}</strong>
            <small>{e.month}</small>
          </span>
          <span className="mk-li-event">
            <em>{e.tag}</em>
            <span>{e.title}</span>
            <small>{e.meta}</small>
          </span>
          {i === 0 ? (
            <span className="mk-li-book">Book · {e.price}</span>
          ) : (
            <span className="mk-li-price">{e.price}</span>
          )}
        </li>
      ))}
    </ol>
  </div>
)

/** Green fees: one rate changes, and a note says it went everywhere it shows. */
const GreenFees = () => (
  <>
    <div className="mk-li-panel">
      <header className="mk-li-bar">
        <span className="mk-li-title">Green fees</span>
        <span className="mk-li-pill is-quiet">Winter 2026/27</span>
      </header>
      <table className="mk-li-table">
        <thead>
          <tr>
            <th />
            <th>Mon–Thu</th>
            <th>Fri–Sun &amp; BH</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>18 holes</th>
            <td className="is-focus">
              <span className="mk-li-swap is-number">
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
    </div>
    <p className="mk-li-toast is-late">
      <Dot />
      Saved · every page that shows it is updated
    </p>
  </>
)

const VISUALS: Record<Feature, () => ReactNode> = {
  courseStatus: CourseStatus,
  events: Events,
  search: SearchIllustration,
  greenFees: GreenFees,
}

/**
 * Feature showcase (Dan, 26 Oct, after Linear's AI page; restyled 28 Oct after looking at it
 * closely): up to four everyday features in a hairline grid. Each cell is a simplified, dark
 * picture of the club site's feature, cropped and faded into the page, with one thing in focus
 * and one small change on a loop; the title and a line of text sit underneath. The words and
 * fields in each picture are the ones the club site has. The pictures are hidden from screen
 * readers: the cell's title and text carry the meaning. While the grid is mid-screen the rest of
 * the page fades back (Spotlight).
 */
export const FeatureShowcase = ({ block }: { block: MarketingFeatureShowcaseBlock }) => (
  <Spotlight>
    <ul className="mk-showcase" data-count={block.items.length}>
      {block.items.map((item, i) => {
        const Visual = VISUALS[item.feature]
        return (
          <li key={item.id ?? i} className="mk-showcase-card">
            <div className="mk-showcase-stage" aria-hidden="true">
              <div className={`mk-li mk-li--${item.feature}`}>
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
  </Spotlight>
)
