'use client'

import { useActionState, useEffect, useRef } from 'react'

import type { RequestState } from '@/marketing/requests/state'
import type { RequestErrors, RequestValues } from '@/marketing/requests/validate'
import { TurnstileCheck } from '@/site/contact/TurnstileCheck'

import { Field } from '../controls/controls'
import { MarketingIcon } from '../MarketingIcon'
import { MarketingButton } from '../parts'

export type RequestFormCopy = {
  title: string
  intro?: string | null
  button: string
  footnote?: string | null
  sentTitle: string
}

type Props = {
  copy: RequestFormCopy
  action: (prev: RequestState, form: FormData) => Promise<RequestState>
  initial: RequestState
  /** Cloudflare's spam check, when it's switched on (src/site/contact/turnstile.ts). */
  turnstileSiteKey: string | null
}

const FORM_ID = 'mk-request-form'
const ORDER: (keyof RequestValues)[] = ['clubName', 'website', 'email']
const fieldID = (field: keyof RequestValues) => `mk-request-${field}`

/**
 * Marketing/Homepage Request Form (265:8785): Default, then Submitted (no date promised).
 * Works without JavaScript too (the form posts and the page comes back with the result).
 */
export const RequestForm = ({ copy, action, initial, turnstileSiteKey }: Props) => {
  const [state, formAction, pending] = useActionState(action, initial)
  return (
    <div className="mk-request" aria-busy={pending || undefined}>
      {state.sent ? (
        <Sent title={copy.sentTitle} email={state.sent.email} />
      ) : (
        // A new key after each send: React clears a form once its action finishes, so the
        // fields are drawn again from what was sent.
        <RequestFields
          key={state.attempt}
          copy={copy}
          state={state}
          formAction={formAction}
          pending={pending}
        />
      )}
      {/* Outside the redrawn form, so its answer survives "things to fix". */}
      {turnstileSiteKey && !state.sent ? (
        <TurnstileCheck
          siteKey={turnstileSiteKey}
          action="homepage"
          formID={FORM_ID}
          restartKey={state.formError ? state.attempt : null}
        />
      ) : null}
    </div>
  )
}

const RequestFields = ({
  copy,
  state,
  formAction,
  pending,
}: {
  copy: RequestFormCopy
  state: RequestState
  formAction: (form: FormData) => void
  pending: boolean
}) => {
  const alertRef = useRef<HTMLDivElement>(null)
  const listed = ORDER.filter((f) => state.errors[f])
  const hasProblems = listed.length > 0 || Boolean(state.formError)

  useEffect(() => {
    // Only when the form comes back from the server with something to fix.
    if (state.attempt > 0 && hasProblems) alertRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const error = (field: keyof RequestErrors) => state.errors[field] ?? null

  return (
    <form id={FORM_ID} className="mk-request-form" action={formAction} noValidate>
      <h2 className="mk-request-title">{copy.title}</h2>
      {copy.intro ? <p className="mk-request-intro">{copy.intro}</p> : null}
      {hasProblems ? (
        <div className="mk-request-alert" role="alert" tabIndex={-1} ref={alertRef}>
          {state.formError ??
            (listed.length === 1
              ? 'There is 1 thing to fix.'
              : `There are ${listed.length} things to fix.`)}
        </div>
      ) : null}
      <input type="hidden" name="token" value={state.token} />
      <div className="mk-request-trap" aria-hidden="true">
        <label>
          Leave this empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <Field
        id={fieldID('clubName')}
        name="clubName"
        label="Club name"
        autoComplete="organization"
        maxLength={120}
        required
        defaultValue={state.values.clubName}
        placeholder="Ashgrove Park Golf Club"
        error={error('clubName')}
      />
      <Field
        id={fieldID('website')}
        name="currentSite"
        label="Current website"
        type="text"
        inputMode="url"
        autoComplete="url"
        autoCapitalize="none"
        spellCheck={false}
        maxLength={300}
        required
        defaultValue={state.values.website}
        placeholder="yourclub.co.uk"
        error={error('website')}
      />
      <Field
        id={fieldID('email')}
        name="email"
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        maxLength={254}
        required
        defaultValue={state.values.email}
        placeholder="you@yourclub.co.uk"
        error={error('email')}
      />
      <MarketingButton
        label={pending ? 'Sending…' : copy.button}
        type="submit"
        variant="primary"
        arrow={false}
        disabled={pending}
      />
      {copy.footnote ? <p className="mk-request-footnote">{copy.footnote}</p> : null}
    </form>
  )
}

const Sent = ({ title, email }: { title: string; email: string }) => {
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  return (
    <div className="mk-request-sent" role="status">
      <span className="mk-request-tile" aria-hidden="true">
        <MarketingIcon name="check" size={20} />
      </span>
      <h2 className="mk-request-title" tabIndex={-1} ref={headingRef}>
        {title}
      </h2>
      <p className="mk-request-sent-body">
        We’ll be in touch. We’ll email <strong>{email}</strong> to arrange your demo.
      </p>
    </div>
  )
}
