/**
 * What the Demo Booking sends along with a booking to show it came from a person (the same
 * spam checks as the Homepage Request Form, src/marketing/requests/submit.ts). Kept free of
 * server code so the form on the page can use the type.
 *
 * - `token`: the page's signed "shown at" time (src/site/contact/formToken.ts). A booking within
 *   seconds of the page appearing is a robot.
 * - `website`: a hidden box only robots fill in.
 * - `turnstile`: Cloudflare's "are you a person?" answer, when it's switched on.
 */
export type BookingProof = { token: string; website: string; turnstile: string }

/** The signed time check is scoped to this form, so another form's token won't do. */
export const BOOKING_FORM_SCOPE = 'marketing-demo-booking'

/** Cloudflare's check is made for this form only. */
export const BOOKING_TURNSTILE_ACTION = 'booking'
