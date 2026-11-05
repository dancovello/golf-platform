import type { VideoBlock } from '@/payload-types'

import { parseVideoURL } from '@/blocks/video/embed'

import { isImage } from './parts'
import type { BlockContext } from './resolve'
import { type GalleryLayout, VideoGallery } from './VideoGallery'
import { type VideoItem, VideoPlayer } from './VideoPlayer'

/**
 * Video: films kept on YouTube or Vimeo, played on the club's page. Two styles: A Featured
 * (one large player in place, the first video) and B Gallery (several, each opening in a
 * pop-up window; a grid or a carousel). The address is read again here and the player
 * address built from the video's ID, so only YouTube and Vimeo can ever be framed.
 */
export const Video = ({ block, ctx }: { block: VideoBlock; ctx: BlockContext }) => {
  const style = block.style ?? 'featured'
  const items: VideoItem[] = (block.videos ?? []).flatMap((row) => {
    const parsed = parseVideoURL(row.url)
    const poster = ctx.media(row.poster)
    if (!parsed || !isImage(poster)) return []
    return [
      {
        id: row.id ?? `${parsed.provider}-${parsed.id}`,
        title: row.title,
        caption: row.caption ?? null,
        provider: parsed.provider,
        embedURL: parsed.embedURL,
        poster: { src: poster.url, srcSet: poster.srcSet, position: poster.position },
        width: poster.width,
        height: poster.height,
      },
    ]
  })
  if (items.length === 0) return null
  const shown = style === 'featured' ? items.slice(0, 1) : items
  return (
    <section className={`blk vd vd-${style}-block${style === 'grid' ? ' on-subtle' : ''}`}>
      <div className="blk-container">
        <div className="blk-header">
          <div>
            {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
            <h2 className="t-heading-l blk-heading">{block.heading}</h2>
          </div>
        </div>
        {style === 'featured' ? (
          <ul className="vd-list vd-featured">
            {shown.map((item) => (
              <li key={item.id}>
                <VideoPlayer item={item} large />
              </li>
            ))}
          </ul>
        ) : (
          <VideoGallery
            items={shown}
            layout={
              (['auto', 'grid', 'carousel'] as const).includes(block.layout as GalleryLayout)
                ? (block.layout as GalleryLayout)
                : 'auto'
            }
          />
        )}
      </div>
    </section>
  )
}
