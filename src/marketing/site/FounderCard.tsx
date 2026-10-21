import config from '@payload-config'
import { getPayload } from 'payload'

import type { MarketingMedia } from '@/payload-types'

import { MarketingButton } from './parts'

/**
 * Marketing/Founder Card (264:8707), stacked on phones (Founder Card / Stack, 272:9022). Text,
 * photo and links come from the marketing settings. Without a calendar link, "Book a call" goes
 * to the Book a demo page; without a phone number, "Call" isn't shown.
 */
export const FounderCard = async () => {
  const payload = await getPayload({ config })
  const { founder } = await payload.findGlobal({
    slug: 'marketing-settings',
    depth: 1,
    overrideAccess: true,
  })
  const name = founder?.name || 'Dan'
  const photo = typeof founder?.photo === 'object' ? (founder.photo as MarketingMedia | null) : null
  const firstName = name.split(' ')[0]
  return (
    <aside className="mk-founder" aria-label={`Who’s behind this: ${name}`}>
      <div className="mk-founder-photo">
        {photo?.url ? (
          // eslint-disable-next-line @next/next/no-img-element -- a small portrait from R2
          <img src={photo.sizes?.w640?.url ?? photo.url} alt={photo.alt} />
        ) : (
          <span aria-hidden="true">{name.charAt(0)}</span>
        )}
      </div>
      <div className="mk-founder-text">
        <p className="mk-eyebrow">Who’s behind this</p>
        <p className="mk-founder-name">{name}</p>
        {founder?.role ? <p className="mk-founder-role">{founder.role}</p> : null}
        {founder?.message ? <p className="mk-founder-promise">{founder.message}</p> : null}
        <div className="mk-founder-actions">
          <MarketingButton
            label={`Book a call with ${firstName}`}
            href={founder?.calendarLink || '/book-a-demo'}
            variant="secondary"
            arrow={false}
          />
          {founder?.phone ? (
            <MarketingButton
              label={`Call ${firstName}`}
              href={`tel:${founder.phone.replace(/[^+0-9]/g, '')}`}
              variant="ghost"
              arrow={false}
            />
          ) : null}
        </div>
      </div>
    </aside>
  )
}
