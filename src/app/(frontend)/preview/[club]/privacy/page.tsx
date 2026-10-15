import config from '@payload-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'

import { RichTextContent } from '@/site/blocks/RichTextContent'
import { loadBlockContext } from '@/site/blocks/resolve'
import { loadClubBySlug } from '@/site/loadClub'
import { sitePreviewEnabled } from '@/site/preview'
import { PLATFORM_NAME, POLICY_LAST_UPDATED, policyFacts } from '@/site/privacy/policy'
import { PrivacyPolicy } from '@/site/privacy/PrivacyPolicy'

import { ClubShell } from '../ClubShell'

import '@/site/privacy/privacy.css'

export const dynamic = 'force-dynamic'

// Search engines stay away while clubs live at /preview on staging (root layout). The brief's
// "index, follow" switches on with real domains in build step 4.
export const generateMetadata = async ({
  params,
}: {
  params: Promise<{ club: string }>
}): Promise<Metadata> => {
  if (!sitePreviewEnabled()) return {}
  const club = await loadClubBySlug((await params).club)
  return club ? { title: `Privacy policy | ${club.name}` } : {}
}

/**
 * Every club's privacy policy, written from its settings and features. A system page: it
 * always exists, and isn't a CMS page a club can edit or delete. A club page with the
 * address "privacy" can't replace it, because this route is matched first.
 */
export default async function ClubPrivacyPolicy({ params }: { params: Promise<{ club: string }> }) {
  if (!sitePreviewEnabled()) notFound()
  const club = await loadClubBySlug((await params).club)
  if (!club) notFound()
  const base = `/preview/${club.slug}`

  const facts = policyFacts({
    name: club.name,
    phone: club.header.phone,
    email: club.footer.email,
    address: club.footer.address,
    privacy: club.privacy,
  })

  let additional = null
  if (facts.additionalInfo !== null) {
    // Links in the club's text are checked against its own pages, like any page's text.
    const payload = await getPayload({ config })
    const ctx = await loadBlockContext(payload, club.tenantID, [
      { blockType: 'richText', content: facts.additionalInfo },
    ])
    additional = <RichTextContent value={facts.additionalInfo} ctx={ctx} base={base} />
  }

  return (
    <ClubShell club={club} currentPath={`${base}/privacy`}>
      <PrivacyPolicy
        facts={facts}
        platformName={PLATFORM_NAME}
        lastUpdated={POLICY_LAST_UPDATED}
        additional={additional}
      />
    </ClubShell>
  )
}
