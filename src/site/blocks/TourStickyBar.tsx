'use client'

import { type ReactNode, useEffect, useRef } from 'react'

/**
 * A bar that stays in view just under the site header while the page scrolls (style A's hole
 * picker, B's rail). The header's height differs between header styles and shrinks as the page
 * scrolls, so the bar follows the header's real height rather than a fixed figure. Without
 * JavaScript it sticks to the top of the window instead.
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
      // For anything pinned below the bar (style B's media panel).
      bar.parentElement?.style.setProperty('--tour-pinned-top', `${top + bar.offsetHeight}px`)
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(header)
    window.addEventListener('scroll', place, { passive: true })
    return () => {
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
