'use client'

import { useEffect, useRef, useState } from 'react'

import { Play } from '../components/Icons'

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const whole = Math.floor(seconds)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

const Glyph = ({ children }: { children: React.ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    {children}
  </svg>
)

/**
 * The club's own video player, for a video file the club uploaded. Our own controls in the
 * club's colours, with no YouTube or Vimeo branding and nothing loaded from another site.
 * Every control is a real button (or a slider), so keyboard and screen-reader users have the
 * same controls as everyone else. Starts playing when it appears, because the visitor has
 * just pressed play on the picture.
 */
export const BrandedVideo = ({
  src,
  poster,
  title,
}: {
  src: string
  poster: string | null
  title: string
}) => {
  const video = useRef<HTMLVideoElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [length, setLength] = useState(0)
  const [muted, setMuted] = useState(false)
  const [full, setFull] = useState(false)

  useEffect(() => {
    void video.current?.play().catch(() => setPlaying(false))
  }, [])
  useEffect(() => {
    const change = () => setFull(document.fullscreenElement === frame.current)
    document.addEventListener('fullscreenchange', change)
    return () => document.removeEventListener('fullscreenchange', change)
  }, [])

  const toggle = () => {
    const el = video.current
    if (!el) return
    if (el.paused) void el.play().catch(() => setPlaying(false))
    else el.pause()
  }

  return (
    <div className="vd-branded" ref={frame}>
      <video
        ref={video}
        className="vd-video"
        src={src}
        poster={poster ?? undefined}
        playsInline
        preload="metadata"
        aria-label={title}
        onClick={toggle}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
        onDurationChange={(e) => setLength(e.currentTarget.duration)}
      />
      {playing ? null : (
        <button type="button" className="vd-big-play" onClick={toggle} aria-label="Play">
          <Play size={32} />
        </button>
      )}
      <div className="vd-controls">
        <button
          type="button"
          className="vd-control"
          onClick={toggle}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          <Glyph>
            {playing ? (
              <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
            ) : (
              <path d="M8 5l11 7-11 7z" />
            )}
          </Glyph>
        </button>
        <span className="vd-time t-body-s" aria-hidden="true">
          {clock(time)} / {clock(length)}
        </span>
        <input
          type="range"
          className="vd-seek"
          min={0}
          max={length || 0}
          step={0.1}
          value={Math.min(time, length || 0)}
          aria-label="Seek"
          aria-valuetext={`${clock(time)} of ${clock(length)}`}
          onChange={(e) => {
            const el = video.current
            if (el) el.currentTime = Number(e.target.value)
            setTime(Number(e.target.value))
          }}
        />
        <button
          type="button"
          className="vd-control"
          onClick={() => {
            const el = video.current
            if (!el) return
            el.muted = !el.muted
            setMuted(el.muted)
          }}
          aria-label={muted ? 'Unmute' : 'Mute'}
          aria-pressed={muted}
        >
          <Glyph>
            {muted ? (
              <path d="M3 9v6h4l5 4V5L7 9H3zm13.6 3 2.4-2.4-1.4-1.4-2.4 2.4-2.4-2.4-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4z" />
            ) : (
              <path d="M3 9v6h4l5 4V5L7 9H3zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4z" />
            )}
          </Glyph>
        </button>
        <button
          type="button"
          className="vd-control"
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen()
            else void frame.current?.requestFullscreen?.()
          }}
          aria-label={full ? 'Exit full screen' : 'Full screen'}
        >
          <Glyph>
            <path d="M5 5h5v2H7v3H5V5zm9 0h5v5h-2V7h-3V5zM5 14h2v3h3v2H5v-5zm12 0h2v5h-5v-2h3v-3z" />
          </Glyph>
        </button>
      </div>
    </div>
  )
}
