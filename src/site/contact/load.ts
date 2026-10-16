import config from '@payload-config'
import { getPayload } from 'payload'

import { type EnquiryPurpose, isEnquiryPurpose } from '@/collections/enquiryPurposes'
import { builtInLink, isSafeURL, linksToPage } from '@/fields/link'

import { clubPageSlugs, type LabelledLink, type SiteLink } from '../loadClub'

export const DEFAULT_INTRO =
  'Choose what it’s about and it goes straight to the right person. We reply within one working day.'
export const DEFAULT_REPLIER = 'Someone from the club'

export type ContactSettings = {
  intro: string
  replyDays: number
  officeHours: string | null
  /** Who replies to each topic, and the button shown after sending. */
  routes: Partial<Record<EnquiryPurpose, { replier: string | null; next: LabelledLink | null }>>
  membershipTypes: string[]
  aside: { title: string; text: string } | null
}

type RawLink = {
  label?: string | null
  type?: string | null
  page?: unknown
  url?: string | null
  builtIn?: unknown
}
type RawContact = {
  intro?: string | null
  replyDays?: number | null
  officeHours?: string | null
  purposes?: { purpose?: string | null; replier?: string | null; nextLink?: RawLink | null }[]
  membershipTypes?: { label?: string | null }[] | null
  asideTitle?: string | null
  asideText?: string | null
}

const idOf = (v: unknown) =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String(v.id) : null

/** Club Settings → Contact page, read for the public site. Filtered by the club's own ID, and
 * linked pages are looked up again within the club (like src/site/loadClub.ts). */
export const loadContactSettings = async (tenantID: string): Promise<ContactSettings> => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'club-settings',
    where: { tenant: { equals: tenantID } },
    select: { contact: true },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const c = ((docs[0] as { contact?: RawContact } | undefined)?.contact ?? {}) as RawContact
  const text = (v: string | null | undefined) => v?.trim() || null

  const rows = c.purposes ?? []
  const slugs = await clubPageSlugs(
    payload,
    tenantID,
    rows.map((r) => (linksToPage(r.nextLink?.type) ? idOf(r.nextLink?.page) : null)),
  )
  const toLink = (raw: RawLink | null | undefined): LabelledLink | null => {
    const label = raw?.label?.trim()
    if (!raw || !label) return null
    let link: SiteLink | null = null
    if (raw.type === 'url') link = isSafeURL(raw.url) ? { kind: 'url', href: raw.url.trim() } : null
    else if (raw.type === 'builtIn') link = builtInLink(raw.builtIn)
    else {
      const slug = slugs.get(idOf(raw.page) ?? '')
      link = slug ? { kind: 'page', slug } : null
    }
    return link ? { label, link } : null
  }

  const routes: ContactSettings['routes'] = {}
  for (const row of rows) {
    if (!isEnquiryPurpose(row.purpose) || routes[row.purpose]) continue
    routes[row.purpose] = { replier: text(row.replier), next: toLink(row.nextLink) }
  }

  const asideText = text(c.asideText)
  return {
    intro: text(c.intro) ?? DEFAULT_INTRO,
    replyDays: Math.min(10, Math.max(1, Math.round(c.replyDays ?? 1))),
    officeHours: text(c.officeHours),
    routes,
    membershipTypes: (c.membershipTypes ?? []).flatMap((m) => text(m.label) ?? []),
    aside: asideText
      ? { title: text(c.asideTitle) ?? 'Tee times and lessons', text: asideText }
      : null,
  }
}
