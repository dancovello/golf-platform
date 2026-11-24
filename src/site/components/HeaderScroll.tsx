'use client'

import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react'

/** Scroll up this far (more than the 36px utility row) before the row comes back. */
const REVEAL_AFTER = 48

/**
 * Sticky behaviour from the header specs. Sets data-scrolled once the page has scrolled past
 * `threshold`, and data-hidden-utility while scrolling down (style A's utility row collapses,
 * and comes back on scroll up). It also sets data-hidden: the whole header slides away while
 * the page scrolls down and comes back as soon as the visitor scrolls up, or the page is at the
 * top, or something inside the header (a menu, a focused link) is in use. The CSS does the rest.
 */
/** Don't hide until the page has scrolled this far, so the header is there on arrival. */
const HIDE_AFTER = 120
/** Scroll this far in one direction before the header changes (ignores trackpad jitter). */
const SLIDE_DISTANCE = 12
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
    let lastY = window.scrollY
    let away = false
    const onScroll = () => {
      const y = window.scrollY
      const el = ref.current
      if (!el) return
      el.dataset.scrolled = String(y > 8)
      // The whole header: away on the way down, back on the way up. Bounces past the ends of
      // the page (negative or beyond the bottom) never count as a direction.
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      const delta = y - lastY
      if (y > 0 && y < maxY + 1 && Math.abs(delta) >= SLIDE_DISTANCE) {
        away = delta > 0 && y > HIDE_AFTER
        lastY = y
      } else if (y <= HIDE_AFTER) {
        away = false
        lastY = y
      }
      el.dataset.hidden = String(away)
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
