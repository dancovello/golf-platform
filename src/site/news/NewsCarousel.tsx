'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

import { ArrowLeft, ArrowRight } from '../components/Icons'

/**
 * Figma "News / A · Card carousel": three cards in view at 1200, arrows move one card and
 * disable at each end, and the track ends on an "All news" tile. On phones the cards are 272px
 * and run to the screen edge, and "All news" sits under the heading instead of the arrows.
 * The cards stay ordinary links, so it works without JavaScript (the track just scrolls).
 */
export const NewsCarousel = ({
  eyebrow,
  heading,
  allHref,
  children,
}: {
  eyebrow: string
  heading: string
  allHref: string
  children: ReactNode[]
}) => {
  const track = useRef<HTMLUListElement>(null)
  const [atStart, setAtStart] = useState(true)
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    const el = track.current
    if (!el) return
    const update = () => {
      setAtStart(el.scrollLeft <= 1)
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 1)
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  const step = (direction: 1 | -1) => {
    const el = track.current
    const card = el?.firstElementChild as HTMLElement | null
    if (!el || !card) return
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: direction * (card.offsetWidth + gap), behavior: 'smooth' })
  }

  return (
    <section className="blk news-carousel">
      <div className="blk-container">
        <div className="blk-header">
          <div className="news-carousel-titles">
            <p className="t-eyebrow news-eyebrow">{eyebrow}</p>
            <h2 className="t-heading-l blk-heading">{heading}</h2>
          </div>
          <div className="news-carousel-controls">
            <a className="btn btn-link t-label-button news-link" href={allHref}>
              All news <ArrowRight />
            </a>
            <button
              type="button"
              className="news-arrow"
              aria-label="Previous articles"
              disabled={atStart}
              onClick={() => step(-1)}
            >
              <ArrowLeft size={24} />
            </button>
            <button
              type="button"
              className="news-arrow"
              aria-label="More articles"
              disabled={atEnd}
              onClick={() => step(1)}
            >
              <ArrowRight size={24} />
            </button>
          </div>
        </div>
        <ul ref={track} className="news-carousel-track" aria-label={heading}>
          {children.map((child, i) => (
            <li key={i}>{child}</li>
          ))}
          <li>
            <a className="news-all-tile" href={allHref}>
              <span className="news-all-arrow" aria-hidden="true">
                <ArrowRight size={22} />
              </span>
              <span className="t-label-button">All news</span>
            </a>
          </li>
        </ul>
      </div>
    </section>
  )
}
