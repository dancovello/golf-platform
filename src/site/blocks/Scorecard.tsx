import type { ScorecardBlock } from '@/payload-types'

import { Download } from '../components/Icons'
import { Paragraphs } from './parts'
import type { BlockContext, SiteCourse } from './resolve'
import { fmt, halves, Summary, sum, TeeLabel } from './scorecardParts'
import { TeeScorecard } from './TeeScorecard'
import { NEW_TAB } from '../components/links'

/** Style A: one table per nine, holes across; a row per tee, then par and stroke index. */
const Classic = ({ course }: { course: SiteCourse }) => (
  <>
    {halves(course.holes).map((p) => (
      <div key={p.label} className="sc-scroll">
        <table className="sc-table sc-classic">
          <caption className="visually-hidden">
            {course.name}, {p.label.toLowerCase()}
          </caption>
          <thead>
            <tr>
              <th scope="col" className="t-label-s">
                Hole
              </th>
              {p.holes.map((h) => (
                <th key={h.number} scope="col" className="t-data-label">
                  {h.number}
                </th>
              ))}
              <th scope="col" className="t-label-s is-total">
                {p.total}
              </th>
            </tr>
          </thead>
          <tbody className="t-body-s">
            {course.tees.map((t, i) => (
              <tr key={t.colour}>
                <th scope="row">
                  <TeeLabel tee={t} />
                </th>
                {p.holes.map((h) => (
                  <td key={h.number}>{fmt(h.yards[i])}</td>
                ))}
                <td className="is-total">{fmt(sum(p.holes, (h) => h.yards[i]))}</td>
              </tr>
            ))}
            <tr>
              <th scope="row">Par</th>
              {p.holes.map((h) => (
                <td key={h.number}>{h.par}</td>
              ))}
              <td className="is-total">{fmt(sum(p.holes, (h) => h.par))}</td>
            </tr>
            <tr>
              <th scope="row">Stroke index</th>
              {p.holes.map((h) => (
                <td key={h.number}>{h.strokeIndex ?? '—'}</td>
              ))}
              <td className="is-total">—</td>
            </tr>
          </tbody>
        </table>
      </div>
    ))}
    <Summary course={course} tees={course.tees} ratingTee={course.tees[0]} />
  </>
)

/** Style B: holes down; front and back nine side by side on raised panels. */
const Vertical = ({ course, linkToGuide }: { course: SiteCourse; linkToGuide: boolean }) => {
  const parts = halves(course.holes)
  return (
    <div className="sc-nines">
      {parts.map((p, n) => (
        <div key={p.label} className="sc-panel">
          <h3 className="t-heading-m">{p.label}</h3>
          <table className="sc-table sc-vertical">
            <thead>
              <tr className="t-data-label">
                <th scope="col">Hole</th>
                <th scope="col">Par</th>
                <th scope="col">
                  <abbr title="Stroke index">SI</abbr>
                </th>
                {course.tees.map((t) => (
                  <th key={t.colour} scope="col">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="t-body-s">
              {p.holes.map((h) => (
                <tr key={h.number}>
                  <th scope="row">
                    {linkToGuide ? <a href={`#hole-${h.number}`}>{h.number}</a> : h.number}
                  </th>
                  <td>{h.par}</td>
                  <td>{h.strokeIndex ?? '—'}</td>
                  {course.tees.map((t, i) => (
                    <td key={t.colour}>{fmt(h.yards[i])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
            <tfoot className="t-body-s">
              <tr className="is-total">
                <th scope="row">{p.total}</th>
                <td>{fmt(sum(p.holes, (h) => h.par))}</td>
                <td>—</td>
                {course.tees.map((t, i) => (
                  <td key={t.colour}>{fmt(sum(p.holes, (h) => h.yards[i]))}</td>
                ))}
              </tr>
              {parts.length > 1 && n === parts.length - 1 ? (
                <tr className="is-total">
                  <th scope="row">Total</th>
                  <td>{fmt(sum(course.holes, (h) => h.par))}</td>
                  <td>—</td>
                  {course.tees.map((t, i) => (
                    <td key={t.colour}>{fmt(sum(course.holes, (h) => h.yards[i]))}</td>
                  ))}
                </tr>
              ) : null}
            </tfoot>
          </table>
        </div>
      ))}
    </div>
  )
}

/**
 * Scorecard (docs/design/09), three styles over one of the club's courses: A Classic (the
 * printed card; scrolls sideways on phones with the row labels fixed), B Vertical (no
 * sideways scrolling at any width) and C Tee selector (pick a tee; figures update in place).
 */
export const Scorecard = ({ block, ctx }: { block: ScorecardBlock; ctx: BlockContext }) => {
  const course = ctx.course(block.course)
  if (!course || course.holes.length === 0) return null
  const style = block.style ?? 'classic'
  const download = ctx.document(block.download)

  return (
    <section className={`blk sc sc-${style}-block${style === 'vertical' ? ' on-subtle' : ''}`}>
      <div className="blk-container">
        <div className="blk-header">
          <div>
            {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
            <h2 className="t-heading-l blk-heading">{block.heading}</h2>
          </div>
          {download && style !== 'teeSelector' ? (
            <a className="btn btn-outline t-label-button" href={download.url} {...NEW_TAB}>
              Download scorecard ({download.type}) <Download size={20} />
            </a>
          ) : null}
        </div>
        {style === 'vertical' ? (
          <Vertical course={course} linkToGuide={Boolean(block.linkToGuide)} />
        ) : style === 'teeSelector' ? (
          <TeeScorecard course={course} />
        ) : (
          <Classic course={course} />
        )}
        {block.note ? <Paragraphs text={block.note} className="t-body-s sc-note" /> : null}
      </div>
    </section>
  )
}
