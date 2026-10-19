'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { SiteAnnouncement } from '../loadClub'
import { ChevronLeft, ChevronRight, Close, Phone } from './Icons'
import { linkTarget, siteHref } from './links'

const ROTATE_MS = 6000
const KEY = 'announcement-dismissed'

/** The same notices always give the same key, so a dismissal lasts until they change. */
const keyOf = (a: SiteAnnouncement) => a.items.map((i) => i.message).join('|')

const untilLabel = (iso: string) =>
  `Until ${new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })}`

/**
 * Figma "Announcement Bar", above the site header on every page (not sticky). A Classic: one
 * centred line. B Rotator: up to three notices, every 6 seconds, paused on hover or focus and
 * never moving for people who prefer reduced motion. C Utility: the notice on the left, the
 * course status and phone on the right. Long messages show "Read more". Dismissing hides the
 * notices for the rest of the visit (C keeps its status and phone).
 */
export const AnnouncementBar = ({ data, base }: { data: SiteAnnouncement; base: string }) => {
  const [dismissed, setDismissed] = useState(false)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const message = useRef<HTMLParagraphElement>(null)
  const count = data.items.length
  const item = data.items[Math.min(index, count - 1)]

  useEffect(() => {
    try {
      // The visitor's earlier choice, from this browser session.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (sessionStorage.getItem(KEY) === keyOf(data)) setDismissed(true)
    } catch {
      // Storage blocked: the bar simply stays.
    }
  }, [data])

  useEffect(() => {
    if (data.style !== 'rotator' || count < 2 || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS)
    return () => window.clearInterval(timer)
  }, [data.style, count, paused])

  // "Read more" appears when the clamped message is cut off. Showing the button narrows the
  // message, so the check only ever switches it on; it starts again when the notice or the
  // window width changes (never on its own, which would make the bar flicker).
  useLayoutEffect(() => {
    const el = message.current
    if (!el) return
    const check = () => {
      if (el.scrollHeight > el.clientHeight + 1) setOverflows(true)
    }
    let width = window.innerWidth
    const onResize = () => {
      if (window.innerWidth === width) return
      width = window.innerWidth
      setOverflows(false)
      requestAnimationFrame(check)
    }
    setOverflows(false)
    check()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [item])

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem(KEY, keyOf(data))
    } catch {
      // Storage blocked: hidden for this page only.
    }
  }

  const showNotice = Boolean(item) && !dismissed
  const utilities =
    data.style === 'utility' && (data.status || data.phone) ? (
      <div className="ab-utilities t-label-s">
        {data.status ? (
          <span className="ab-status">
            <span className={`status-dot is-${data.status.state}`} aria-hidden="true" />
            <span className="ab-utility-text">{data.status.label}</span>
          </span>
        ) : null}
        {data.phone ? (
          <a className="ab-phone" href={`tel:${data.phone.replace(/[^+0-9]/g, '')}`}>
            <Phone />
            <span className="ab-utility-text">{data.phone}</span>
          </a>
        ) : null}
      </div>
    ) : null

  if (!showNotice && !utilities) return null

  return (
    <div
      className={`ab ab-${data.style} is-${data.tone}`}
      role="region"
      aria-label="Site announcement"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="ab-inner">
        {showNotice && item ? (
          <div className="ab-notice">
            {data.style === 'rotator' ? (
              <span className="t-data-label ab-tag">{item.tag}</span>
            ) : null}
            <div className="ab-text" aria-live={data.style === 'rotator' ? 'polite' : undefined}>
              <p ref={message} className={`t-body-s ab-message${expanded ? ' is-expanded' : ''}`}>
                {item.message}
              </p>
              <div className="ab-links t-label-s">
                {overflows || expanded ? (
                  <button type="button" onClick={() => setExpanded((e) => !e)}>
                    {expanded ? 'Show less' : 'Read more'}
                  </button>
                ) : null}
                {item.link ? (
                  <a href={siteHref(base, item.link.link)} {...linkTarget(item.link.link)}>
                    {item.link.label}
                  </a>
                ) : null}
                {data.style === 'utility' ? (
                  <span className="t-data-label ab-until">{untilLabel(item.expiresAt)}</span>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <span />
        )}
        <div className="ab-controls">
          {utilities}
          {showNotice && data.style === 'rotator' && count > 1 ? (
            <div className="ab-pager t-label-s">
              <button
                type="button"
                aria-label="Previous notice"
                onClick={() => setIndex((i) => (i - 1 + count) % count)}
              >
                <ChevronLeft size={16} />
              </button>
              <span aria-hidden="true">
                {index + 1} / {count}
              </span>
              <button
                type="button"
                aria-label="Next notice"
                onClick={() => setIndex((i) => (i + 1) % count)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          ) : null}
          {showNotice ? (
            <button
              type="button"
              className="ab-dismiss"
              aria-label="Dismiss announcement"
              onClick={dismiss}
            >
              <Close size={16} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
