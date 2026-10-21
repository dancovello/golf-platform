import type { CSSProperties, ReactNode } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import { brandCSSVariables } from '@/theme/colour'

import { BrowserChrome } from '../site/parts'
import type { DemoClub } from './clubs'
import { DemoScaler } from './DemoScaler'

// The club template's own styles, for the real blocks inside the frame. They're scoped to
// .club-theme, so they don't touch the marketing page around it.
import './clubStyles.css'

/**
 * Marketing/Browser Chrome plus a real club block scaled inside it (Figma CMS block rules: "Never
 * a screenshot of a block"). The demo club's colours and fonts are set on the frame, so they stay
 * inside it. The block is a picture of a club site, not part of this page: it's inert (no
 * keyboard stops, no links) and hidden from screen readers, which hear the frame's label instead.
 */
export const DemoFrame = ({
  club,
  label,
  height,
  children,
}: {
  club: DemoClub
  /** What the demo shows, read out instead of the block, e.g. "Ashgrove Park's home page". */
  label: string
  height?: number
  children: ReactNode
}) => {
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  return (
    <figure className="mk-demo" aria-label={`Demo club: ${label}`} data-club={club.id}>
      <BrowserChrome address={club.domain} />
      <DemoScaler height={height}>
        <div className="club-theme mk-demo-club" style={theme} inert aria-hidden="true">
          {children}
        </div>
      </DemoScaler>
    </figure>
  )
}
