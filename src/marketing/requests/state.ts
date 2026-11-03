import type { RequestErrors, RequestValues } from './validate'

/** What the Homepage Request Form needs after Send (and before, with no attempt). */
export type RequestState = {
  /** Goes up by one each time the form is sent, so the form knows to show the new result. */
  attempt: number
  /** The signed time check (src/site/contact/formToken.ts). */
  token: string
  values: RequestValues
  errors: RequestErrors
  /** A problem with the whole form rather than one field. */
  formError: string | null
  /** After a successful send: the address we'll write to. No date is promised. */
  sent: { email: string } | null
}
