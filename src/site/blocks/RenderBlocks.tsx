import type { Page } from '@/payload-types'

import type { ClubSite } from '../loadClub'
import { CtaCardGrid } from './CtaCardGrid'
import { Hero } from './Hero'
import type { BlockContext } from './resolve'

import './blocks.css'
import './hero.css'
import './ctaCardGrid.css'
import '../components/buttons.css'

type LayoutBlock = NonNullable<Page['layout']>[number]

/** Draws a page's blocks in order. Unknown block types are skipped. */
export const RenderBlocks = ({
  layout,
  ctx,
  club,
  base,
}: {
  layout: LayoutBlock[]
  ctx: BlockContext
  club: ClubSite
  base: string
}) =>
  layout.map((block, i) => {
    switch (block.blockType) {
      case 'hero':
        return <Hero key={block.id ?? i} block={block} ctx={ctx} club={club} base={base} />
      case 'ctaCardGrid':
        return <CtaCardGrid key={block.id ?? i} block={block} ctx={ctx} base={base} />
      default:
        return null
    }
  })
