import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import { FLIPPER_CLUB, FLIPPER_STYLES, flipperHero } from '@/marketing/demo/flipper'
import { demoClubSite, demoContext } from '@/marketing/demo/clubs'
import { Hero, heroIsFullBleed, heroShading } from '@/site/blocks/Hero'
import { SiteHeader } from '@/site/components/SiteHeader'
import { brandCSSVariables } from '@/theme/colour'

export const dynamic = 'force-dynamic'

/**
 * One hero style for the Block Flipper, drawn by the real Hero block under the real header, in
 * the demo club's colours and fonts. It's a picture of a club site: nothing in it can be focused or followed.
 */
export default async function HeroFrame({ params }: { params: Promise<{ style: string }> }) {
  const { style } = await params
  const variant = FLIPPER_STYLES.find((s) => s.id === style)
  if (!variant) notFound()
  const theme = {
    ...brandCSSVariables(FLIPPER_CLUB.brand),
    ...fontSetVariables(FLIPPER_CLUB.fontSet),
  } as CSSProperties
  const club = demoClubSite(FLIPPER_CLUB, variant.header)
  const block = flipperHero(variant.id)
  const ctx = demoContext()
  return (
    <div className="club-theme frame" style={theme} inert aria-hidden="true">
      <SiteHeader
        club={club}
        base=""
        currentPath="/"
        overHero={heroIsFullBleed(block)}
        heroShading={heroShading(block, ctx)}
      />
      <main>
        <Hero block={block} ctx={ctx} club={club} base="" />
      </main>
    </div>
  )
}
