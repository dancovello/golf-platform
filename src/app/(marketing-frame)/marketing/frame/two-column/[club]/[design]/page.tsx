import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import { demoContext } from '@/marketing/demo/clubs'
import {
  isSwitcherClub,
  isSwitcherDesign,
  SWITCHER_CLUBS,
  SWITCHER_FONT_SETS,
  switcherBlock,
} from '@/marketing/demo/switcher'
import { TwoColumn } from '@/site/blocks/TwoColumn'
import { brandCSSVariables } from '@/theme/colour'

import '@/site/blocks/twoColumn.css'

export const dynamic = 'force-dynamic'

/**
 * One design of the Two-Column block for the Block Switcher, drawn by the real block in one demo
 * club's colours and fonts. It's a picture of a club site: nothing in it can be focused or followed.
 */
export default async function TwoColumnFrame({
  params,
}: {
  params: Promise<{ club: string; design: string }>
}) {
  const { club: clubID, design } = await params
  if (!isSwitcherClub(clubID) || !isSwitcherDesign(design)) notFound()
  const club = SWITCHER_CLUBS.find((c) => c.id === clubID)!
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(SWITCHER_FONT_SETS[clubID][design]),
  } as CSSProperties
  return (
    <div className="club-theme frame" style={theme} inert aria-hidden="true">
      <main>
        <TwoColumn block={switcherBlock(club.id, design)} ctx={demoContext()} base="" />
      </main>
    </div>
  )
}
