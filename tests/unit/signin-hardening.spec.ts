import { describe, expect, it } from 'vitest'

import { unpooledWarning } from '@/db/poolGuard'
import { previewOrigin } from '@/site/livePreview'

// Audit fix plan, step 9: the pooled database address warning and the live preview's address.
describe('the pooled database address', () => {
  it('warns about a Neon address without -pooler', () => {
    const url = 'postgres://u:p@ep-cool-name-123456.eu-west-2.aws.neon.tech/neondb?sslmode=require'
    expect(unpooledWarning(url)).toMatch(/without "-pooler"/)
  })

  it('stays quiet for the pooled address, other databases, local work and nonsense', () => {
    expect(
      unpooledWarning('postgres://u:p@ep-cool-name-123456-pooler.eu-west-2.aws.neon.tech/neondb'),
    ).toBeNull()
    expect(unpooledWarning('postgres://u:p@db.example.com:5432/app')).toBeNull()
    expect(unpooledWarning('postgres://u:p@127.0.0.1:54329/golf_dev')).toBeNull()
    expect(unpooledWarning(undefined)).toBeNull()
    expect(unpooledWarning('not a url')).toBeNull()
  })

  it('never puts the address or password in the warning', () => {
    const warning = unpooledWarning(
      'postgres://owner:hunter2@ep-x-1.eu-west-2.aws.neon.tech/neondb',
    )
    expect(warning).not.toContain('hunter2')
    expect(warning).not.toContain('ep-x-1')
  })
})

describe('the live preview’s address', () => {
  const trusted = ['https://app.a1engine.co', 'http://localhost:3100']

  it('uses the address the admin is on when it is one of the admin’s own', () => {
    expect(previewOrigin('https://app.a1engine.co', trusted)).toBe('https://app.a1engine.co')
    expect(previewOrigin('http://localhost:3100', trusted)).toBe('http://localhost:3100')
  })

  it('gives no preview for a made-up Host header, or anything that is not an address', () => {
    expect(previewOrigin('https://evil.example', trusted)).toBeNull()
    expect(previewOrigin('https://app.a1engine.co.evil.example', trusted)).toBeNull()
    expect(previewOrigin('https://null', trusted)).toBeNull()
    expect(previewOrigin('not a url', trusted)).toBeNull()
    expect(previewOrigin('https://app.a1engine.co', [])).toBeNull()
  })
})
