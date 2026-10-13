import { ctaCardGrid } from './ctaCardGrid/config'
import { hero } from './hero/config'
import { rateTable } from './rateTable/config'
import { richText } from './richText/config'
import { twoColumn } from './twoColumn/config'
import type { BlockDefinition, BlockRef } from './types'

/** Every block a club can add to a page. The website side is in src/site/blocks. */
export const blockDefinitions: BlockDefinition[] = [
  hero,
  ctaCardGrid,
  twoColumn,
  richText,
  rateTable,
]

export const pageBlocks = blockDefinitions.map((b) => b.config)

/** Every page and photo a page's blocks point at. */
export const layoutRefs = (layout: unknown): BlockRef[] =>
  (Array.isArray(layout) ? layout : []).flatMap((block, i) => {
    const def = blockDefinitions.find((d) => d.config.slug === block?.blockType)
    return def ? def.refs(block, `layout.${i}`) : []
  })
