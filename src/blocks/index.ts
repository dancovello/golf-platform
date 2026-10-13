import { ctaCardGrid } from './ctaCardGrid/config'
import { documentList } from './documentList/config'
import { gallery } from './gallery/config'
import { hero } from './hero/config'
import { map } from './map/config'
import { rateTable } from './rateTable/config'
import { richText } from './richText/config'
import { twoColumn } from './twoColumn/config'
import { pullQuote } from './pullQuote/config'
import { timeline } from './timeline/config'
import { logoStrip } from './logoStrip/config'
import { faq } from './faq/config'
import { team } from './team/config'
import { membership } from './membership/config'
import { holeGrid } from './holeGrid/config'
import { scorecard } from './scorecard/config'
import type { BlockDefinition, BlockRef } from './types'

/** Every block a club can add to a page. The website side is in src/site/blocks. */
export const blockDefinitions: BlockDefinition[] = [
  hero,
  ctaCardGrid,
  twoColumn,
  richText,
  rateTable,
  gallery,
  documentList,
  map,
  pullQuote,
  timeline,
  logoStrip,
  faq,
  team,
  membership,
  holeGrid,
  scorecard,
]

export const pageBlocks = blockDefinitions.map((b) => b.config)

/** Every page and photo a page's blocks point at. */
export const layoutRefs = (layout: unknown): BlockRef[] =>
  (Array.isArray(layout) ? layout : []).flatMap((block, i) => {
    const def = blockDefinitions.find((d) => d.config.slug === block?.blockType)
    return def ? def.refs(block, `layout.${i}`) : []
  })
