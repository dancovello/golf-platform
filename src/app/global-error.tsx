'use client'

import { errorReference } from './error-reference'

/**
 * The last resort: something broke so badly that a page's own layout couldn't be drawn (it
 * replaces the whole page, so it brings its own html and body, and uses no site styles). Plain
 * words and a way to try again; never the error itself.
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const reference = errorReference(error)
  return (
    <html lang="en-GB">
      <body style={{ margin: 0, padding: '96px 24px', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: 560 }}>
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
      </body>
    </html>
  )
}
