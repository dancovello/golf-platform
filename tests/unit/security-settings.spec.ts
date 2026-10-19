import { describe, expect, it } from 'vitest'

import { loginCookieSettings } from '@/collections/Users'
import { isSafeURL } from '@/fields/link'

describe('links on club sites', () => {
  it('accepts the club’s own addresses, web, email and phone links', () => {
    for (const url of [
      '/',
      '/membership',
      '/news/spring-open?x=1#top',
      'https://example.com/page',
      'http://example.com',
      'mailto:office@example.com',
      'tel:+44 1234 567890',
    ]) {
      expect(isSafeURL(url), url).toBe(true)
    }
  })

  it('refuses addresses a browser would open as another website, and scripts', () => {
    for (const url of [
      '//evil.example',
      '/\\evil.example',
      ' //evil.example',
      'javascript:alert(1)',
      'data:text/html,hi',
      'evil.example',
    ]) {
      expect(isSafeURL(url), url).toBe(false)
    }
  })
})

describe('the login cookie', () => {
  it('is sent only over https on every Vercel deployment', () => {
    for (const VERCEL_ENV of ['production', 'preview', 'staging']) {
      expect(loginCookieSettings({ VERCEL_ENV }).secure).toBe(true)
    }
  })

  it('keeps working on http://localhost for development and the browser tests', () => {
    expect(loginCookieSettings({}).secure).toBe(false)
  })
})
