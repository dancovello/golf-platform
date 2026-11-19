'use client'

import { type ReactNode, useLayoutEffect, useRef } from 'react'

/**
 * Fades a page section in as it scrolls into view (Dan, 19 Nov). The page is drawn fully visible
 * by the server, so nothing is hidden if scripts fail. Once the page is on screen, a section that
 * is still below the fold is hidden just before it is first painted, then shown when it comes
 * into view (marketing.css does the fade). Sections already on screen are left alone, and nothing
 * moves for visitors who prefer reduced motion.
 */
export const Reveal = ({ className, children }: { className?: string; children: ReactNode }) => {
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = box.current
    if (
      !el ||
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      el.getBoundingClientRect().top < window.innerHeight * 0.9
    ) {
      return
    }
    el.dataset.reveal = 'hidden'
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.dataset.reveal = 'shown'
        observer.disconnect()
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      delete el.dataset.reveal
    }
  }, [])
  return (
    <div ref={box} className={className}>
      {children}
    </div>
  )
}
