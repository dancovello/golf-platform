'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

const QUERY = 'winter green fees'

/**
 * Search: starts empty, with the club's quick links, then types a question and shows the answer,
 * then clears and starts again. Everyone sees the answer at once if they prefer reduced motion.
 * Decorative: its card is hidden from screen readers.
 */
export const SearchIllustration = () => {
  const [typed, setTyped] = useState(QUERY.length)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let count = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      // Empty for a moment, a letter every 90ms, then the answer holds for about four seconds.
      count = count > QUERY.length + 44 ? 0 : count + 1
      setTyped(Math.min(count, QUERY.length))
      timer = setTimeout(tick, count === 0 ? 1400 : 90)
    }
    timer = setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [])
  const answered = typed === QUERY.length
  return (
    <div
      className="mk-li-panel mk-li-search"
      data-state={answered ? 'answer' : typed ? 'typing' : 'empty'}
    >
      <div className="mk-li-field">
        <svg
          viewBox="0 0 20 20"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" strokeLinecap="round" />
        </svg>
        <span className="mk-li-typed">
          {typed ? (
            QUERY.slice(0, typed)
          ) : (
            <span className="mk-li-placeholder">Search Ashgrove Park</span>
          )}
          <i className="mk-li-caret" />
        </span>
        <kbd>esc</kbd>
      </div>
      {answered ? (
        <div className="mk-li-found">
          <div className="mk-li-answer">
            <p className="mk-li-eyebrow">Top answer</p>
            <p className="mk-li-answer-title">Green fees</p>
            <div className="mk-li-facts">
              <p>
                <strong>£55</strong>
                <span>Winter · 18 holes · Mon–Thu</span>
              </p>
              <p>
                <strong>£70</strong>
                <span>Winter · 18 holes · Fri–Sun</span>
              </p>
            </div>
          </div>
          <ul className="mk-li-results">
            <li>
              <span>Visitors &amp; green fees</span>
              <em>Page</em>
            </li>
            <li>
              <span>Winter rules</span>
              <em>Document</em>
            </li>
          </ul>
        </div>
      ) : (
        <ul className="mk-li-results mk-li-quick">
          <li>
            <span>Course status</span>
            <em>Open · updated 06:12</em>
          </li>
          <li>
            <span>Green fees</span>
            <em>From £20</em>
          </li>
          <li>
            <span>Opening hours</span>
            <em>Open today</em>
          </li>
        </ul>
      )}
    </div>
  )
}

/**
 * Spotlight: while the cards are in the middle of the screen, the rest of the page fades back and
 * blurs (marketing.css does the fading from this attribute), so they stand out. Off for visitors
 * who prefer reduced motion.
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
