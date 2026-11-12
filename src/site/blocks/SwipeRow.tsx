'use client'

import type { ReactNode } from 'react'

import { CarouselControls, useCarousel } from './CarouselControls'

/**
 * A row of cards: a grid on larger screens (styled by the block), and on phones a swipe
 * carousel that runs to the screen edge with the shared carousel controls below it (docs/design/13
 * v2). The cards stay ordinary links, so it works without JavaScript too.
 */
export const SwipeRow = ({
  className,
  label,
  children,
}: {
  className: string
  label: string
  children: ReactNode[]
}) => {
  const { track, state, go } = useCarousel<HTMLDivElement>(children.length)
  return (
    <>
      <div ref={track} className={`${className} swipe-track`} role="list" aria-label={label}>
        {children.map((child, i) => (
          <div key={i} role="listitem">
            {child}
          </div>
        ))}
      </div>
      <CarouselControls state={state} count={children.length} go={go} className="swipe-controls" />
    </>
  )
}
