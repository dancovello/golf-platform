import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import { FLIPPER_CLUB, FLIPPER_STYLES, flipperHero } from '@/marketing/demo/flipper'
import { demoClubSite, demoContext } from '@/marketing/demo/clubs'
import { Hero } from '@/site/blocks/Hero'
import { brandCSSVariables } from '@/theme/colour'

export const dynamic = 'force-dynamic'

/**
 * One hero style for the Block Flipper, drawn by the real Hero block in the demo club's colours
 * and fonts. It's a picture of a club site: nothing in it can be focused or followed.
 */
export default async function HeroFrame({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params
  const variant = FLIPPER_STYLES.find((s) => s.id === style)
  if (!variant) notFound()
  const theme = {
    ...brandCSSVariables(FLIPPER_CLUB.brand),
    ...fontSetVariables(FLIPPER_CLUB.fontSet),
  } as CSSProperties
  return (
    <main className="club-theme" style={theme} inert aria-hidden="true">
      <Hero
        block={flipperHero(variant.id)}
        ctx={demoContext()}
        club={demoClubSite(FLIPPER_CLUB)}
        base=""
      />
    </main>
  )
}
