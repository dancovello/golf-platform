'use client'

import { BRAND } from '@/brand'

import { errorReference } from '../../error-reference'

/**
 * Something went wrong while showing a page of the company website. In the site's own look,
 * with plain words (as the "page not found" page, not-found.tsx). Never shows the error itself;
 * the server already reported it to Sentry (src/instrumentation.ts).
 */
export default function MarketingError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = errorReference(error)
  return (
    <main id="main">
      <section className="mk-section">
        <div className="mk-container">
          <header className="mk-header mk-header--page mk-header--left">
            <p className="mk-eyebrow">Something went wrong</p>
            <h1 className="mk-header-title">We couldn’t show that page.</h1>
            <p className="mk-header-body">
              It’s a problem on our side. Please try again, or email{' '}
              <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a> if it keeps happening.
              {reference ? ` Reference: ${reference}.` : ''}
            </p>
          </header>
          <p>
            <button type="button" className="mk-button mk-button--primary" onClick={() => retry()}>
              Try again
            </button>{' '}
            <a href="/">Go to the home page</a>
          </p>
        </div>
      </section>
    </main>
  )
}
