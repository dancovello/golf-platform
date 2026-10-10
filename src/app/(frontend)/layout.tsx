import React from 'react'
import './styles.css'

export const metadata = {
  title: 'Golf Platform',
  robots: { index: false, follow: false },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
