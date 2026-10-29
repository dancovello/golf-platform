'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react'

/** Scroll up this far (more than the 36px utility row) before the row comes back. */
const REVEAL_AFTER = 48

/**
 * Sticky behaviour from the header specs. Sets data-scrolled once the page has scrolled past
 * `threshold`, and data-hidden-utility while scrolling down (style A's utility row collapses,
 * and comes back on scroll up). The CSS does the rest.
 */
export const HeaderScroll = ({
  id,
  children,
  className,
  style,
  threshold = 200,
}: {
  id?: string
  children: ReactNode
  className: string
  style?: CSSProperties
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
      // Once hidden, it only comes back well above the threshold. Otherwise, on a page that
      // can scroll just past it, hiding the row shortens the page, pulls the scroll back
      // under the threshold, shows the row again, and the browser scrolls back down: a loop.
      if (y <= (hidden ? threshold - REVEAL_AFTER : threshold)) {
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
    // data-compact is set by the script after the header (headerFit.ts), before React loads.
    <header ref={ref} id={id} className={className} style={style} suppressHydrationWarning>
      {children}
    </header>
  )
}
