'use client'

import { useEffect, useRef, useState } from 'react'

import type { SiteMedia } from './media'

/**
 * A silent looping background video with the mandatory play/pause control (doc 07). Visitors
 * who prefer reduced motion see the poster photo and can start it themselves.
 */
export const HeroVideo = ({ video, poster }: { video: SiteMedia; poster: SiteMedia }) => {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!reduce) void ref.current?.play().catch(() => setPlaying(false))
  }, [])

  return (
    <>
      <video
        ref={ref}
        className="hero-media"
        src={video.url}
        poster={poster.url}
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
        style={{ objectPosition: poster.position }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        className="hero-media-control"
        aria-label={playing ? 'Pause background video' : 'Play background video'}
        onClick={() => (playing ? ref.current?.pause() : void ref.current?.play())}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
          {playing ? <path d="M7 5h3v14H7zM14 5h3v14h-3z" /> : <path d="M8 5l11 7-11 7z" />}
        </svg>
      </button>
    </>
  )
}
