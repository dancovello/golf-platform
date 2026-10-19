import type { CSSProperties, ReactNode } from 'react'

import { AnnouncementBar } from '@/site/components/AnnouncementBar'
import { NEW_TAB_NOTE_ID } from '@/site/components/links'
import { SiteFooter } from '@/site/components/SiteFooter'
import { SiteHeader } from '@/site/components/SiteHeader'
import type { ClubSite } from '@/site/loadClub'
import { siteBase } from '@/site/preview'
import { CookieConsent } from '@/site/privacy/CookieConsent'
import { brandCSSVariables } from '@/theme/colour'

import { fontSetVariables } from '../../fonts'

import '@/theme/theme.css'
import '@/site/components/header.css'
import '@/site/components/footer.css'
import '@/site/components/announcement.css'
import '@/site/privacy/cookieConsent.css'
import '@/site/privacy/privacy.css'
import './preview.css'
// Last: hover and pressed states for every link and button.
import '@/site/components/states.css'

/** A club's page frame on staging: its colours and fonts, header, page content and footer. */
export const ClubShell = ({
  club,
  currentPath,
  overHero = false,
  children,
}: {
  club: ClubSite
  currentPath: string
  /** The page starts with a full-bleed hero (header style B sits over it). */
  overHero?: boolean
  children: ReactNode
}) => {
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  const base = siteBase(club.slug)
  return (
    <div className="club-theme pv" style={theme}>
      {/* Read out after links that open in a new tab (NEW_TAB in src/site/components/links.ts). */}
      <span id={NEW_TAB_NOTE_ID} hidden>
        Opens in a new tab
      </span>
      {/* First on the page, before the announcement bar, so it's the first thing Tab reaches. */}
      <a className="sh-skip" href="#main">
        Skip to content
      </a>
      {club.announcement ? <AnnouncementBar data={club.announcement} base={base} /> : null}
      <SiteHeader club={club} base={base} currentPath={currentPath} overHero={overHero} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter club={club} base={base} />
      {club.privacy.gaMeasurementId ? (
        <CookieConsent
          gaID={club.privacy.gaMeasurementId}
          storageKey={`cookie-consent:${club.slug}`}
          privacyHref={`${base}/privacy`}
        />
      ) : null}
    </div>
  )
}
