import type { CSSProperties, ReactNode } from 'react'

import { SiteFooter } from '@/site/components/SiteFooter'
import { SiteHeader } from '@/site/components/SiteHeader'
import type { ClubSite } from '@/site/loadClub'
import { brandCSSVariables } from '@/theme/colour'

import { fontSetVariables } from '../../fonts'

import '@/theme/theme.css'
import '@/site/components/header.css'
import '@/site/components/footer.css'
import './preview.css'

/** A club's page frame on staging: its colours and fonts, header, page content and footer. */
export const ClubShell = ({
  club,
  currentPath,
  children,
}: {
  club: ClubSite
  currentPath: string
  children: ReactNode
}) => {
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  const base = `/preview/${club.slug}`
  return (
    <div className="club-theme pv" style={theme}>
      <SiteHeader club={club} base={base} currentPath={currentPath} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter club={club} base={base} />
    </div>
  )
}
