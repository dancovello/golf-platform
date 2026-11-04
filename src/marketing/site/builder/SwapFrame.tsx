'use client'

import { type CSSProperties, useState } from 'react'

/**
 * An embedded page that changes without a flash. Two frames take turns: the new page loads in
 * the hidden one (photos included, since a frame only reports "loaded" once they have arrived)
 * and swaps in when ready, so the visitor never sees a blank or half-drawn page. Once the
 * visible page has loaded, the hidden frame quietly loads each address in `warm` in turn, so a
 * later click finds the page and its photos already fetched.
 */
export const SwapFrame = ({
  src,
  warm = [],
  title,
  style,
}: {
  src: string
  warm?: string[]
  title: string
  style: CSSProperties
}) => {
  // What each frame holds, once loaded. The first frame starts on the page asked for.
  const [held, setHeld] = useState<[string | null, string | null]>([src, null])
  const [shown, setShown] = useState<0 | 1>(0)
  const [ready, setReady] = useState(false)
  const [warmed, setWarmed] = useState<string[]>([])

  // The visible frame is whichever holds the page asked for, else the one already showing.
  const visible: 0 | 1 = held[0] === src ? 0 : held[1] === src ? 1 : shown
  const hidden = visible === 0 ? 1 : 0
  const settled = held[visible] === src
  const nextWarm = ready && settled ? warm.find((a) => a !== src && !warmed.includes(a)) : undefined
  // The hidden frame loads the page asked for, or, when that is already showing, the next to warm.
  const hiddenSrc = settled ? (nextWarm ?? held[hidden]) : src

  const attribute = (index: 0 | 1) => (index === visible ? held[index] : hiddenSrc)

  const loaded = (index: 0 | 1) => {
    const address = attribute(index)
    if (!address) return
    setReady(true)
    setHeld((current) => (index === 0 ? [address, current[1]] : [current[0], address]))
    if (address === src) setShown(index)
    else setWarmed((current) => (current.includes(address) ? current : [...current, address]))
  }

  return (
    <>
      {([0, 1] as const).map((index) => {
        const address = attribute(index)
        return address ? (
          <iframe
            key={index}
            src={address}
            title={title}
            aria-hidden="true"
            tabIndex={-1}
            onLoad={() => loaded(index)}
            style={{
              ...style,
              opacity: index === visible ? 1 : 0,
              zIndex: index === visible ? 1 : 0,
            }}
          />
        ) : null
      })}
    </>
  )
}
