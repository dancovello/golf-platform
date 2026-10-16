import config from '@payload-config'
import { getPayload } from 'payload'

import { RichTextContent } from '../blocks/RichTextContent'
import { loadBlockContext } from '../blocks/resolve'
import type { ClubSite } from '../loadClub'
import { PLATFORM_NAME, POLICY_LAST_UPDATED, policyFacts } from './policy'
import { PrivacyPolicy } from './PrivacyPolicy'

/** The browser-tab title of a club's privacy policy. */
export const privacyPolicyTitle = (club: ClubSite) => `Privacy policy | ${club.name}`

/**
 * A club's privacy policy, written from its settings and features. A system page: it always
 * exists at /privacy, and isn't a CMS page a club can edit or delete.
 */
export const ClubPrivacyPolicy = async ({ club, base }: { club: ClubSite; base: string }) => {
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
    <PrivacyPolicy
      facts={facts}
      platformName={PLATFORM_NAME}
      lastUpdated={POLICY_LAST_UPDATED}
      additional={additional}
    />
  )
}
