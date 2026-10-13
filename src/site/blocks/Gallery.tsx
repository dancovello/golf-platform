import type { GalleryBlock } from '@/payload-types'

import { type GalleryItem, GalleryView } from './GalleryView'
import { isImage } from './parts'
import type { BlockContext } from './resolve'

/** Gallery (docs/design/11), three styles. The photos are the club's own (src/blocks/gallery). */
export const Gallery = ({ block, ctx }: { block: GalleryBlock; ctx: BlockContext }) => {
  const items: GalleryItem[] = (block.images ?? []).flatMap((row) => {
    const m = ctx.media(row.image)
    return isImage(m)
      ? [
          {
            src: m.url,
            srcSet: m.srcSet,
            alt: m.alt,
            caption: row.caption ?? null,
            position: m.position,
            album: row.album?.trim() || null,
            width: m.width,
            height: m.height,
          },
        ]
      : []
  })
  if (items.length === 0) return null
  const style = block.style ?? 'masonry'
  return (
    <section
      className={`blk gl gl-${style}-block${style === 'grid' ? ' on-subtle' : ''}${style === 'viewer' ? ' on-brand' : ''}`}
    >
      <div className="blk-container">
        <div className={`blk-header${style === 'viewer' ? ' is-centred' : ''}`}>
          <div>
            {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
            <h2 className="t-heading-l blk-heading">{block.heading}</h2>
          </div>
        </div>
        <GalleryView items={items} style={style} heading={block.heading} />
      </div>
    </section>
  )
}
