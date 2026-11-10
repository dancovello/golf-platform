import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import GlobalError from '@/app/global-error'
import SiteError from '@/app/(frontend)/error'
import MarketingError from '@/app/(marketing)/marketing/error'
import { errorReference } from '@/app/error-reference'

// The branded error pages (audit fix plan, step 11): plain words, a way to try again, and a short
// reference. The error itself is never shown: it can hold a database address or a person's
// details, and the server has already reported it (src/instrumentation.ts).
const secret = new Error('connect ECONNREFUSED postgres://owner:hunter2@db.internal/neondb')
Object.assign(secret, { digest: 'abc123XYZ' })

const pages = { SiteError, MarketingError, GlobalError }

describe('error pages', () => {
  for (const [name, Page] of Object.entries(pages)) {
    it(`${name}: plain words, a Try again button and the reference, never the error`, () => {
      const html = renderToStaticMarkup(createElement(Page, { error: secret, retry: () => {} }))
      expect(html).toContain('Try again')
      expect(html).toMatch(/Something went wrong|couldn’t show that page/)
      expect(html).toContain('abc123XYZ')
      expect(html).not.toContain('hunter2')
      expect(html).not.toContain('ECONNREFUSED')
      expect(html).not.toContain('postgres://')
    })

    it(`${name}: no reference line when there isn't a usable one`, () => {
      for (const digest of [undefined, 42, '', '<script>alert(1)</script>', 'a'.repeat(41)]) {
        const error = Object.assign(new Error('x'), { digest })
        const html = renderToStaticMarkup(createElement(Page, { error, retry: () => {} }))
        expect(html).not.toContain('Reference')
        expect(html).not.toContain('<script>alert')
      }
    })
  }

  it('the global error page brings its own html and body', () => {
    const html = renderToStaticMarkup(
      createElement(GlobalError, { error: secret, retry: () => {} }),
    )
    expect(html.startsWith('<html')).toBe(true)
    expect(html).toContain('<body')
  })

  it('only short, plain references are shown', () => {
    expect(errorReference({ digest: '1234567890' })).toBe('1234567890')
    expect(errorReference({ digest: 'a b' })).toBeNull()
    expect(errorReference(null)).toBeNull()
    expect(errorReference('text')).toBeNull()
  })
})
