'use client'

import type { ReactNode } from 'react'

import { CarouselControls, useCarousel } from './CarouselControls'

/**
 * Timeline B's horizontal strip: scroll-snap cards running to the edge of the window, with the
 * shared carousel controls below. The arrows move three cards at a time and the label shows the
 * years in view (e.g. "1926 — 1953"). Arrow keys scroll when focused.
 */
export const TimelineTrack = ({
  years,
  children,
  label,
}: {
  years: string[]
  children: ReactNode[]
  label: string
}) => {
  const { track, state, go } = useCarousel<HTMLOListElement>(years.length)
  const last = Math.min(years.length - 1, state.index + 2)
  return (
    <>
      <ol ref={track} className="tl-track" tabIndex={0} aria-label={label}>
        {children}
      </ol>
      <CarouselControls
        state={state}
        count={years.length}
        go={go}
        by={3}
        noun="years"
        label={
          <span aria-live="polite">
            {years[state.index]} — {years[last]}
          </span>
        }
        className="tl-controls"
      />
    </>
  )
}
