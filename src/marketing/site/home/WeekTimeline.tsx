'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'

import { AvailabilityBadge } from '../parts'

type Moment = {
  time: string
  title: string
  body: string
  preview: { title: string; status: string; when: string; rows: [string, string][] }
}

/**
 * Marketing/Timeline Moment (178:2450): moments go Upcoming → Active → Past as the track fills
 * while the visitor scrolls (desktop). Phones get a swipeable row; reduced motion shows every
 * moment as it ends up.
 */
export const WeekTimeline = ({ moments, theme }: { moments: Moment[]; theme: CSSProperties }) => {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)

  useEffect(() => {
    const scrollDriven = window.matchMedia(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    )
    if (!scrollDriven.matches) return
    const onScroll = () => {
      const el = root.current
      if (!el) return
      const box = el.getBoundingClientRect()
      // From the track reaching 80% of the window to it reaching 30%.
      const progress = (window.innerHeight * 0.8 - box.top) / (window.innerHeight * 0.5)
      const index = Math.floor(Math.min(0.999, Math.max(0, progress)) * moments.length)
      setActive(progress <= 0 ? 0 : index)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [moments.length])

  const stateOf = (i: number) =>
    active < 0 ? 'still' : i < active ? 'past' : i === active ? 'active' : 'upcoming'

  return (
    <div ref={root} className="mk-week">
      <div className="mk-week-track" aria-hidden="true">
        <span
          className="mk-week-progress"
          style={{
            width: active < 0 ? '100%' : `${((active + 0.5) / moments.length) * 100}%`,
          }}
        />
      </div>
      {/* Focusable, so keyboard users can scroll the row on phones (WCAG 2.1.1). */}
      <ol className="mk-week-moments" aria-label="A week at the club" tabIndex={0}>
        {moments.map((moment, i) => (
          <li key={i} className="mk-moment" data-state={stateOf(i)}>
            <p className="mk-moment-time">
              <span className="mk-moment-dot" aria-hidden="true" />
              <span>{moment.time}</span>
              <AvailabilityBadge status="live" size="small" />
            </p>
            <div className="mk-moment-text">
              <h3>{moment.title}</h3>
              <p>{moment.body}</p>
            </div>
            {/* A picture of the club's live block; the title and text above carry the meaning. */}
            <div className="club-theme mk-moment-preview" style={theme} inert aria-hidden="true">
              <p className="mk-preview-title">{moment.preview.title}</p>
              <p className="mk-preview-status">
                <span className="mk-preview-dot" aria-hidden="true" />
                <span>{moment.preview.status}</span>
                <span className="mk-preview-when">{moment.preview.when}</span>
              </p>
              <dl>
                {moment.preview.rows.map(([term, value]) => (
                  <div key={term}>
                    <dt>{term}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ol>
      <p className="mk-week-hint" aria-hidden="true">
        Swipe for the rest of the week →
      </p>
    </div>
  )
}
