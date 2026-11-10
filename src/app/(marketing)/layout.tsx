import type { Metadata } from 'next'
import { headers } from 'next/headers'
import React from 'react'

import { BRAND } from '@/brand'
import { marketingGAId } from '@/marketing/analytics'
import { mediaUrl } from '@/marketing/branding'
import { marketingSettings } from '@/marketing/settings'
import { marketingOrigin } from '@/marketing/seo'
import { publishedMarketingSlugs } from '@/marketing/content'
import { Footer } from '@/marketing/site/chrome/Footer'
import { privacyPolicyHref } from '@/marketing/site/chrome/links'
import { Nav } from '@/marketing/site/chrome/Nav'
import { introGateScript } from '@/marketing/intro/gateScript'
import { InlineScript } from '@/site/components/InlineScript'
import { CookieConsent } from '@/site/privacy/CookieConsent'

import { silka, silkaDisplay } from './fonts'
import './marketing.css'

/**
 * The company's marketing site (docs/marketing-site/HANDOFF.md). Its own root layout, so none
 * of the club sites' styles or fonts reach it, and none of its reach them (everything is scoped
 * to the .mk body). Pages live under /marketing/… and are reached only through src/proxy.ts.
 * Whether search engines may index a page is decided there too (X-Robots-Tag).
 */
export async function generateMetadata(): Promise<Metadata> {
  const { branding, site } = await marketingSettings()
  const icon = mediaUrl(branding?.icon, 'w640')
  const shareImage = mediaUrl(site?.shareImage, 'w1600')
  return {
    // Makes every address in the page's tags (canonical, sharing) absolute.
    metadataBase: new URL(marketingOrigin()),
    title: { default: BRAND.name, template: `%s | ${BRAND.name}` },
    description: site?.description || undefined,
    icons: icon ? { icon } : undefined,
    openGraph: {
      siteName: BRAND.name,
      locale: 'en_GB',
      type: 'website',
      images: shareImage ? [shareImage] : undefined,
    },
  }
}

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  // The homepage decides whether its golf ball intro plays before anything appears
  // (src/marketing/intro/gateScript.ts). The proxy passes on the address the visitor asked for.
  const isHome = (await headers()).get('x-pathname') === '/'
  const gaID = marketingGAId()
  // The banner links to the privacy policy only once that page is published (as the footer does).
  const privacyHref = gaID ? privacyPolicyHref(await publishedMarketingSlugs()) : null
  return (
    // suppressHydrationWarning: the intro script sets data-intro on <html> before React starts.
    <html
      lang="en-GB"
      className={`${silkaDisplay.variable} ${silka.variable}`}
      suppressHydrationWarning
    >
      {isHome ? (
        <head>
          <InlineScript code={introGateScript} />
        </head>
      ) : null}
      <body className="mk">
        <a className="mk-skip" href="#main">
          Skip to content
        </a>
        <Nav />
        {children}
        <Footer />
        {/* Nothing from Google loads until the visitor accepts (same banner as the club sites). */}
        {gaID ? (
          <CookieConsent
            gaID={gaID}
            storageKey="cookie-consent:marketing"
            privacyHref={privacyHref}
          />
        ) : null}
      </body>
    </html>
  )
}
