import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { IntroLabLoader } from '@/marketing/intro/IntroLabLoader'
import { isSignedInSuperAdmin } from '@/marketing/superAdmin'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Golf ball intro',
  robots: { index: false, follow: false },
}

/** Tuning page for the homepage golf ball intro (super-admin only). */
export default async function IntroLabPage() {
  if (!(await isSignedInSuperAdmin())) notFound()
  return (
    <main id="main">
      <IntroLabLoader />
    </main>
  )
}
