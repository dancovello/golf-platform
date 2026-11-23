'use client'

import { type ReactNode, useEffect, useRef } from 'react'

/**
 * A bar that stays in view just under the site header while the page scrolls (style A's hole
 * picker, B's rail). The header's height differs between header styles and shrinks as the page
 * scrolls, so the bar follows the header's real height rather than a fixed figure. The header
 * also slides away while the page scrolls down and back on the way up (HeaderScroll), and the
 * bar glides with it. Without JavaScript it sticks to the top of the window instead.
 *
 * It sets data-stuck on the bar while it is pinned, so a bar can slim itself down then (style
 * C's filmstrip drops its photos).
 */
export const TourStickyBar = ({
  className,
  children,
}: {
  className: string
  children: ReactNode
}) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.sh')
    const bar = ref.current
    if (!header || !bar) return
    const place = () => {
      const top = Math.max(0, Math.round(header.getBoundingClientRect().bottom))
      bar.style.top = `${top}px`
      bar.dataset.stuck = String(window.scrollY > 0 && bar.getBoundingClientRect().top <= top + 1)
      // For anything pinned below the bar (style B's media panel).
      bar.parentElement?.style.setProperty('--tour-pinned-top', `${top + bar.offsetHeight}px`)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(header)
    window.addEventListener('scroll', place, { passive: true })
    // The header slides by a CSS transition, which fires no scroll events: follow it frame by
    // frame until it has settled.
    let frame = 0
    const follow = (until: number) => {
      place()
      if (performance.now() < until) frame = requestAnimationFrame(() => follow(until))
    }
    const slide = new MutationObserver(() => {
      cancelAnimationFrame(frame)
      follow(performance.now() + 400)
    })
    slide.observe(header, { attributes: true, attributeFilter: ['data-hidden'] })
    return () => {
      cancelAnimationFrame(frame)
      slide.disconnect()
      observer.disconnect()
      window.removeEventListener('scroll', place)
    }
  }, [])
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
