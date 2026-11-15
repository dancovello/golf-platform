import type { VisitorTimesBlock } from '@/payload-types'

import { siteToday } from '../today'
import { isCurrentSeason } from './seasons'
import { Tabs } from './Tabs'

type Timetable = NonNullable<VisitorTimesBlock['timetables']>[number]

/**
 * Visitor times (G4, 15 Nov 2026): when visitors can play, a row per day. Several timetables
 * (e.g. summer and winter) become tabs, opening on the one for this month. Borrows the Price
 * table's classic look (rateTable.css) until it is drawn in Figma.
 */
export const VisitorTimes = ({ block }: { block: VisitorTimesBlock }) => {
  const timetables = (block.timetables ?? []).filter((t) => t.rows?.length)
  if (timetables.length === 0) return null
  const today = siteToday()
  const current = timetables.findIndex((t) => isCurrentSeason(t, today))

  const table = (t: Timetable, i: number) => (
    <div key={i} className="rate-scroll">
      <table className="rate-table visitor-times-table">
        <caption className="visually-hidden">
          {block.heading}
          {t.name ? ` — ${t.name}` : ''}
        </caption>
        <thead>
          <tr>
            <th scope="col" className="t-data-label">
              Day
            </th>
            <th scope="col" className="t-data-label">
              Visitors
            </th>
          </tr>
        </thead>
        <tbody>
          {(t.rows ?? []).map((row, k) => (
            <tr key={k}>
              <th scope="row" className="t-data-sans">
                {row.days}
              </th>
              <td>
                <span className="t-data-sans">{row.times}</span>
                {row.note ? <span className="t-body-s rate-sub">{row.note}</span> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <section className="blk rate rate-classic visitor-times">
      <div className="blk-container rate-narrow">
        <div className="blk-header is-stacked">
          <div>
            {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
            <h2 className="t-heading-l blk-heading">{block.heading}</h2>
            {block.intro ? <p className="t-body-m blk-intro rate-intro">{block.intro}</p> : null}
          </div>
        </div>
        <Tabs
          labels={timetables.map((t, i) => t.name?.trim() || `Timetable ${i + 1}`)}
          panels={timetables.map(table)}
          variant="tabs"
          label={block.heading}
          initial={Math.max(0, current)}
        />
        {block.footnote ? (
          <div className="rate-footer">
            <p className="t-body-s rate-footnote">{block.footnote}</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
