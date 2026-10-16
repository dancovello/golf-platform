'use client'

import { useActionState, useEffect, useRef, useState } from 'react'

import {
  asksForDateAndPeople,
  ENQUIRY_PURPOSES,
  type EnquiryPurpose,
} from '@/collections/enquiryPurposes'

import { ArrowRight, Check, ChevronDown, Info } from '../components/Icons'
import type { ContactState, SentSummary } from './state'
import {
  type ContactValues,
  FIELD_ORDER,
  type FieldErrors,
  type FieldName,
  fieldError,
  fieldsFor,
  MESSAGE_MAX,
} from './validate'

type Props = {
  action: (prev: ContactState, form: FormData) => Promise<ContactState>
  initial: ContactState
  membershipTypes: string[]
  today: string
  offerNewsletter: boolean
  /** The Contact page again, for "Send another message". */
  againHref: string
}

const fieldID = (field: FieldName) => `contact-${field}`

/** An error summary link puts you in the field, not just next to it. */
const jumpTo = (id: string) => (e: React.MouseEvent) => {
  const target = document.getElementById(id)
  if (!target) return
  e.preventDefault()
  target.scrollIntoView({ block: 'center' })
  target.focus({ preventScroll: true })
}

/** Idle and Errors states, then Sent (Figma "Contact · Idle / Errors / Sent"). */
export const ContactForm = (props: Props) => {
  const [state, formAction, pending] = useActionState(props.action, props.initial)
  if (state.sent) return <Sent sent={state.sent} againHref={props.againHref} />
  // A new key after each send: React clears a form once its action finishes, so the fields
  // are drawn again from what was sent.
  return (
    <FormBody
      key={state.attempt}
      {...props}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  )
}

const FormBody = ({
  state,
  formAction,
  pending,
  membershipTypes,
  today,
  offerNewsletter,
}: Props & { state: ContactState; formAction: (form: FormData) => void; pending: boolean }) => {
  const [purpose, setPurpose] = useState<EnquiryPurpose>(state.values.purpose)
  const [messageLength, setMessageLength] = useState(state.values.message.length)
  // Checked when you leave a field that has something in it; a fixed field clears its error.
  const [checked, setChecked] = useState<FieldErrors & Partial<Record<FieldName, null>>>({})
  const summaryRef = useRef<HTMLDivElement>(null)
  // Pressing Send moves focus out of the field you're in. Checking that field then (and
  // removing its error message) would move the button up under the pointer, so the click
  // would miss it. Sending checks every field anyway.
  const pressingSend = useRef(false)

  const shown = new Set(fieldsFor(purpose))
  const errors: FieldErrors = {}
  for (const field of FIELD_ORDER) {
    if (!shown.has(field)) continue
    const message = field in checked ? checked[field] : state.errors[field]
    if (message) errors[field] = message
  }
  const listed = FIELD_ORDER.filter((f) => shown.has(f) && state.errors[f])
  const hasProblems = listed.length > 0 || Boolean(state.formError)

  useEffect(() => {
    if (state.attempt > 0 && hasProblems) summaryRef.current?.focus()
    // Only when the form comes back from the server, not while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onBlur =
    (field: FieldName) =>
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (pressingSend.current) return
      const value = e.currentTarget.value
      if (!value.trim() && !(field in checked) && !state.errors[field]) return
      const values = { ...state.values, purpose, [field]: value } as ContactValues
      setChecked((c) => ({ ...c, [field]: fieldError(field, values, { membershipTypes, today }) }))
    }

  const v = state.values
  const field = (
    name: FieldName,
    label: string,
    required: boolean,
    control: (common: Record<string, unknown>) => React.ReactNode,
  ) => {
    const error = errors[name]
    const id = fieldID(name)
    const helpID = `${id}-help`
    return (
      <div className={`cf-field${error ? ' is-error' : ''}`}>
        <div className="cf-label-row t-label-s">
          <label htmlFor={id}>{label}</label>
          <span className="cf-hint">{required ? 'Required' : 'Optional'}</span>
        </div>
        {control({
          id,
          name,
          'aria-required': required || undefined,
          'aria-invalid': error ? true : undefined,
          'aria-describedby': error || name === 'message' ? helpID : undefined,
          onBlur: onBlur(name),
        })}
        {error ? (
          <p className="cf-error t-body-s" id={helpID}>
            <Info />
            <span>{error}</span>
          </p>
        ) : name === 'message' ? (
          <p className="cf-help t-body-s" id={helpID} aria-live="polite">
            {messageLength.toLocaleString('en-GB')} / {MESSAGE_MAX.toLocaleString('en-GB')}{' '}
            characters
          </p>
        ) : null}
      </div>
    )
  }

  const input = (name: FieldName, extra: Record<string, unknown> = {}) =>
    function renderInput(common: Record<string, unknown>) {
      return (
        <input
          className="cf-input t-body-m"
          type="text"
          defaultValue={v[name]}
          {...extra}
          {...common}
        />
      )
    }

  const membership =
    membershipTypes.length > 0
      ? (common: Record<string, unknown>) => (
          <div className="cf-select">
            <select className="cf-input t-body-m" defaultValue={v.membershipType} {...common}>
              <option value="">Choose one</option>
              {membershipTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <ChevronDown size={20} />
          </div>
        )
      : input('membershipType', { maxLength: 60 })

  const isEvent = purpose === 'events'
  const problemCount = listed.length

  return (
    <form className="cf" action={formAction} noValidate>
      {hasProblems ? (
        <div className="cf-alert" role="alert" tabIndex={-1} ref={summaryRef}>
          <Info size={20} />
          <div>
            <p className="t-data-sans cf-alert-title">
              {state.formError
                ? 'Your message wasn’t sent'
                : problemCount === 1
                  ? 'There is 1 thing to fix'
                  : `There are ${problemCount} things to fix`}
            </p>
            <p className="t-body-s cf-alert-body">
              {state.formError ??
                listed.map((f, i) => (
                  <span key={f}>
                    {i > 0 ? ' · ' : null}
                    <a href={`#${fieldID(f)}`} onClick={jumpTo(fieldID(f))}>
                      {state.errors[f]}
                    </a>
                  </span>
                ))}
            </p>
          </div>
        </div>
      ) : null}

      <input type="hidden" name="token" value={state.token} />
      <div className="cf-trap" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <fieldset className="cf-topic">
        <legend className="t-label-s">What’s it about?</legend>
        <div className="cf-topics">
          {ENQUIRY_PURPOSES.map((p) => (
            <label key={p.value} className="cf-pill t-label-s">
              <input
                type="radio"
                name="purpose"
                value={p.value}
                checked={purpose === p.value}
                onChange={() => setPurpose(p.value)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="cf-row">
        {field('name', 'Full name', true, input('name', { autoComplete: 'name', maxLength: 100 }))}
        {field(
          'email',
          'Email address',
          true,
          input('email', { type: 'email', autoComplete: 'email', inputMode: 'email' }),
        )}
      </div>
      <div className="cf-row">
        {field(
          'phone',
          'Phone',
          false,
          input('phone', { type: 'tel', autoComplete: 'tel', maxLength: 20 }),
        )}
        {purpose === 'membership'
          ? field('membershipType', 'Membership type', true, membership)
          : null}
        {asksForDateAndPeople(purpose)
          ? field(
              'preferredDate',
              isEvent ? 'Event date' : 'Date you’d like to play',
              false,
              input('preferredDate', { type: 'date', min: today }),
            )
          : null}
      </div>
      {asksForDateAndPeople(purpose) ? (
        <div className="cf-row">
          {field(
            'groupSize',
            isEvent ? 'Number of guests' : 'Number of players',
            false,
            input('groupSize', { inputMode: 'numeric', maxLength: 3 }),
          )}
          <div aria-hidden="true" />
        </div>
      ) : null}
      {field('message', 'Your message', true, (common) => (
        <textarea
          className="cf-input cf-textarea t-body-m"
          rows={5}
          maxLength={MESSAGE_MAX}
          defaultValue={v.message}
          onChange={(e) => setMessageLength(e.currentTarget.value.length)}
          {...common}
        />
      ))}

      {offerNewsletter ? (
        <label className="cf-consent t-body-s">
          <input type="checkbox" name="newsletter" value="yes" defaultChecked={v.newsletter} />
          <span>Send me the club newsletter too. You can unsubscribe at any time.</span>
        </label>
      ) : null}

      <div className="cf-submit">
        <button
          className="btn btn-accent t-label-button"
          type="submit"
          disabled={pending}
          onPointerDown={() => {
            pressingSend.current = true
          }}
          onClick={() => {
            pressingSend.current = false
          }}
        >
          {pending ? 'Sending…' : 'Send message'}
          <ArrowRight />
        </button>
        <p className="t-label-s cf-note">Protected by a spam check. We never share your details.</p>
      </div>
    </form>
  )
}

const Sent = ({ sent, againHref }: { sent: SentSummary; againHref: string }) => {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <div className="cf-sent" role="status">
      <span className="cf-sent-check">
        <Check size={26} />
      </span>
      <h2 className="t-heading-m" tabIndex={-1} ref={headingRef}>
        {sent.firstName
          ? `Thanks, ${sent.firstName} — your message is with us`
          : 'Thanks — your message is with us'}
      </h2>
      <p className="t-body-m cf-sent-body">
        {sent.replier} will reply to {sent.email} by {sent.replyBy}. Your reference is{' '}
        {sent.reference}.
      </p>
      <div className="cf-sent-summary t-body-s">
        <p>About: {sent.purposeLabel}</p>
        <p className="cf-sent-excerpt">“{sent.excerpt}”</p>
      </div>
      <div className="cf-sent-actions">
        {sent.next ? (
          <a
            className="btn btn-solid t-label-button"
            href={sent.next.href}
            {...(sent.next.external ? { rel: 'noopener' } : {})}
          >
            {sent.next.label}
            <ArrowRight />
          </a>
        ) : null}
        <a className="btn btn-link t-label-button" href={againHref}>
          Send another message
        </a>
      </div>
    </div>
  )
}
