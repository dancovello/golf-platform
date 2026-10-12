'use client'

import { type ReactNode, useEffect, useRef } from 'react'

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
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      const el = ref.current
      if (!el) return
      el.dataset.scrolled = String(y > 8)
      el.dataset.hiddenUtility = String(y > threshold && y > last)
      last = y
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
