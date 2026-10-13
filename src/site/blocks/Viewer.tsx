'use client'

import { type TouchEvent, useCallback, useEffect, useRef } from 'react'

import { ChevronLeft, ChevronRight, Close } from '../components/Icons'

export type ViewerItem = {
  src: string
  srcSet: string | null
  alt: string
  caption: string | null
  position: string
}

/**
 * The photo viewer (Figma "Gallery / C · Lightbox"): one photo at a time, arrows, counter,
 * caption and a thumbnail strip (hidden on phones, where you swipe instead). As a full-screen
 * dialog (A and B) it traps focus, closes on Esc and returns focus to the photo that opened
 * it; ←/→ move between photos. Neighbouring photos are preloaded.
 */
export const Viewer = ({
  items,
  index,
  onIndex,
  onClose,
  label,
}: {
  items: ViewerItem[]
  index: number
  onIndex: (i: number) => void
  /** Present for the full-screen dialog; absent when the viewer sits on the page. */
  onClose?: () => void
  label: string
}) => {
  const root = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)
  const thumbs = useRef<HTMLDivElement>(null)
  const count = items.length
  const go = useCallback(
    (step: number) => onIndex((index + step + count) % count),
    [index, count, onIndex],
  )

  useEffect(() => {
    if (!onClose) return
    const previous = document.activeElement as HTMLElement | null
    const bodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    root.current?.querySelector<HTMLElement>('.vw-close')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !root.current) return
      const f = [...root.current.querySelectorAll<HTMLElement>('button')]
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault()
        f[f.length - 1]?.focus()
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault()
        f[0]?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = bodyOverflow
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [onClose])

  useEffect(() => {
    // Keep the current thumbnail in view; preload the neighbours.
    thumbs.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' })
    for (const step of [-1, 1]) {
      const n = items[(index + step + count) % count]
      if (n) Object.assign(new Image(), { srcset: n.srcSet ?? '', src: n.src, sizes: '100vw' })
    }
  }, [index, items, count])

  const item = items[index]
  if (!item) return null
  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div
      ref={root}
      className={`vw${onClose ? ' is-dialog' : ''}`}
      role={onClose ? 'dialog' : 'region'}
      aria-modal={onClose ? true : undefined}
      aria-label={label}
      aria-roledescription="photo viewer"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1)
        if (e.key === 'ArrowLeft') go(-1)
      }}
      onTouchStart={(e: TouchEvent) => {
        touchX.current = e.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(e: TouchEvent) => {
        const start = touchX.current
        const end = e.changedTouches[0]?.clientX
        if (start !== null && end !== undefined && Math.abs(end - start) > 40)
          go(end < start ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="vw-top">
        <p className="t-label-s vw-count" aria-live="polite">
          {pad(index + 1)} / {pad(count)}
        </p>
        {onClose ? (
          <button type="button" className="vw-close" aria-label="Close" onClick={onClose}>
            <Close />
          </button>
        ) : null}
      </div>
      <div className="vw-stage">
        {count > 1 ? (
          <button
            type="button"
            className="vw-arrow vw-prev"
            aria-label="Previous photo"
            onClick={() => go(-1)}
          >
            <ChevronLeft />
          </button>
        ) : null}
        <figure className="vw-figure">
          {/* eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2 */}
          <img
            className="vw-img"
            src={item.src}
            srcSet={item.srcSet ?? undefined}
            sizes="(max-width: 767px) 100vw, 1000px"
            alt={item.alt}
            style={{ objectPosition: item.position }}
          />
          {item.caption ? (
            <figcaption className="t-caption vw-caption">{item.caption}</figcaption>
          ) : null}
        </figure>
        {count > 1 ? (
          <button
            type="button"
            className="vw-arrow vw-next"
            aria-label="Next photo"
            onClick={() => go(1)}
          >
            <ChevronRight />
          </button>
        ) : null}
      </div>
      {count > 1 ? (
        <div ref={thumbs} className="vw-thumbs">
          {items.map((t, i) => (
            <button
              key={i}
              type="button"
              className="vw-thumb"
              aria-label={`Photo ${i + 1}: ${t.alt}`}
              aria-current={i === index ? 'true' : undefined}
              onClick={() => onIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- small copy from R2 */}
              <img src={t.src} srcSet={t.srcSet ?? undefined} sizes="80px" alt="" loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
