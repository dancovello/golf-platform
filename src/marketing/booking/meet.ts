import { ukClock } from './availability'
import { ukToUtc } from './invite'

/**
 * Google Meet for demo bookings. Off until the Google account is connected: with the three
 * GOOGLE_* values set (see .env.example), each booking gets its own event in Dan's Google
 * Calendar with a Meet link, and Google emails the invite to the visitor. Without them, or if
 * Google can't be reached, nothing changes: the confirmation uses the fixed video link from
 * Settings → Demo calls. The secrets live in environment variables only, never in the database.
 */
export type GoogleConfig = {
  clientId: string
  clientSecret: string
  refreshToken: string
  calendarId: string
}

export const googleConfig = (
  env: Record<string, string | undefined> = process.env,
): GoogleConfig | null => {
  const clientId = env.GOOGLE_CLIENT_ID?.trim()
  const clientSecret = env.GOOGLE_CLIENT_SECRET?.trim()
  const refreshToken = env.GOOGLE_REFRESH_TOKEN?.trim()
  if (!clientId || !clientSecret || !refreshToken) return null
  return {
    clientId,
    clientSecret,
    refreshToken,
    calendarId: env.GOOGLE_CALENDAR_ID?.trim() || 'primary',
  }
}

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars'
const TIMEOUT_MS = 8000

/** A Meet link for one booked call, or null when Google isn't connected or the call failed. */
export const createMeetLink = async (
  booking: { date: string; time: string; name: string; club: string; email: string },
  minutes: number,
  {
    config = googleConfig(),
    fetcher = fetch,
  }: { config?: GoogleConfig | null; fetcher?: typeof fetch } = {},
): Promise<string | null> => {
  if (!config) return null
  try {
    const token = await fetcher(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    if (!token.ok) throw new Error(`Google sign-in answered ${token.status}`)
    const { access_token: accessToken } = (await token.json()) as { access_token?: string }
    if (!accessToken) throw new Error('Google sign-in gave no access token')

    const start = ukToUtc(booking.date, booking.time)
    const end = ukClock(new Date(start + minutes * 60_000))
    const event = await fetcher(
      `${EVENTS_URL}/${encodeURIComponent(config.calendarId)}/events?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: 'POST',
        headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          summary: `Demo: ${booking.club}`,
          description: `${booking.name}, ${booking.club}`,
          start: { dateTime: `${booking.date}T${booking.time}:00`, timeZone: 'Europe/London' },
          end: { dateTime: `${end.date}T${end.time}:00`, timeZone: 'Europe/London' },
          attendees: [{ email: booking.email }],
          conferenceData: {
            createRequest: {
              requestId: `demo-${booking.date}-${booking.time}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    )
    if (!event.ok) throw new Error(`Google Calendar answered ${event.status}`)
    const { hangoutLink } = (await event.json()) as { hangoutLink?: string }
    return hangoutLink?.startsWith('https://') ? hangoutLink : null
  } catch (error) {
    console.error('Demo booking: could not create a Google Meet link, using the fixed link', error)
    return null
  }
}
