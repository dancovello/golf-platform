'use client'

import { type ReactNode, useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react'

import type { PanelDemo } from '@/site/search/SearchPanel'
import { SearchPanel } from '@/site/search/SearchPanel'

const PHONE_WIDTH = 375

/**
 * Lays a real club component out at the width it is designed for and shrinks it to fit its
 * card, so the card shows the component as a visitor sees it, not a cut-down version. On phones
 * the club's own components switch to their phone layout, so they're laid out at phone width.
 */
export const StageFit = ({ width, children }: { width: number; children: ReactNode }) => {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const box = outer.current
    const stage = inner.current
    if (!box || !stage) return
    const fit = () => {
      const laidOut = window.matchMedia('(max-width: 767px)').matches ? PHONE_WIDTH : width
      stage.style.width = `${laidOut}px`
      stage.style.transform = `scale(${box.clientWidth / laidOut})`
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(box)
    window.addEventListener('resize', fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [width])
  return (
    <div ref={outer} className="mk-stage-fit">
      <div ref={inner} className="mk-stage-fit-inner" style={{ width }}>
        {children}
      </div>
    </div>
  )
}

/** The club's real header search, drawn in place and typing a question by itself. */
export const DemoSearch = ({
  demo,
  ...props
}: {
  demo: Omit<PanelDemo, 'animate'>
  base: string
  clubSlug: string
  clubName: string
  shortcuts: Parameters<typeof SearchPanel>[0]['shortcuts']
  contact: Parameters<typeof SearchPanel>[0]['contact']
  phone: string | null
}) => {
  // Null on the server and until the page knows: the panel stays as it opens, nothing searched.
  const animate = useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)')
      query.addEventListener('change', onChange)
      return () => query.removeEventListener('change', onChange)
    },
    () => !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => null,
  )
  return <SearchPanel {...props} demo={{ ...demo, animate }} />
}

/**
 * Spotlight: while the showcase is in the middle of the screen, the rest of the page fades back
 * and blurs (marketing.css does the fading from this attribute), so the cards stand out. One
 * card hovered or focused lifts further. Off for visitors who prefer reduced motion.
 */
export const Spotlight = ({ children }: { children: ReactNode }) => {
  const list = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = list.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.documentElement
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) root.dataset.mkSpotlight = 'on'
        else delete root.dataset.mkSpotlight
      },
      { rootMargin: '-30% 0px -30% 0px' },
    )
    observer.observe(el)
    return () => {
      observer.disconnect()
      delete root.dataset.mkSpotlight
    }
  }, [])
  return (
    <div ref={list} className="mk-spotlight">
      {children}
    </div>
  )
}
