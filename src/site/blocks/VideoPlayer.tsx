'use client'

import { useState } from 'react'

import { Play } from '../components/Icons'

export type VideoItem = {
  id: string
  title: string
  caption: string | null
  provider: 'youtube' | 'vimeo'
  embedURL: string
  poster: { src: string; srcSet: string | null; position: string }
  width: number | null
  height: number | null
}

/**
 * One video. Shows the club's own picture and a play button, and loads the YouTube or Vimeo
 * player only when the visitor presses play (the same idea as the map): nothing is requested
 * from either site before then, so no tracking until the visitor chooses. This one plays in
 * place (the featured style); a gallery of videos uses VideoGallery's pop-up instead.
 */
export const VideoPlayer = ({ item, large }: { item: VideoItem; large: boolean }) => {
  const [playing, setPlaying] = useState(false)
  return (
    <figure className="vd-item">
      <div className="vd-frame">
        {playing ? (
          <iframe
            className="vd-iframe"
            src={item.embedURL}
            title={item.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            type="button"
            className="vd-poster"
            onClick={() => setPlaying(true)}
            aria-label={`Play video: ${item.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2 */}
            <img
              src={item.poster.src}
              srcSet={item.poster.srcSet ?? undefined}
              sizes={
                large ? '(min-width: 1024px) 960px, 100vw' : '(min-width: 1024px) 400px, 100vw'
              }
              alt=""
              loading="lazy"
              width={item.width ?? undefined}
              height={item.height ?? undefined}
              style={{ objectPosition: item.poster.position }}
            />
            <span className="vd-play" aria-hidden="true">
              <Play size={large ? 32 : 24} />
            </span>
          </button>
        )}
      </div>
      <figcaption className="vd-caption">
        <span className={large ? 't-heading-s vd-title' : 't-label-m vd-title'}>{item.title}</span>
        {item.caption ? <span className="t-body-s vd-text">{item.caption}</span> : null}
      </figcaption>
    </figure>
  )
}
