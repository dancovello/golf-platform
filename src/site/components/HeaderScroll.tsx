'use client'

import { type ReactNode, useEffect, useRef } from 'react'

/** Scroll up this far (more than the 36px utility row) before the row comes back. */
const REVEAL_AFTER = 48

/**
 * Sticky behaviour from the header specs. Sets data-scrolled once the page has scrolled past
 * `threshold`, and data-hidden-utility while scrolling down (style A's utility row collapses,
 * and comes back on scroll up). The CSS does the rest.
 */
export const HeaderScroll = ({
  children,
  className,
  threshold = 200,
}: {
  children: ReactNode
  className: string
  threshold?: number
}) => {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    // Where the last hide/show decision was made. Hiding the utility row makes the page
    // shorter, which can nudge the scroll position up by the row's height near the bottom of
    // a page; it only comes back after a deliberate scroll up of more than that, so the
    // header never flickers between the two.
    let anchor = window.scrollY
    let hidden = false
    const onScroll = () => {
      const y = window.scrollY
      const el = ref.current
      if (!el) return
      el.dataset.scrolled = String(y > 8)
      if (y <= threshold) {
        hidden = false
        anchor = y
      } else if (!hidden && y > anchor) {
        hidden = true
        anchor = y
      } else if (hidden && y > anchor) {
        anchor = y
      } else if (hidden && y < anchor - REVEAL_AFTER) {
        hidden = false
        anchor = y
      } else if (!hidden) {
        anchor = y
      }
      el.dataset.hiddenUtility = String(hidden)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [threshold])
  return (
    <header ref={ref} className={className}>
      {children}
    </header>
  )
}
