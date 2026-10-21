'use client'

import { type KeyboardEvent, useMemo, useRef, useState } from 'react'

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
 * `book` makes the booking; until a calendar is connected (open question Q4) the component is
 * only shown on the review page, with sample times, and the live page offers email instead.
 */
export const DemoBooking = ({
  open,
  book,
}: {
  open: OpenDay[]
  book: (details: BookingDetails, date: string, time: string) => Promise<boolean>
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
    setBusy(true)
    setProblem(null)
    const ok = await book(details, day, time).catch(() => false)
    setBusy(false)
    if (!ok) {
      setProblem('That time has just gone. Please pick another.')
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

  const current = STEPS.findIndex((s) => s.id === step)
  const firstName = details.name.trim().split(/\s+/)[0] ?? ''

  return (
    <div className="mk-booking">
      <ol className="mk-booking-steps">
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
        </div>
      ) : null}
    </div>
  )
}
