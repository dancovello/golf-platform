import type { SiteCourse, SiteTee } from './resolve'
import { handicapTable, showHandicap, showRange } from './courseHandicap'
import { ladiesPar, sum } from './scorecardParts'
import { Tabs } from './Tabs'

type Table = { label: string; rows: NonNullable<ReturnType<typeof handicapTable>> }

/** The tables a course can show: each tee for men and for women, where the figures exist. */
const tablesFor = (course: SiteCourse, allowance: number): Table[] => {
  const menPar = sum(course.holes, (h) => h.par)
  const womenPar = sum(course.holes, ladiesPar)
  const out: Table[] = []
  for (const tee of course.tees as SiteTee[]) {
    const men =
      tee.players === 'women'
        ? null
        : handicapTable({ rating: tee.rating, slope: tee.slope, par: menPar }, allowance)
    const women =
      tee.players === 'men'
        ? null
        : handicapTable(
            { rating: tee.ratingWomen, slope: tee.slopeWomen, par: womenPar },
            allowance,
          )
    // Name the group only when a tee has both, so a single table keeps its plain tee name.
    if (men) out.push({ label: women ? `${tee.name} (men)` : tee.name, rows: men })
    if (women) out.push({ label: men ? `${tee.name} (women)` : tee.name, rows: women })
  }
  return out
}

/**
 * Course handicap tables (G7, 15 Nov 2026): for each tee, which handicap indexes give which
 * course handicap, worked out from the tee's rating, slope and par (src/site/blocks/
 * handicapTable.ts). Several tables become tabs. Each scrolls inside its own box.
 */
export const HandicapTable = ({ course, allowance }: { course: SiteCourse; allowance: number }) => {
  const tables = tablesFor(course, allowance)
  if (tables.length === 0) return null
  const playing = allowance !== 100
  const panel = (t: Table) => (
    <div
      key={t.label}
      className="hc-scroll"
      tabIndex={0}
      role="region"
      aria-label={`Course handicap table, ${t.label}`}
    >
      <table className="sc-table hc-table">
        <caption className="visually-hidden">Course handicap table, {t.label}</caption>
        <thead>
          <tr className="t-data-label">
            <th scope="col">Handicap index</th>
            <th scope="col">Course handicap</th>
            {playing ? <th scope="col">Playing handicap ({allowance}%)</th> : null}
          </tr>
        </thead>
        <tbody className="t-body-s">
          {t.rows.map((r) => (
            <tr key={r.from}>
              <th scope="row">{showRange(r)}</th>
              <td>{showHandicap(r.courseHandicap)}</td>
              {playing ? (
                <td>{r.playingHandicap == null ? '—' : showHandicap(r.playingHandicap)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  return (
    <div className="hc">
      <h3 className="t-heading-m hc-title">Course handicap table</h3>
      <Tabs
        variant="segments"
        label="Course handicap table"
        labels={tables.map((t) => t.label)}
        panels={tables.map(panel)}
      />
      <p className="t-body-s hc-note">
        Worked out from each tee’s course rating, slope and par. Your club’s own table is the
        official one.
      </p>
    </div>
  )
}
