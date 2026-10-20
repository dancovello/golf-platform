'use client'

import { useEffect, useState } from 'react'

import type { SiteCourse } from './resolve'
import { fmt, halves, Summary, sum, TeeLabel } from './scorecardParts'

/**
 * Scorecard style C: the whole course on one strip for the chosen tee. The tee picker
 * updates the figures and the yards row in place, and is kept in the address (?tee=yellow)
 * so the view can be shared. Without JavaScript the main (first) tee is shown.
 */
export const TeeScorecard = ({ course }: { course: SiteCourse }) => {
  const [active, setActive] = useState(0)
  const tee = course.tees[active]

  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get('tee')
    const i = course.tees.findIndex((t) => t.colour === wanted)
    // Reading the address once, on arrival: an external value, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (i > 0) setActive(i)
  }, [course.tees])

  const choose = (i: number) => {
    setActive(i)
    const url = new URL(window.location.href)
    url.searchParams.set('tee', course.tees[i].colour)
    window.history.replaceState(null, '', url)
  }

  const parts = halves(course.holes)
  const yards = (n: number) => course.holes[n - 1]?.yards[active] ?? null

  return (
    <>
      {course.tees.length > 1 ? (
        <div className="tabs tabs-segments sc-tee-picker" role="group" aria-label="Tees">
          {course.tees.map((t, i) => (
            <button
              key={t.colour}
              type="button"
              className={`tab t-label-s${active === i ? ' is-active' : ''}`}
              aria-pressed={active === i}
              onClick={() => choose(i)}
            >
              {t.name} tees
            </button>
          ))}
        </div>
      ) : null}
      <Summary course={course} tees={tee ? [tee] : []} ratingTee={tee} />
      <div
        className="sc-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${course.name}, ${tee?.name ?? ''} tees`}
      >
        <table className="sc-table sc-strip">
          <caption className="visually-hidden">
            {course.name}, {tee?.name} tees
          </caption>
          <thead>
            <tr>
              <th scope="col" className="t-label-s">
                Hole
              </th>
              {parts.flatMap((p) => [
                ...p.holes.map((h) => (
                  <th key={h.number} scope="col" className="t-data-label">
                    {h.number}
                  </th>
                )),
                <th key={p.total} scope="col" className="t-label-s is-total">
                  {p.total}
                </th>,
              ])}
              {parts.length > 1 ? (
                <th scope="col" className="t-label-s is-total">
                  Tot
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="t-body-s">
            <tr>
              <th scope="row">{tee ? <TeeLabel tee={tee} suffix=" yards" /> : 'Yards'}</th>
              {parts.flatMap((p) => [
                ...p.holes.map((h) => <td key={h.number}>{fmt(yards(h.number))}</td>),
                <td key={p.total} className="is-total">
                  {fmt(sum(p.holes, (h) => h.yards[active]))}
                </td>,
              ])}
              {parts.length > 1 ? (
                <td className="is-total">{fmt(sum(course.holes, (h) => h.yards[active]))}</td>
              ) : null}
            </tr>
            <tr>
              <th scope="row">Par</th>
              {parts.flatMap((p) => [
                ...p.holes.map((h) => <td key={h.number}>{h.par}</td>),
                <td key={p.total} className="is-total">
                  {fmt(sum(p.holes, (h) => h.par))}
                </td>,
              ])}
              {parts.length > 1 ? (
                <td className="is-total">{fmt(sum(course.holes, (h) => h.par))}</td>
              ) : null}
            </tr>
            <tr>
              <th scope="row">
                <abbr title="Stroke index">SI</abbr>
              </th>
              {parts.flatMap((p) => [
                ...p.holes.map((h) => <td key={h.number}>{h.strokeIndex ?? '—'}</td>),
                <td key={p.total} className="is-total">
                  —
                </td>,
              ])}
              {parts.length > 1 ? <td className="is-total">—</td> : null}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="visually-hidden" aria-live="polite">
        Showing {tee?.name} tees
      </p>
    </>
  )
}
