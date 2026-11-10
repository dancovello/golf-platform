'use client'

import { errorReference } from '../error-reference'

/**
 * Something went wrong while showing a club's page, a prospect demo or a preview: plain words,
 * a way to try again and a reference. Deliberately knows nothing about the club (the problem may
 * be loading the club), and never shows the error itself. The error was already reported to
 * Sentry by the server (src/instrumentation.ts).
 */
export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = errorReference(error)
  return (
    <main style={{ padding: '96px 24px', fontFamily: 'system-ui, sans-serif', maxWidth: 560 }}>
      <h1>Something went wrong</h1>
      <p>
        This page couldn’t be shown just now. It’s a problem on our side, not yours. Please try
        again, or come back in a few minutes.
      </p>
      <p>
        <button
          type="button"
          onClick={() => retry()}
          style={{ font: 'inherit', padding: '8px 16px' }}
        >
          Try again
        </button>
      </p>
      {reference ? <p style={{ color: '#555', fontSize: 14 }}>Reference: {reference}</p> : null}
    </main>
  )
}
