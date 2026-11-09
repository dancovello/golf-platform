import React from 'react'
import './styles.css'

/**
 * A neutral tab icon for every page that has no club logo (not-found pages, the "accounts are
 * made by the administrator" page, a club with no logo yet). Built into the page as data, so
 * the browser never asks for /favicon.ico, which has nothing to serve on these addresses.
 * Club pages replace it with the club's logo (src/site/routes/views.tsx).
 */
const NEUTRAL_ICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#1f3d2b"/><circle cx="16" cy="16" r="5" fill="#f4f1e8"/></svg>',
  )

export const metadata = {
  title: 'Golf Platform',
  icons: { icon: NEUTRAL_ICON },
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      {/* Each page provides its own <main>, so a club's header can sit outside it. */}
      <body>{children}</body>
    </html>
  )
}
