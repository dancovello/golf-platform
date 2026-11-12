'use client'

import { type KeyboardEvent, type TouchEvent, useRef, useState } from 'react'

import { ArrowLeft, ArrowRight, Close, Expand, Play } from '../components/Icons'
import type { SiteMedia } from './media'

type Mode = 'photos' | 'plan' | 'video'
const MODE_LABELS: Record<Mode, string> = { photos: 'Photos', plan: 'Hole plan', video: 'Video' }

/**
 * The media viewer of Course tour styles B and C (Figma 419:5330, 423:6491; expanded 419:5776).
 * A switch between Photos, Hole plan and Video, offering only the kinds the hole has; a photo
 * carousel with a count, worked by the arrows, the keyboard's arrow keys or a swipe; and an
 * expand button that opens the same viewer full-size in a pop-up (a native dialog: Esc or the
 * cross closes it and focus returns to the button). Nothing loads from YouTube or Vimeo until
 * the visitor presses play. With no photo at all it shows the hole's number on the club's colour.
 */
export const TourMedia = ({
  photos,
  plan,
  video,
  title,
  number,
  sizes,
}: {
  photos: SiteMedia[]
  plan: SiteMedia | null
  video: string | null
  /** "Hole 2: The Firs", for the names screen readers hear. */
  title: string
  /** "02", shown when the hole has no photo. */
  number: string
  sizes: string
}) => {
  const modes: Mode[] = [
    ...(photos.length || (!plan && !video) ? (['photos'] as const) : []),
    ...(plan ? (['plan'] as const) : []),
    ...(video ? (['video'] as const) : []),
  ]
  const [mode, setMode] = useState<Mode>(modes[0])
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)
  const touchX = useRef<number | null>(null)

  const count = photos.length
  const go = (step: number) => count > 1 && setIndex((i) => (i + step + count) % count)
  const choose = (next: Mode) => {
    setMode(next)
    setPlaying(false)
  }
  const onKey = (e: KeyboardEvent) => {
    if (mode !== 'photos') return
    if (e.key === 'ArrowRight') go(1)
    if (e.key === 'ArrowLeft') go(-1)
  }
  const open = () => {
    setExpanded(true)
    dialog.current?.showModal()
  }

  const view = (large: boolean) => {
    const photo = photos[index]
    return (
      <div
        className={`tour-media-view is-${mode}${large ? ' is-large' : ''}`}
        onKeyDown={onKey}
        onTouchStart={(e: TouchEvent) => {
          touchX.current = e.touches[0]?.clientX ?? null
        }}
        onTouchEnd={(e: TouchEvent) => {
          const start = touchX.current
          const end = e.changedTouches[0]?.clientX
          if (
            mode === 'photos' &&
            start !== null &&
            end !== undefined &&
            Math.abs(end - start) > 40
          )
            go(end < start ? 1 : -1)
          touchX.current = null
        }}
      >
        <div className="tour-media-stage on-image">
          {mode === 'video' && video ? (
            playing ? (
              <iframe
                className="tour-media-frame"
                src={video}
                title={`Video: ${title}`}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            ) : (
              <button
                type="button"
                className="tour-media-poster"
                onClick={() => setPlaying(true)}
                aria-label={`Play video: ${title}`}
              >
                {photos[0] ? <MediaImage image={photos[0]} sizes={sizes} alt="" /> : null}
                <span className="vd-play" aria-hidden="true">
                  <Play size={32} />
                </span>
              </button>
            )
          ) : mode === 'plan' && plan ? (
            <MediaImage image={plan} sizes={sizes} alt={plan.alt || `Plan of ${title}`} contain />
          ) : photo ? (
            <MediaImage image={photo} sizes={large ? '100vw' : sizes} alt={photo.alt} />
          ) : (
            <span className="tour-no-photo tour-media-none" aria-hidden="true">
              {number}
            </span>
          )}
        </div>

        {modes.length > 1 ? (
          <div className="tour-seg" role="group" aria-label="Show">
            {modes.map((m) => (
              <button
                key={m}
                type="button"
                className="t-label-s tour-seg-item"
                aria-pressed={mode === m}
                onClick={() => choose(m)}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>
        ) : null}

        {large ? (
          <button
            type="button"
            className="tour-media-round tour-media-expand"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
          >
            <Close size={24} />
          </button>
        ) : photos.length || plan ? (
          <button
            type="button"
            className="tour-media-round tour-media-expand"
            aria-label="Expand"
            aria-haspopup="dialog"
            onClick={open}
          >
            <Expand size={24} />
          </button>
        ) : null}

        {mode === 'photos' && count > 1 ? (
          <>
            <p className="t-label-s tour-media-count" aria-live="polite">
              <span className="visually-hidden">Photo </span>
              {index + 1} / {count}
            </p>
            <div className="tour-media-arrows">
              <button
                type="button"
                className="tour-media-arrow"
                aria-label="Previous photo"
                onClick={() => go(-1)}
              >
                <ArrowLeft size={24} />
              </button>
              <button
                type="button"
                className="tour-media-arrow"
                aria-label="Next photo"
                onClick={() => go(1)}
              >
                <ArrowRight size={24} />
              </button>
            </div>
            {large ? (
              <div className="tour-media-thumbs">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    className="tour-media-thumb"
                    aria-label={`Photo ${i + 1}: ${p.alt}`}
                    aria-current={i === index ? 'true' : undefined}
                    onClick={() => setIndex(i)}
                  >
                    <MediaImage image={p} sizes="64px" alt="" />
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    )
  }

  return (
    <div className="tour-media" role="region" aria-label={`Photos and video: ${title}`}>
      {view(false)}
      <dialog
        ref={dialog}
        className="tour-media-dialog"
        aria-label={`Photos and video: ${title}`}
        onClose={() => {
          setExpanded(false)
          setPlaying(false)
        }}
      >
        {expanded ? view(true) : null}
      </dialog>
    </div>
  )
}

const MediaImage = ({
  image,
  sizes,
  alt,
  contain = false,
}: {
  image: SiteMedia
  sizes: string
  alt: string
  contain?: boolean
}) => (
  // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
  <img
    className={contain ? 'is-contain' : undefined}
    src={image.url}
    srcSet={image.srcSet ?? undefined}
    sizes={sizes}
    alt={alt}
    style={contain ? undefined : { objectPosition: image.position }}
  />
)
