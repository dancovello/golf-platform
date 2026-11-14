'use client'

import { useState } from 'react'

import { Play } from '../components/Icons'
import { BrandedVideo } from './BrandedVideo'
import { VideoDialog } from './VideoDialog'

export type VideoItem = {
  id: string
  title: string
  caption: string | null
  provider: 'youtube' | 'vimeo' | 'file'
  /** The YouTube or Vimeo player address; null for an uploaded file. */
  embedURL: string | null
  /** The club's own uploaded video file, played in our own player; null for YouTube or Vimeo. */
  fileURL?: string | null
  poster: { src: string; srcSet: string | null; position: string }
  width: number | null
  height: number | null
}

/** The player itself: the club's own branded one for an uploaded file, else the provider's. */
export const VideoFrame = ({ item, onLoad }: { item: VideoItem; onLoad?: () => void }) => {
  if (item.fileURL) {
    return <BrandedVideo src={item.fileURL} poster={item.poster.src || null} title={item.title} />
  }
  return (
    <iframe
      className="vd-iframe"
      src={item.embedURL ?? undefined}
      title={item.title}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      referrerPolicy="strict-origin-when-cross-origin"
      onLoad={onLoad}
    />
  )
}

/**
 * One video. Shows the club's own picture and a play button, and loads the YouTube or Vimeo
 * player (or, for an uploaded file, the club's own player) only when the visitor presses play (the same idea as the map): nothing is requested
 * from either site before then, so no tracking until the visitor chooses. This one plays in
 * place (featured, standard and full width) or in a pop-up (half and half); a gallery of
 * videos uses the same pop-up. No title or description sits under it: the title is read out
 * to screen-reader users from the button.
 */
export const VideoPlayer = ({
  item,
  large,
  modal = false,
}: {
  item: VideoItem
  large: boolean
  /** Open in a pop-up window instead of playing in place (half and half). */
  modal?: boolean
}) => {
  const [playing, setPlaying] = useState(false)
  return (
    <figure className="vd-item">
      <div className="vd-frame">
        {playing && !modal ? (
          <VideoFrame item={item} />
        ) : (
          <button
            type="button"
            className="vd-poster"
            onClick={() => setPlaying(true)}
            aria-haspopup={modal ? 'dialog' : undefined}
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
      {modal ? (
        <VideoDialog item={playing ? item : null} onClose={() => setPlaying(false)} />
      ) : null}
    </figure>
  )
}
