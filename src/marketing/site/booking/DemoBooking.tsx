'use client'

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

import type { BookingProof } from '@/marketing/booking/proof'
import { TurnstileCheck } from '@/site/contact/TurnstileCheck'

import {
  addDays,
  bookableDays,
  longDay,
  monthGrid,
  monthLabel,
  type OpenDay,
  shortDay,
  weekdayName,
} from '@/marketing/booking/calendar'

import { BRAND } from '@/brand'
import { demoInvite } from '@/marketing/booking/invite'

import { Field } from '../controls/controls'
import { MarketingIcon } from '../MarketingIcon'
import { MarketingButton } from '../parts'

export type BookingDetails = { name: string; role: string; club: string; email: string }

type Step = 'details' | 'time' | 'booked'

const STEPS: { id: Step; label: string }[] = [
  { id: 'details', label: 'Your details' },
  { id: 'time', label: 'Pick a time' },
  { id: 'booked', label: 'Booked' },
]

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

/**
 * Marketing/Demo Booking (187:6498): Details → Pick a time → Booked. Only weekdays with free
 * times can be picked. Keyboard: arrow keys move through the days, Enter or Space picks one
 * (Figma: "arrow keys move through days, Enter selects"). The times are radios.
 *
 * `book` makes the booking and returns true, or a sentence to show (the server action in
 * src/marketing/booking/actions.ts). The review page shows it with sample times and a pretend
 * booking.
 */
export const DemoBooking = ({
  open,
  book,
  token = '',
  turnstileSiteKey = null,
  minutes = 30,
  rescheduleHref,
}: {
  open: OpenDay[]
  book: (
    details: BookingDetails,
    date: string,
    time: string,
    proof: BookingProof,
  ) => Promise<boolean | string>
  /** The page's signed "shown at" time (src/marketing/booking/proof.ts). */
  token?: string
  /** Cloudflare's spam check, when it's switched on (src/site/contact/turnstile.ts). */
  turnstileSiteKey?: string | null
  /** How long the call lasts, for the calendar file. */
  minutes?: number
  /** Where "Reschedule" goes: an email to the inbox, so a booking is only ever moved by us. */
  rescheduleHref?: string
}) => {
  const days = useMemo(() => bookableDays(open), [open])
  const first = [...days.keys()].sort()[0] ?? null
  const [step, setStep] = useState<Step>('details')
  const [details, setDetails] = useState<BookingDetails>({
    name: '',
    role: '',
    club: '',
    email: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof BookingDetails, string>>>({})
  const [day, setDay] = useState<string | null>(first)
  const [time, setTime] = useState<string | null>(null)
  const [month, setMonth] = useState(() => {
    const [y, m] = (first ?? new Date().toISOString().slice(0, 10)).split('-').map(Number)
    return { year: y, month: m }
  })
  const [problem, setProblem] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // The hidden box only robots fill in, and Cloudflare's answer (each works once).
  const [trap, setTrap] = useState('')
  const [turnstile, setTurnstile] = useState('')
  const [refusals, setRefusals] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const gridRef = useRef<HTMLTableElement>(null)

  const focusHeading = () => requestAnimationFrame(() => headingRef.current?.focus())

  const next = (e: React.FormEvent) => {
    e.preventDefault()
    const found: typeof errors = {}
    if (!details.name.trim()) found.name = 'Enter your name.'
    if (!details.club.trim()) found.club = 'Enter your club’s name.'
    if (!/^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(details.email.trim()))
      found.email = 'Enter an email address, like you@yourclub.co.uk.'
    setErrors(found)
    if (Object.keys(found).length) return
    setStep('time')
    focusHeading()
  }

  const confirm = async () => {
    if (!day || !time) return
    if (turnstileSiteKey && !turnstile) {
      setProblem('One moment, we’re checking you’re a person. Please press Confirm again.')
      return
    }
    setBusy(true)
    setProblem(null)
    const result = await book(details, day, time, { token, website: trap, turnstile }).catch(
      () => false,
    )
    setBusy(false)
    if (result !== true) {
      // An answer from Cloudflare works once: ask for a new one before the next try.
      setRefusals((n) => n + 1)
      setProblem(
        typeof result === 'string' ? result : 'That time has just gone. Please pick another.',
      )
      return
    }
    setStep('booked')
    focusHeading()
  }

  const moveMonth = (by: number) => {
    const m = month.month + by
    setMonth({ year: month.year + Math.floor((m - 1) / 12), month: ((m - 1 + 12) % 12) + 1 })
  }

  /** Arrow keys move between days; the focus follows into the next month if needed. */
  const onDayKey = (iso: string) => (e: KeyboardEvent<HTMLButtonElement>) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (!step) return
    e.preventDefault()
    const target = addDays(iso, step)
    const [y, m] = target.split('-').map(Number)
    if (y !== month.year || m !== month.month) setMonth({ year: y, month: m })
    requestAnimationFrame(() =>
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${target}"]`)?.focus(),
    )
  }

  const addToCalendar = () => {
    if (!day || !time) return
    const file = demoInvite({
      date: day,
      time,
      minutes,
      summary: `${BRAND.name} demo call`,
      description: `Your demo call with ${BRAND.name}, on video. Times are UK time.`,
      now: new Date(),
    })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([file], { type: 'text/calendar;charset=utf-8' }))
    link.download = 'demo-call.ics'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const current = STEPS.findIndex((s) => s.id === step)
  const stepsRef = useRef<HTMLOListElement>(null)

  // On a phone the tracker scrolls sideways: keep the step the visitor is on in the middle.
  useEffect(() => {
    const list = stepsRef.current
    const item = list?.children[current] as HTMLElement | undefined
    if (!list || !item) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({
      left: item.offsetLeft - (list.clientWidth - item.offsetWidth) / 2,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [current])
  const firstName = details.name.trim().split(/\s+/)[0] ?? ''

  return (
    <div className="mk-booking">
      {/* Starts as soon as the page is open, so the answer is ready by the time they confirm. */}
      {turnstileSiteKey && step !== 'booked' ? (
        <TurnstileCheck
          siteKey={turnstileSiteKey}
          action="booking"
          formID="mk-booking-check"
          restartKey={refusals > 0 ? refusals : null}
          onToken={setTurnstile}
        />
      ) : null}
      <ol className="mk-booking-steps" ref={stepsRef}>
        {STEPS.map((s, i) => (
          <li
            key={s.id}
            data-state={i < current ? 'done' : i === current ? 'current' : 'next'}
            aria-current={i === current ? 'step' : undefined}
          >
            <span className="mk-booking-dot" aria-hidden="true" />
            {s.label}
          </li>
        ))}
      </ol>

      {step === 'details' ? (
        <form className="mk-booking-body" onSubmit={next} noValidate>
          <h2 className="mk-booking-title" tabIndex={-1} ref={headingRef}>
            Tell us about your club
          </h2>
          <div className="mk-booking-row">
            <Field
              id="mk-booking-name"
              label="Your name"
              autoComplete="name"
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
              error={errors.name}
            />
            <Field
              id="mk-booking-role"
              label="Your role (optional)"
              autoComplete="organization-title"
              value={details.role}
              onChange={(e) => setDetails({ ...details, role: e.target.value })}
            />
          </div>
          <Field
            id="mk-booking-club"
            label="Club name"
            autoComplete="organization"
            value={details.club}
            onChange={(e) => setDetails({ ...details, club: e.target.value })}
            error={errors.club}
          />
          <Field
            id="mk-booking-email"
            label="Email"
            type="email"
            autoComplete="email"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            error={errors.email}
          />
          <div className="mk-request-trap" aria-hidden="true">
            <label>
              Leave this empty
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
              />
            </label>
          </div>
          <span className="mk-booking-wide">
            <MarketingButton label="Next: pick a time" type="submit" variant="primary" />
          </span>
        </form>
      ) : null}

      {step === 'time' ? (
        <div className="mk-booking-body">
          <div className="mk-booking-month">
            <h2
              className="mk-booking-month-label"
              tabIndex={-1}
              ref={headingRef}
              aria-live="polite"
            >
              {monthLabel(month.year, month.month)}
            </h2>
            <div className="mk-booking-arrows">
              <button type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}>
                <MarketingIcon name="chevron-left" size={16} />
              </button>
              <button type="button" aria-label="Next month" onClick={() => moveMonth(1)}>
                <MarketingIcon name="chevron-right" size={16} />
              </button>
            </div>
          </div>
          <table className="mk-booking-grid" ref={gridRef} aria-label="Days you can book">
            <thead>
              <tr>
                {WEEKDAYS.map((d, i) => (
                  <th key={d} scope="col" abbr={WEEKDAY_NAMES[i]}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthGrid(month.year, month.month).map((week, w) => (
                <tr key={w}>
                  {week.map((iso, i) => {
                    if (!iso) return <td key={i} />
                    const free = days.has(iso)
                    const chosen = iso === day
                    const label = `${longDay(iso)}${free ? '' : ', no times free'}`
                    return (
                      <td key={iso}>
                        <button
                          type="button"
                          data-date={iso}
                          className="mk-booking-day"
                          data-state={chosen ? 'chosen' : free ? 'open' : 'closed'}
                          aria-label={label}
                          aria-pressed={chosen}
                          aria-disabled={!free || undefined}
                          tabIndex={chosen || (!day && iso === first) ? 0 : -1}
                          onKeyDown={onDayKey(iso)}
                          onClick={() => {
                            if (!free) return
                            setDay(iso)
                            setTime(null)
                          }}
                        >
                          {Number(iso.slice(8))}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {day ? (
            <fieldset className="mk-booking-times">
              <legend>{longDay(day)}, UK time</legend>
              <div className="mk-slots">
                {(days.get(day) ?? []).map((t) => (
                  <label key={t} className="mk-slot">
                    <input
                      type="radio"
                      name="mk-booking-time"
                      value={t}
                      checked={time === t}
                      onChange={() => setTime(t)}
                    />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
          {problem ? (
            <p className="mk-field-error" role="alert">
              {problem}
            </p>
          ) : null}
          <span className="mk-booking-wide">
            <MarketingButton
              label={day && time ? `Confirm ${shortDay(day)}, ${time}` : 'Pick a day and a time'}
              variant="primary"
              disabled={!day || !time || busy}
              type="button"
              onClick={confirm}
            />
          </span>
        </div>
      ) : null}

      {step === 'booked' && day && time ? (
        <div className="mk-booking-body" role="status">
          <span className="mk-booking-tick" aria-hidden="true">
            <MarketingIcon name="check" size={22} />
          </span>
          <h2 className="mk-booking-title" tabIndex={-1} ref={headingRef}>
            See you {weekdayName(day)}
            {firstName ? `, ${firstName}` : ''}
          </h2>
          <p className="mk-booking-text">
            {longDay(day).replace(/^\w+ /, `${shortDay(day).split(' ')[0]} `)} at {time}, on video.
            The invite is in your inbox. Bring anyone from the committee.
          </p>
          <div className="mk-booking-actions">
            <MarketingButton
              label="Add to calendar"
              variant="secondary"
              arrow={false}
              onClick={addToCalendar}
            />
            {rescheduleHref ? (
              <MarketingButton
                label="Reschedule"
                variant="ghost"
                arrow={false}
                href={rescheduleHref}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
