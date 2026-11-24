import { RichTextContent } from '../blocks/RichTextContent'
import { Tabs } from '../blocks/Tabs'
import type { BlockContext } from '../blocks/resolve'
import { ArrowRight } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import type { SiteLink } from '../loadClub'
import type { SiteMatch, SiteResults, SiteResultTable } from '../events'

// The segmented tabs' styles live with the price table, which they were made for.
import '../blocks/rateTable.css'

/** Pairs and teams are typed "A. Smith / B. Jones": one name per line on the page. */
const names = (value: string, who: string) =>
  who === 'individuals'
    ? value
    : value
        .split('/')
        .map((n) => n.trim())
        .filter(Boolean)

const Names = ({ value, who }: { value: string; who: string }) => {
  const list = names(value, who)
  return typeof list === 'string' ? (
    <>{list}</>
  ) : (
    <>
      {list.map((n, i) => (
        <span key={i} className="er-name">
          {n}
        </span>
      ))}
    </>
  )
}

/** "Winner: J. Smith, 42 points" from the first row of the first table. */
const winnerLine = (table: SiteResultTable) => {
  const first = table.rows[0]
  if (!first?.name) return null
  const who = names(first.name, table.who)
  const name = typeof who === 'string' ? who : who.join(' & ')
  const unit =
    table.score === 'points'
      ? ' points'
      : table.score === 'nett'
        ? ' nett'
        : table.score === 'gross'
          ? ' gross'
          : ''
  return first.score ? `${name}, ${first.score}${unit}` : name
}

const ResultTable = ({ table }: { table: SiteResultTable }) => (
  <div className="er-table-wrap">
    {table.note ? <p className="t-body-s er-note">{table.note}</p> : null}
    <div className="er-scroll" tabIndex={0} role="region" aria-label={table.title}>
      <table className="er-table t-body-s">
        <thead>
          <tr>
            {table.keys.map((k, i) => (
              <th key={k} scope="col" className={`t-data-label er-col-${k}`}>
                {table.headings[i]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={r}>
              {table.keys.map((k) =>
                k === 'name' ? (
                  <th key={k} scope="row" className="er-col-name">
                    <Names value={row.name} who={table.who} />
                  </th>
                ) : (
                  <td key={k} className={`er-col-${k}`}>
                    {row[k] || (k === 'score' ? '—' : '')}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

/** Matches in the order entered, under their round's name. */
const byRound = (matches: SiteMatch[]) => {
  const groups: { round: string | null; matches: SiteMatch[] }[] = []
  for (const m of matches) {
    const last = groups[groups.length - 1]
    if (last && last.round === m.round) last.matches.push(m)
    else groups.push({ round: m.round, matches: [m] })
  }
  return groups
}

const Side = ({ name, won }: { name: string; won: boolean }) =>
  won ? (
    <strong className="er-side is-winner">
      {name}
      <span className="visually-hidden"> (won)</span>
    </strong>
  ) : (
    <span className="er-side">{name}</span>
  )

/**
 * Results built into an event's page (24 Nov 2026, plan part 2). No Figma frame yet: the
 * tables borrow the price table's look and the segmented tabs. The winner line, the report,
 * the tables (as tabs when there are several), match results by round, prize winners, and the
 * club's own results file if it added one too. The site shows what the club entered; it never
 * sorts or checks scores.
 */
export const EventResults = ({
  results,
  file,
  ctx,
  base,
}: {
  results: SiteResults
  file: SiteLink | null
  ctx: BlockContext
  base: string
}) => {
  // The first table's top row; with no tables, the winner of the first match (the final).
  const final = results.matches[0]
  const winner = results.tables[0]
    ? winnerLine(results.tables[0])
    : final?.winner === 'a'
      ? final.sideA
      : final?.winner === 'b'
        ? final.sideB
        : null
  return (
    <section id="results" className="blk er" aria-labelledby="results-title">
      <div className="blk-container er-layout">
        <header className="er-head">
          <h2 id="results-title" className="t-heading-l">
            Results
          </h2>
          {winner ? (
            <p className="t-body-l er-winner">
              <span className="t-data-label er-winner-label">Winner</span> {winner}
            </p>
          ) : null}
        </header>
        {results.report ? (
          <div className="rt rt-prose er-report">
            <RichTextContent value={results.report} ctx={ctx} base={base} />
          </div>
        ) : null}
        {results.tables.length > 0 ? (
          <div className="er-tables">
            {results.tables.length === 1 ? (
              <h3 className="t-heading-m er-subtitle">{results.tables[0].title}</h3>
            ) : null}
            <Tabs
              variant="segments"
              label="Results tables"
              labels={results.tables.map((t) => t.title)}
              panels={results.tables.map((t, i) => (
                <ResultTable key={i} table={t} />
              ))}
            />
          </div>
        ) : null}
        {results.matches.length > 0 ? (
          <div className="er-matches">
            <h3 className="t-heading-m er-subtitle">Matches</h3>
            {byRound(results.matches).map((g, i) => (
              <div key={i} className="er-round">
                {g.round ? <h4 className="t-data-label er-round-title">{g.round}</h4> : null}
                <ul className="er-match-list">
                  {g.matches.map((m, j) => (
                    <li key={j} className="er-match t-body-m">
                      {/* The winner is named first: "Hannah Cole beat Neil Bramley at 19th". */}
                      <Side
                        name={m.winner === 'b' ? m.sideB : m.sideA}
                        won={m.winner === 'a' || m.winner === 'b'}
                      />
                      <span className="er-vs t-body-s">
                        {m.winner === 'halved' ? 'halved with' : m.winner ? 'beat' : 'v'}
                      </span>
                      <Side name={m.winner === 'b' ? m.sideA : m.sideB} won={false} />
                      {m.result ? <span className="er-result t-body-s">{m.result}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        {results.prizes.length > 0 ? (
          <div className="er-prizes">
            <h3 className="t-heading-m er-subtitle">Prize winners</h3>
            <dl className="er-prize-list">
              {results.prizes.map((p, i) => (
                <div key={i} className="er-prize">
                  <dt className="t-data-label">{p.prize}</dt>
                  <dd className="t-body-m">
                    {p.winner}
                    {p.detail ? (
                      <span className="t-body-s er-prize-detail"> · {p.detail}</span>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ) : null}
        {file ? (
          <p>
            <a
              className="btn btn-link t-label-button"
              href={siteHref(base, file)}
              {...linkTarget(file)}
            >
              Full results <ArrowRight />
            </a>
          </p>
        ) : null}
      </div>
    </section>
  )
}
