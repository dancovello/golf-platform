import type { Metadata } from 'next'
import React from 'react'

import { BRAND } from '@/brand'
import { marketingOrigin } from '@/marketing/seo'
import { Footer } from '@/marketing/site/chrome/Footer'
import { Nav } from '@/marketing/site/chrome/Nav'

import { hankenGrotesk, newsreader } from './fonts'
import './marketing.css'

/**
 * The company's marketing site (docs/marketing-site/HANDOFF.md). Its own root layout, so none
 * of the club sites' styles or fonts reach it, and none of its reach them (everything is scoped
 * to the .mk body). Pages live under /marketing/… and are reached only through src/proxy.ts.
 * Whether search engines may index a page is decided there too (X-Robots-Tag).
 */
export const metadata: Metadata = {
  // Makes every address in the page's tags (canonical, sharing) absolute.
  metadataBase: new URL(marketingOrigin()),
  title: { default: BRAND.name, template: `%s | ${BRAND.name}` },
  openGraph: { siteName: BRAND.name, locale: 'en_GB', type: 'website' },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${newsreader.variable} ${hankenGrotesk.variable}`}>
      <body className="mk">
        <a className="mk-skip" href="#main">
          Skip to content
        </a>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  )
}
