'use client'

import { useEffect, useRef } from 'react'

/**
 * Makes a full-bleed hero fill exactly what's left of the window below the header and any
 * announcement bar, whatever their height (which differs by header style and club). Sets
 * --hero-offset on the hero; the CSS has a close estimate until this has run.
 */
export const HeroFit = () => {
  const marker = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const hero = marker.current?.closest<HTMLElement>('.hero-full')
    if (!hero) return
    const fit = () => {
      // Where the hero starts on the page, ignoring how far it has been scrolled. Under a
      // transparent header the hero starts at the top, so only an announcement bar counts.
      const top = Math.max(0, hero.getBoundingClientRect().top + window.scrollY)
      hero.style.setProperty('--hero-offset', `${Math.round(top)}px`)
    }
    fit()
    const observer = new ResizeObserver(fit)
    for (const el of document.querySelectorAll('.ab, .sh')) observer.observe(el)
    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [])

  return <span ref={marker} hidden />
}
