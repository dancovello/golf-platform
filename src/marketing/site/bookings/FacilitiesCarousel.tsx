'use client'

import { type PointerEvent, useRef, useState } from 'react'

import { PillTabs } from '../controls/interactive'
import { MarketingButton } from '../parts'

export type Facility = {
  tab: string
  title: string
  body: string
  slots: [string, string][]
  button: string
  picture: string
}

/**
 * Marketing/Facilities Carousel (184:3613): "Range / Simulator / Spa, each with a booking
 * micro-demo. Swipe or tabs to change; first slot pre-selected." Coming next: nothing is booked.
 * The pictures are the demo clubs' drawings, as the photos' licences aren't confirmed.
 */
export const FacilitiesCarousel = ({ facilities }: { facilities: Facility[] }) => {
  const [index, setIndex] = useState(0)
  const [slot, setSlot] = useState(0)
  const [tabsKey, setTabsKey] = useState(0)
  const [tried, setTried] = useState(false)
  const swipe = useRef<number | null>(null)
  const facility = facilities[index]
  const show = (i: number) => {
    setIndex((i + facilities.length) % facilities.length)
    setSlot(0)
    setTried(false)
  }
  const onPointerUp = (event: PointerEvent) => {
    if (swipe.current === null) return
    const moved = event.clientX - swipe.current
    swipe.current = null
    if (Math.abs(moved) > 40) {
      show(index + (moved < 0 ? 1 : -1))
      setTabsKey((k) => k + 1)
    }
  }
  return (
    <div
      className="mk-facilities"
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') swipe.current = e.clientX
      }}
      onPointerUp={onPointerUp}
    >
      <div className="mk-facilities-media">
        {/* eslint-disable-next-line @next/next/no-img-element -- a drawing made in code */}
        <img src={facility.picture} alt="" />
      </div>
      <div className="mk-facilities-panel">
        <PillTabs
          key={tabsKey}
          label="Facility"
          tabs={facilities.map((f) => f.tab)}
          defaultIndex={index}
          onChange={show}
        />
        <h3 className="mk-facilities-title">{facility.title}</h3>
        <p className="mk-facilities-body">{facility.body}</p>
        <fieldset className="mk-facilities-slots">
          <legend>Tonight</legend>
          {facility.slots.map(([when, price], i) => (
            <label key={when} className="mk-facility-slot">
              <input
                type="radio"
                name="mk-facility-slot"
                checked={slot === i}
                onChange={() => setSlot(i)}
              />
              <span>{when}</span>
              <span className="mk-facility-price">{price}</span>
            </label>
          ))}
        </fieldset>
        <MarketingButton label={facility.button} variant="primary" onClick={() => setTried(true)} />
        <p className="mk-facilities-note" role="status">
          {tried ? 'Facility booking is coming next. This is a preview.' : ''}
        </p>
        <span className="mk-facilities-pager" aria-hidden="true">
          {facilities.map((f, i) => (
            <span key={f.tab} data-active={i === index || undefined} />
          ))}
        </span>
      </div>
    </div>
  )
}
