'use client'

import { type ReactNode, useState } from 'react'

import { Expand } from '../components/Icons'

/**
 * Shows the drawn map, and swaps in the interactive OpenStreetMap only when the visitor asks
 * (doc 05: load the heavy map on click). Nothing is requested from OpenStreetMap before then.
 */
export const MapFrame = ({
  children,
  embedURL,
  title,
  className = '',
}: {
  children: ReactNode
  embedURL: string | null
  title: string
  className?: string
}) => {
  const [live, setLive] = useState(false)
  return (
    <div className={`map-frame ${className}`}>
      {live && embedURL ? (
        <iframe
          className="map-iframe"
          src={embedURL}
          title={title}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <>
          {children}
          {embedURL ? (
            <button type="button" className="map-load t-label-s" onClick={() => setLive(true)}>
              <Expand /> Load interactive map
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
