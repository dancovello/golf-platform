import { notFound } from 'next/navigation'

import { BRAND } from '@/brand'

// Every page view gets a fresh one-time script code (src/security/csp.ts), which only works on
// pages rendered for each visit, as club sites are.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ path?: string[] }> }

/** Placeholder home page until the marketing pages are built (plan phase 4). */
export default async function MarketingPage({ params }: Props) {
  const { path = [] } = await params
  if (path.length > 0) notFound()
  return (
    <main>
      <h1>Your club is better than your website.</h1>
      <p>
        Our website is on its way. To talk to us now, email{' '}
        <a href={`mailto:${BRAND.email}`}>{BRAND.email}</a>.
      </p>
    </main>
  )
}
