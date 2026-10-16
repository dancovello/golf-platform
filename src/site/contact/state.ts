import type { ContactValues, FieldErrors } from './validate'

/** What the Contact page needs after the visitor presses Send (and before, with no attempt). */
export type SentSummary = {
  firstName: string
  replier: string
  email: string
  /** e.g. "Monday 12 October" */
  replyBy: string
  reference: string
  purposeLabel: string
  excerpt: string
  next: { label: string; href: string; external: boolean } | null
}

export type ContactState = {
  /** Goes up by one each time the form is sent, so the page knows to show the new result. */
  attempt: number
  /** The signed time check (src/site/contact/formToken.ts). */
  token: string
  values: ContactValues
  errors: FieldErrors
  /** A problem with the whole form rather than one field. */
  formError: string | null
  sent: SentSummary | null
}
