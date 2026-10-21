import type { Metadata } from 'next'
import React from 'react'

import { BRAND } from '@/brand'

/**
 * The company's marketing site (docs/marketing-site/HANDOFF.md). Its own root layout, so none
 * of the club sites' styles or fonts reach it, and none of its reach them. Pages live under
 * /marketing/… and are reached only through src/proxy.ts. Whether search engines may index a
 * page is decided there too (X-Robots-Tag).
 */
export const metadata: Metadata = {
  title: { default: BRAND.name, template: `%s | ${BRAND.name}` },
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  )
}
