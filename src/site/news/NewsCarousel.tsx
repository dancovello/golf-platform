'use client'

import type { ReactNode } from 'react'

import { CarouselControls, useCarousel } from '../blocks/CarouselControls'
import { ArrowRight } from '../components/Icons'

/**
 * Figma "News / A · Card carousel": three cards in view at 1200 and a track that ends on an
 * "All news" tile. The cards run to the edge of the window; the shared carousel controls sit
 * below them. On phones the cards are 272px and "All news" sits under the heading. The cards
 * stay ordinary links, so it works without JavaScript (the track just scrolls).
 */
export const NewsCarousel = ({
  eyebrow,
  heading,
  allHref,
  allLabel = 'All news',
  variant = 'cards',
  children,
}: {
  eyebrow: string
  heading: string
  allHref: string
  /** e.g. "All events" when the carousel holds event cards. */
  allLabel?: string
  /** "headlines": News block C, text-only headlines on the brand colour, no "All news" tile. */
  variant?: 'cards' | 'headlines'
  children: ReactNode[]
}) => {
  // The "All news" tile is a card in the track too, so it counts.
  const count = children.length + (variant === 'headlines' ? 0 : 1)
  const { track, state, go } = useCarousel<HTMLUListElement>(count)

  return (
    <section
      className={`blk news-carousel${variant === 'headlines' ? ' is-headlines on-brand' : ''}`}
    >
      <div className="blk-container">
        <div className="blk-header">
          <div className="news-carousel-titles">
            <p className="t-eyebrow news-eyebrow">{eyebrow}</p>
            <h2 className="t-heading-l blk-heading">{heading}</h2>
          </div>
          <div className="news-carousel-controls">
            <a className="btn btn-link t-label-button news-link" href={allHref}>
              {allLabel} <ArrowRight />
            </a>
          </div>
        </div>
        <ul ref={track} className="news-carousel-track" aria-label={heading}>
          {children.map((child, i) => (
            <li key={i}>{child}</li>
          ))}
          {variant === 'headlines' ? null : (
            <li>
              <a className="news-all-tile" href={allHref}>
                <span className="news-all-arrow" aria-hidden="true">
                  <ArrowRight size={22} />
                </span>
                <span className="t-label-button">{allLabel}</span>
              </a>
            </li>
          )}
        </ul>
        <CarouselControls state={state} count={count} go={go} />
      </div>
    </section>
  )
}
