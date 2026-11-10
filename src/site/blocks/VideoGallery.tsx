'use client'

import { useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight, Play } from '../components/Icons'
import { VideoDialog } from './VideoDialog'
import type { VideoItem } from './VideoPlayer'

export type GalleryLayout = 'auto' | 'grid' | 'carousel'

/**
 * Video style B: a gallery of videos. Each shows the club's own picture; pressing one opens it
 * in a pop-up window that plays it larger (a native dialog: focus stays inside, Esc, the cross
 * or a press outside closes it, and focus goes back to the picture). Nothing loads from YouTube
 * or Vimeo until a visitor presses a picture, and closing the window stops the video.
 *
 * Layout: "auto" is a grid on tablets and wider for up to 3 videos and a carousel for more,
 * and a swipe carousel on phones. "grid" and "carousel" stay as chosen. The styling is in
 * video.css, from the classes below, so it works without JavaScript too (the pictures are
 * buttons, so the pop-up itself needs it).
 */
export const VideoGallery = ({ items, layout }: { items: VideoItem[]; layout: GalleryLayout }) => {
  const [open, setOpen] = useState<VideoItem | null>(null)
  const track = useRef<HTMLUListElement>(null)
  const [index, setIndex] = useState(0)
  const count = items.length

  useEffect(() => {
    const el = track.current
    if (!el) return
    const onScroll = () => {
      const first = el.firstElementChild as HTMLElement | null
      if (!first) return
      const step = first.offsetWidth + 24
      setIndex(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / step))))
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [count])

  const go = (to: number) => {
    const el = track.current
    const card = el?.children[Math.min(count - 1, Math.max(0, to))] as HTMLElement | undefined
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' })
  }
  const pad = (n: number) => String(n).padStart(2, '0')

  // How many sit side by side on a wide screen, and whether the row scrolls there.
  const wide = layout === 'carousel' || (layout === 'auto' && count > 3) ? 'carousel' : 'grid'
  const across = Math.min(count, 3)
  // Up to 3 videos fit in one view on a wide screen, so there is nothing to scroll.
  const few = count <= 3 ? ' vd-few' : ''

  return (
    <div
      className={`vd-gallery-wrap vd-layout-${layout} vd-wide-${wide} vd-across-${across}${few}`}
    >
      <ul ref={track} className="vd-gallery" aria-label="Videos">
        {items.map((item) => (
          <li key={item.id} className="vd-gallery-item">
            <figure className="vd-item">
              <div className="vd-frame">
                <button
                  type="button"
                  className="vd-poster"
                  onClick={() => setOpen(item)}
                  aria-haspopup="dialog"
                  aria-label={`Play video: ${item.title}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2 */}
                  <img
                    src={item.poster.src}
                    srcSet={item.poster.srcSet ?? undefined}
                    sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 82vw"
                    alt=""
                    loading="lazy"
                    width={item.width ?? undefined}
                    height={item.height ?? undefined}
                    style={{ objectPosition: item.poster.position }}
                  />
                  <span className="vd-play" aria-hidden="true">
                    <Play size={24} />
                  </span>
                </button>
              </div>
              <figcaption className="vd-caption">
                <span className="t-label-m vd-title">{item.title}</span>
                {item.caption ? <span className="t-body-s vd-text">{item.caption}</span> : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>
      {count > 1 ? (
        <div className="vd-pager t-label-s" aria-hidden="true">
          <button type="button" tabIndex={-1} disabled={index === 0} onClick={() => go(index - 1)}>
            <ChevronLeft />
          </button>
          <span>
            {pad(index + 1)} / {pad(count)}
          </span>
          <button
            type="button"
            tabIndex={-1}
            disabled={index >= count - 1}
            onClick={() => go(index + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      ) : null}
      <VideoDialog item={open} onClose={() => setOpen(null)} />
    </div>
  )
}
