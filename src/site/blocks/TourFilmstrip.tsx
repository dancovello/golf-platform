'use client'

import { useEffect, useState } from 'react'

import { useCarousel } from './CarouselControls'

import type { SiteMedia } from './media'

export type FilmHole = {
  number: number
  label: string
  name: string | null
  par: number
  href: string
  image: SiteMedia | null
}

type Show = 'front' | 'back' | 'all'
const SHOW_LABELS: Record<Show, string> = { front: 'Front nine', back: 'Back nine', all: 'All 18' }

/**
 * Style C's filmstrip (Figma 423:6421; mobile 424:6717): a small photo of every hole, the
 * current one outlined, with a thin line showing how far round the visitor is. With 18 holes a
 * switch shows the front nine, the back nine or all of them; it starts on the nine the current
 * hole is in. On phones the switch goes and the whole strip swipes sideways. The holes are
 * plain links, so the strip works without JavaScript.
 */
export const TourFilmstrip = ({
  heading,
  holes,
  current,
}: {
  heading: string
  holes: FilmHole[]
  current: number
}) => {
  const split = holes.length > 9
  const [show, setShow] = useState<Show>(!split ? 'all' : current > 9 ? 'back' : 'front')
  const inView = (n: number) => show === 'all' || (show === 'front' ? n <= 9 : n > 9)
  return (
    <>
      <div className="tour-film-head">
        <p className="t-heading-l tour-film-heading">{heading}</p>
        {split ? (
          <div className="tour-seg tour-film-seg" role="group" aria-label="Holes shown">
            {(['front', 'back', 'all'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className="t-label-s tour-seg-item"
                aria-pressed={show === s}
                onClick={() => setShow(s)}
              >
                {SHOW_LABELS[s]}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <FilmTrack
        key={show}
        holes={holes}
        current={current}
        heading={heading}
        all={show === 'all' && split}
        inView={inView}
      />
    </>
  )
}

/**
 * The scrolling row of holes and the thin bar under it. The bar's marker is the part of the
 * strip in view and moves as the strip scrolls (the same rule as every carousel on the site).
 * Remounted when the nine changes, so it measures the new row.
 */
const FilmTrack = ({
  holes,
  current,
  heading,
  all,
  inView,
}: {
  holes: FilmHole[]
  current: number
  heading: string
  all: boolean
  inView: (n: number) => boolean
}) => {
  const { track, state } = useCarousel<HTMLElement>(holes.length)
  // Slide the strip so the hole being viewed starts in view (the strip only, never the page).
  useEffect(() => {
    const row = track.current
    const here = row?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!row || !here) return
    const r = row.getBoundingClientRect()
    const c = here.getBoundingClientRect()
    row.scrollTo({ left: row.scrollLeft + c.left - r.left - (r.width - c.width) / 2 })
  }, [track])
  return (
    <>
      <nav
        ref={track}
        className={`tour-film-strip${all ? ' is-all' : ''}`}
        aria-label={`${heading}: holes`}
      >
        {holes.map((h) => (
          <a
            key={h.number}
            className={`tour-film-hole${inView(h.number) ? '' : ' is-out'}`}
            href={h.href}
            aria-current={h.number === current ? 'page' : undefined}
            aria-label={`${h.label}, par ${h.par}`}
          >
            <span className="tour-film-photo">
              {h.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
                <img
                  src={h.image.url}
                  srcSet={h.image.srcSet ?? undefined}
                  sizes="140px"
                  alt=""
                  loading="lazy"
                  style={{ objectPosition: h.image.position }}
                />
              ) : null}
            </span>
            <span className="t-label-s tour-film-name">
              <span className="tour-film-number">{String(h.number).padStart(2, '0')}</span>
              {h.name ? <span>{h.name}</span> : null}
            </span>
            <span className="t-data-label tour-film-par">Par {h.par}</span>
          </a>
        ))}
      </nav>
      <div className="tour-film-progress" aria-hidden="true">
        <span style={{ width: `${state.size}%`, left: `${state.start}%` }} />
      </div>
    </>
  )
}
