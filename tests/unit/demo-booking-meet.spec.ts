import { describe, expect, it, vi } from 'vitest'

import { createMeetLink, googleConfig } from '@/marketing/booking/meet'

const booking = {
  date: '2026-07-14',
  time: '14:00',
  name: 'Rhian Jones',
  club: 'Test Golf Club',
  email: 'rhian@example.com',
}
const config = {
  clientId: 'id',
  clientSecret: 'secret',
  refreshToken: 'refresh',
  calendarId: 'primary',
}

const reply = (body: unknown, ok = true, status = 200) =>
  ({ ok, status, json: async () => body }) as Response

describe('Google Meet for demo bookings', () => {
  it('is off unless all three Google values are set', () => {
    expect(googleConfig({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b' })).toBeNull()
    expect(
      googleConfig({ GOOGLE_CLIENT_ID: 'a', GOOGLE_CLIENT_SECRET: 'b', GOOGLE_REFRESH_TOKEN: 'c' })
        ?.calendarId,
    ).toBe('primary')
  })

  it('does nothing, and calls nobody, when Google is not connected', async () => {
    const fetcher = vi.fn()
    expect(await createMeetLink(booking, 30, { config: null, fetcher })).toBeNull()
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('asks Google for a Meet event at the UK time and returns its link', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply({ access_token: 'token' }))
      .mockResolvedValueOnce(reply({ hangoutLink: 'https://meet.google.com/abc-defg-hij' }))
    const link = await createMeetLink(booking, 30, { config, fetcher })
    expect(link).toBe('https://meet.google.com/abc-defg-hij')
    const [url, init] = fetcher.mock.calls[1] as [string, RequestInit]
    expect(url).toContain('/calendars/primary/events?conferenceDataVersion=1')
    const sent = JSON.parse(String(init.body))
    expect(sent.start).toEqual({ dateTime: '2026-07-14T14:00:00', timeZone: 'Europe/London' })
    expect(sent.end).toEqual({ dateTime: '2026-07-14T14:30:00', timeZone: 'Europe/London' })
    expect(sent.attendees).toEqual([{ email: 'rhian@example.com' }])
    expect(sent.conferenceData.createRequest.conferenceSolutionKey.type).toBe('hangoutsMeet')
  })

  it('looks again when Google has not made the Meet room yet', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(reply({ access_token: 'token' }))
      .mockResolvedValueOnce(reply({ id: 'evt1' }))
      .mockResolvedValueOnce(reply({ id: 'evt1', hangoutLink: 'https://meet.google.com/xyz' }))
    const wait = vi.fn().mockResolvedValue(undefined)
    expect(await createMeetLink(booking, 30, { config, fetcher, wait })).toBe(
      'https://meet.google.com/xyz',
    )
    expect(fetcher.mock.calls[2]?.[0]).toContain('/events/evt1')
    expect(wait).toHaveBeenCalledTimes(1)
  })

  it('falls back to nothing when Google refuses or answers oddly', async () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    const refused = vi.fn().mockResolvedValueOnce(reply({}, false, 401))
    expect(await createMeetLink(booking, 30, { config, fetcher: refused })).toBeNull()
    const noLink = vi
      .fn()
      .mockResolvedValueOnce(reply({ access_token: 'token' }))
      .mockResolvedValueOnce(reply({ hangoutLink: 'http://not-secure.example' }))
    expect(await createMeetLink(booking, 30, { config, fetcher: noLink })).toBeNull()
    quiet.mockRestore()
  })
})
