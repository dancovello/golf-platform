'use client'

import type { ReactNode } from 'react'

import { CarouselControls, useCarousel } from './CarouselControls'

/**
 * A carousel of cards for every screen size: three across on a wide screen, two on a tablet,
 * and one and a bit on a phone so the next card peeks in. The cards run to the edge of the
 * window; the controls (CarouselControls) sit below, in the page column. The cards stay
 * ordinary links, so the row still scrolls (by touch, trackpad or keyboard) without JavaScript.
 * Styles are in ctaCardGrid.css.
 */
export const CardCarousel = ({ label, children }: { label: string; children: ReactNode[] }) => {
  const { track, state, go } = useCarousel<HTMLDivElement>(children.length)
  return (
    <div className="cg-carousel">
      <div ref={track} className="cg-carousel-track" role="list" aria-label={label}>
        {children.map((child, i) => (
          <div key={i} role="listitem">
            {child}
          </div>
        ))}
      </div>
      <CarouselControls state={state} count={children.length} go={go} />
    </div>
  )
}
