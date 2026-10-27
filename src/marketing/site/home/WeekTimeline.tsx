'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'

import type { PreviewData } from '@/marketing/demo/previews'

import { AvailabilityBadge } from '../parts'
import { PreviewCard } from './PreviewCard'

type Moment = {
  time: string
  title: string
  body: string
  preview: PreviewData
}

/** How far the visitor scrolls for each moment, as a share of the screen's height. */
const SCROLL_PER_MOMENT = 0.65

/**
 * Marketing/Timeline Moment (178:2450): on desktop the week stays pinned while the visitor
 * scrolls, and moments go Upcoming → Active → Past as the track fills, one per two-thirds of a
 * screen. Phones get a swipeable row; reduced motion shows every moment as it ends up.
 */
export const WeekTimeline = ({ moments, theme }: { moments: Moment[]; theme: CSSProperties }) => {
  const runway = useRef<HTMLDivElement>(null)
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(-1)
  const [scrollDriven, setScrollDriven] = useState(false)

  useEffect(() => {
    const query = window.matchMedia(
      '(min-width: 1024px) and (prefers-reduced-motion: no-preference)',
    )
    const update = () => setScrollDriven(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!scrollDriven) return
    const onScroll = () => {
      const track = runway.current
      const week = root.current
      if (!track || !week) return
      // How far through the pinned stretch the visitor is: 0 when the week pins, 1 as it leaves.
      const pinnedAt = parseFloat(getComputedStyle(week).top) || 0
      const travel = track.offsetHeight - week.offsetHeight
      const progress = travel > 0 ? (pinnedAt - track.getBoundingClientRect().top) / travel : 1
      setActive(Math.floor(Math.min(0.999, Math.max(0, progress)) * moments.length))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [scrollDriven, moments.length])

  // Without scroll-driving (phones, reduced motion) every moment shows as it ends up.
  const stateOf = (i: number) =>
    !scrollDriven || active < 0
      ? 'still'
      : i < active
        ? 'past'
        : i === active
          ? 'active'
          : 'upcoming'

  return (
    <div ref={runway} className="mk-week-runway">
      <div ref={root} className="mk-week" data-scroll-driven={scrollDriven}>
        <div className="mk-week-track" aria-hidden="true">
          <span
            className="mk-week-progress"
            style={{
              width:
                !scrollDriven || active < 0
                  ? '100%'
                  : `${((active + 0.5) / moments.length) * 100}%`,
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
              <PreviewCard preview={moment.preview} theme={theme} />
            </li>
          ))}
        </ol>
        <p className="mk-week-hint" aria-hidden="true">
          Swipe for the rest of the week →
        </p>
      </div>
      {/* The scroll the week stays pinned for. */}
      {scrollDriven ? (
        <div
          className="mk-week-spacer"
          style={{ height: `${moments.length * SCROLL_PER_MOMENT * 100}svh` }}
          aria-hidden="true"
        />
      ) : null}
    </div>
  )
}
