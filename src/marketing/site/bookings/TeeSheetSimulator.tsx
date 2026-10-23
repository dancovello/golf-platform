'use client'

import { useEffect, useState } from 'react'

import { MarketingIcon } from '../MarketingIcon'
import { BrowserChrome, MarketingButton } from '../parts'

type SlotState = 'open' | 'full' | 'members' | 'competition'
type Slot = { time: string; state: SlotState }

/** The example tee sheet (Figma 184:3437): Saturday as designed; other days vary it. */
const SATURDAY: Slot[] = [
  { time: '07:00', state: 'full' },
  { time: '07:10', state: 'full' },
  { time: '07:20', state: 'members' },
  { time: '07:30', state: 'open' },
  { time: '07:40', state: 'full' },
  { time: '07:50', state: 'open' },
  { time: '08:00', state: 'open' },
  { time: '08:10', state: 'competition' },
  { time: '08:20', state: 'open' },
  { time: '08:30', state: 'members' },
  { time: '08:40', state: 'open' },
  { time: '08:50', state: 'open' },
]

const DAYS = [
  { day: 'Thu', date: 16 },
  { day: 'Fri', date: 17 },
  { day: 'Sat', date: 18 },
  { day: 'Sun', date: 19 },
  { day: 'Mon', date: 20 },
  { day: 'Tue', date: 21 },
]

/** Another day's sheet: the same times with fewer full slots and no competition. */
const sheetFor = (dayIndex: number): Slot[] =>
  dayIndex === 2
    ? SATURDAY
    : SATURDAY.map((s, i) => ({
        time: s.time,
        state: (i + dayIndex) % 5 === 0 ? 'full' : s.state === 'members' ? 'members' : 'open',
      }))

const HOLD_SECONDS = 600
const PRICE = 65
const PLAYERS = 2

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/**
 * Marketing/Tee Sheet Simulator (184:3437): "Browsing → tap 07:50 → Held (10-minute countdown
 * ticks, slot shows Held) → Confirm → Confirmed (slot greys to Full)". A simulation of booking
 * that is coming next: nothing is booked, and the page says the prices and times are examples.
 */
export const TeeSheetSimulator = () => {
  const [day, setDay] = useState(2)
  const [holding, setHeld] = useState<string | null>(null)
  const [left, setLeft] = useState(HOLD_SECONDS)
  const [booked, setBooked] = useState<{ day: number; time: string } | null>(null)
  // A hold ends by itself when the ten minutes run out.
  const held = holding && left > 0 ? holding : null

  useEffect(() => {
    if (!held) return
    const timer = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [held])

  const slots = sheetFor(day).map((s) =>
    booked && booked.day === day && booked.time === s.time ? { ...s, state: 'full' as const } : s,
  )
  const when = (time: string, d = day) => `${DAYS[d].day} ${DAYS[d].date} Oct, ${time}`

  const hold = (time: string) => {
    setBooked(null)
    setHeld(time)
    setLeft(HOLD_SECONDS)
  }

  return (
    <div className="mk-tee-sim">
      <figure
        className="mk-demo mk-tee-sim-window"
        aria-label="Demo club: a tee sheet, coming next"
      >
        <BrowserChrome address="ashgrovepark.golf/tee-times" />
        <div className="club-theme mk-tee-sheet">
          <p className="mk-tee-title">Book a tee time</p>
          <div className="mk-tee-dates" role="radiogroup" aria-label="Day">
            {DAYS.map((d, i) => (
              <button
                key={d.date}
                type="button"
                role="radio"
                aria-checked={i === day}
                aria-label={`${d.day} ${d.date} October`}
                className="mk-tee-date"
                onClick={() => {
                  setDay(i)
                  setHeld(null)
                }}
              >
                <span className="mk-tee-date-day">{d.day}</span>
                <span className="mk-tee-date-num">{d.date}</span>
              </button>
            ))}
          </div>
          <div className="mk-tee-slots">
            {slots.map((slot) => {
              const isHeld = held === slot.time
              const state = isHeld ? 'held' : slot.state
              const label =
                state === 'held'
                  ? `Held · ${clock(left).padStart(5, '0')}`
                  : state === 'full'
                    ? 'Fully booked'
                    : state === 'members'
                      ? 'Members only'
                      : state === 'competition'
                        ? 'Monthly Medal'
                        : null
              return (
                <button
                  key={slot.time}
                  type="button"
                  className="mk-tee-slot"
                  data-state={state}
                  aria-pressed={isHeld}
                  aria-disabled={state !== 'open' && !isHeld ? true : undefined}
                  onClick={() => (slot.state === 'open' && !isHeld ? hold(slot.time) : undefined)}
                >
                  <span className="mk-tee-time">{slot.time}</span>
                  <span className="mk-tee-meta">
                    {state === 'held' ? <MarketingIcon name="clock" size={14} /> : null}
                    {state === 'members' ? <MarketingIcon name="lock" size={14} /> : null}
                    {state === 'competition' ? <MarketingIcon name="flag" size={14} /> : null}
                    {label ?? (
                      <>
                        <span className="mk-tee-price">£{PRICE}</span>
                        <span>· 4 spaces</span>
                      </>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </figure>

      <div className="mk-tee-panel">
        <p className="mk-visually-hidden" role="status">
          {held
            ? `${when(held)} held for you for ten minutes.`
            : booked
              ? `Booked: ${when(booked.time, booked.day)}.`
              : ''}
        </p>
        {held ? (
          <>
            <h3 className="mk-tee-panel-title">{when(held)}</h3>
            <p className="mk-tee-panel-sub">Championship course, {PLAYERS} players</p>
            <div className="mk-tee-countdown">
              <p className="mk-tee-count">
                <span className="mk-tee-count-num">{clock(left)}</span>
                <span>held for you</span>
              </p>
              <span className="mk-tee-progress" aria-hidden="true">
                <span style={{ width: `${(left / HOLD_SECONDS) * 100}%` }} />
              </span>
            </div>
            <dl className="mk-tee-summary">
              <div>
                <dt>Green fee × {PLAYERS}</dt>
                <dd>£{PRICE * PLAYERS}</dd>
              </div>
              <div>
                <dt>Buggy</dt>
                <dd>Not added</dd>
              </div>
              <div>
                <dt>Pay</dt>
                <dd>At the pro shop</dd>
              </div>
            </dl>
            <div className="mk-tee-actions">
              <MarketingButton
                label="Confirm booking"
                variant="primary"
                onClick={() => {
                  setBooked({ day, time: held })
                  setHeld(null)
                }}
              />
              <MarketingButton
                label="Release"
                variant="ghost"
                arrow={false}
                onClick={() => setHeld(null)}
              />
            </div>
          </>
        ) : booked ? (
          <>
            <span className="mk-tee-tick" aria-hidden="true">
              <MarketingIcon name="check" size={20} />
            </span>
            <h3 className="mk-tee-panel-title">You’re booked</h3>
            <p className="mk-tee-panel-text">
              Confirmation sent to your email. The slot is now greyed out for everyone else.
            </p>
            <dl className="mk-tee-summary">
              <div>
                <dt>When</dt>
                <dd>
                  {when(booked.time, booked.day).replace(', ', ' · ').replace(' Oct ·', ' Oct ·')}
                </dd>
              </div>
              <div>
                <dt>Course</dt>
                <dd>Championship</dd>
              </div>
              <div>
                <dt>Players</dt>
                <dd>{PLAYERS}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>AGP-4821</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <h3 className="mk-tee-panel-title">Pick a time</h3>
            <p className="mk-tee-panel-text">
              Tap any open slot. We hold it for ten minutes while you add players, so nobody else
              can take it mid-booking.
            </p>
            <ul className="mk-tee-legend">
              <li data-state="open">Open to book</li>
              <li data-state="members">Members only</li>
              <li data-state="competition">Competition</li>
              <li data-state="full">Full</li>
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
