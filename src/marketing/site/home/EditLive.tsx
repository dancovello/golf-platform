import type { CSSProperties } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import type { MarketingEditLiveBlock } from '@/payload-types'
import { brandCSSVariables } from '@/theme/colour'

import { DEMO_CLUBS, demoClubSite, demoPicture } from '../../demo/clubs'
import { EditLiveClient } from './EditLiveClient'

import '@/theme/theme.css'
import '@/site/components/buttons.css'
import '@/site/blocks/blocks.css'
import '@/site/blocks/hero.css'

/**
 * Marketing/Edit Live Split (180:2587): the editor card beside the live site, with the same
 * text in both. Visitors can type in the headline and flip the switch; the real Hero block
 * beside it follows. Nothing is saved anywhere.
 */
export const EditLive = ({ block }: { block: MarketingEditLiveBlock }) => {
  const club = DEMO_CLUBS[0]
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  return (
    <EditLiveClient
      hero={{ ...club.hero, headline: block.headline }}
      picture={demoPicture(String(club.hero.image))!}
      club={demoClubSite(club)}
      domain={club.domain}
      theme={theme}
      toggleLabel={block.toggleLabel}
    />
  )
}
