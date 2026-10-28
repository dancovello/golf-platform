import type { Metadata } from 'next'
import React from 'react'

import '@/theme/theme.css'
import '@/site/components/buttons.css'
import '@/site/components/states.css'
import '@/site/blocks/blocks.css'
import '@/site/blocks/hero.css'
import '@/site/components/header.css'
import './frame.css'

/**
 * A bare page holding one demo club block (under the club's header), for the marketing site's Block Flipper to show at a
 * real device width (Website builder, Figma 183:3059). Club blocks change layout with the
 * screen's width, so tablet and phone layouts only appear in a page that is that wide: an
 * embedded frame. Its own root layout, so neither the marketing nav nor its styles are here.
 */
export const metadata: Metadata = {
  title: 'Demo club block',
  robots: { index: false, follow: false },
}

export default function FrameLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
