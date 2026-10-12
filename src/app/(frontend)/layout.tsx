import React from 'react'
import './styles.css'

export const metadata = {
  title: 'Golf Platform',
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
