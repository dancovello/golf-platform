import { describe, expect, it } from 'vitest'

import { overrideRecipient } from '@/email/adapter'

describe('overrideRecipient', () => {
  it('sends everything to one inbox on staging and previews', () => {
    expect(overrideRecipient({ VERCEL_ENV: 'preview', EMAIL_OVERRIDE_TO: 'dan@example.com' })).toBe(
      'dan@example.com',
    )
    expect(overrideRecipient({ EMAIL_OVERRIDE_TO: 'dan@example.com' })).toBe('dan@example.com')
  })

  it('is ignored on production', () => {
    expect(
      overrideRecipient({ VERCEL_ENV: 'production', EMAIL_OVERRIDE_TO: 'dan@example.com' }),
    ).toBeUndefined()
  })

  it('is off when unset or empty', () => {
    expect(overrideRecipient({ VERCEL_ENV: 'preview' })).toBeUndefined()
    expect(overrideRecipient({ EMAIL_OVERRIDE_TO: '' })).toBeUndefined()
  })
})
