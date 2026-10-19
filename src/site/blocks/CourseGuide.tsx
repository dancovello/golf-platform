'use client'

import { useState } from 'react'

import { ArrowRight } from '../components/Icons'
import { pad2, TeeYards } from './holeParts'
import { Photo } from './parts'
import type { SiteHole, SiteTee } from './resolve'

const FIRST_ROWS = 3

/**
 * Hole-by-hole style C (Figma Hole Card "Guide"): a row per hole with its photo, par and
 * stroke index, playing tip and every tee's yards. Front / Back / All 18 filter; shows three
 * holes, then "Show all". Each row is #hole-N, so the scorecard can link to it.
 */
export const CourseGuide = ({
  holes,
  tees,
  eyebrow,
  heading,
}: {
  holes: SiteHole[]
  tees: SiteTee[]
  eyebrow: string | null
  heading: string
}) => {
  const filters =
    holes.length > 9
      ? [
          { label: 'Front nine', holes: holes.slice(0, 9) },
          { label: 'Back nine', holes: holes.slice(9) },
          { label: `All ${holes.length}`, holes },
        ]
      : [{ label: `All ${holes.length}`, holes }]
  const [filter, setFilter] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const shown = filters[filter].holes

  return (
    <>
      <div className="blk-header">
        <div>
          {eyebrow ? <p className="t-eyebrow blk-eyebrow">{eyebrow}</p> : null}
          <h2 className="t-heading-l blk-heading">{heading}</h2>
        </div>
        {filters.length > 1 ? (
          <div className="tabs tabs-segments hole-filter" role="group" aria-label="Show holes">
            {filters.map((f, i) => (
              <button
                key={f.label}
                type="button"
                className={`tab t-label-s${filter === i ? ' is-active' : ''}`}
                aria-pressed={filter === i}
                onClick={() => setFilter(i)}
              >
                {f.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {/* A sideways swipe row on phones, so it can be focused and scrolled from the keyboard. */}
      <ol className={`hole-guide${expanded ? ' is-expanded' : ''}`} tabIndex={0} aria-label="Holes">
        {shown.map((hole, i) => (
          <li
            key={hole.number}
            id={`hole-${hole.number}`}
            className={`hole-row${i >= FIRST_ROWS ? ' is-more' : ''}`}
          >
            <div className="hole-row-image">
              {hole.image ? (
                <Photo image={hole.image} sizes="(max-width: 767px) 80vw, 280px" alt="" />
              ) : null}
            </div>
            <div className="hole-row-copy">
              <h3 className="hole-row-title">
                <span className="t-data-serif hole-number">{pad2(hole.number)}</span>
                <span className="t-heading-m">{hole.name ?? `Hole ${hole.number}`}</span>
                <span className="t-label-s hole-par">
                  Par {hole.par}
                  {hole.strokeIndex ? ` · SI ${hole.strokeIndex}` : ''}
                </span>
              </h3>
              {hole.tip ? <p className="t-body-m hole-tip">{hole.tip}</p> : null}
            </div>
            <TeeYards hole={hole} tees={tees} />
          </li>
        ))}
      </ol>
      {!expanded && shown.length > FIRST_ROWS ? (
        <button
          type="button"
          className="btn btn-outline t-label-button hole-show-all"
          onClick={() => setExpanded(true)}
        >
          Show all {shown.length} holes <ArrowRight />
        </button>
      ) : null}
    </>
  )
}
