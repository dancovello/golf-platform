import { resendAdapter } from '@payloadcms/email-resend'

/**
 * Email is sent through Resend (docs/architecture/decisions.md), and only when RESEND_API_KEY
 * is set. Without it nothing is sent: Payload's fallback would write whole emails, visitors'
 * details included, into the server logs, so the app sends nothing instead.
 *
 * - EMAIL_FROM_ADDRESS: the sending address on the platform's verified domain. Until a domain
 *   is verified, Resend's test address is used, which only delivers to the Resend account
 *   owner.
 * - EMAIL_OVERRIDE_TO: staging and previews set this to one address so every email goes there
 *   instead of to the test clubs.
 */
export const emailEnabled = () => Boolean(process.env.RESEND_API_KEY)

export const TEST_FROM_ADDRESS = 'onboarding@resend.dev'

export const emailAdapter = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return undefined
  return resendAdapter({
    apiKey,
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || TEST_FROM_ADDRESS,
    defaultFromName: 'Club website',
    ...(process.env.EMAIL_OVERRIDE_TO
      ? { overrideRecipientAddress: process.env.EMAIL_OVERRIDE_TO }
      : {}),
  })
}
