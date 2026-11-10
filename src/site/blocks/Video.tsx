import type { VideoBlock } from '@/payload-types'

import { parseVideoURL } from '@/blocks/video/embed'

import { Button } from '../components/Button'
import { isImage } from './parts'
import type { BlockContext } from './resolve'
import { type GalleryLayout, VideoGallery } from './VideoGallery'
import { type VideoItem, VideoPlayer } from './VideoPlayer'

/**
 * Video: films kept on YouTube or Vimeo, played on the club's page. Two styles: A Featured
 * (one large player in place, the first video; standard, full width, or half and half with
 * the video running to the page edge, with an optional description and button) and B Gallery (several, each opening in a
 * pop-up window; a grid or a carousel). The address is read again here and the player
 * address built from the video's ID, so only YouTube and Vimeo can ever be framed.
 */
export const Video = ({
  block,
  ctx,
  base,
}: {
  block: VideoBlock
  ctx: BlockContext
  base: string
}) => {
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

  if (style === 'featured') {
    const layout =
      block.featuredLayout === 'wide' || block.featuredLayout === 'split'
        ? block.featuredLayout
        : 'standard'
    const intro = block.intro?.trim()
    const button = ctx.link(block.button)
    const player = <VideoPlayer item={shown[0]!} large modal={layout === 'split'} />
    const text = (
      <>
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        <h2 className="t-heading-l blk-heading">{block.heading}</h2>
        {intro ? <p className="t-body-m vd-intro">{intro}</p> : null}
      </>
    )
    const buttonEl = button ? (
      <div className="vd-button">
        <Button label={button.label} link={button.link} base={base} style="solid" arrow />
      </div>
    ) : null

    if (layout === 'split') {
      return (
        <section className={`vd vd-split${block.videoSide === 'right' ? ' is-right' : ''}`}>
          <div className="vd-split-media">{player}</div>
          <div className="vd-split-panel">
            <div className="vd-split-copy">
              {text}
              {buttonEl}
            </div>
          </div>
        </section>
      )
    }
    return (
      <section className={`blk vd vd-featured-block${layout === 'wide' ? ' vd-wide' : ''}`}>
        <div className="blk-container">
          <div className={`blk-header${layout === 'wide' ? ' is-centred' : ''}`}>
            <div className="vd-header-text">
              {text}
              {layout === 'wide' ? buttonEl : null}
            </div>
          </div>
          <ul className="vd-list vd-featured">
            <li>{player}</li>
          </ul>
          {layout === 'standard' ? buttonEl : null}
        </div>
      </section>
    )
  }

  return (
    <section className="blk vd vd-grid-block on-subtle">
      <div className="blk-container">
        <div className="blk-header">
          <div>
            {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
            <h2 className="t-heading-l blk-heading">{block.heading}</h2>
          </div>
        </div>
        <VideoGallery
          items={shown}
          layout={
            (['auto', 'grid', 'carousel'] as const).includes(block.layout as GalleryLayout)
              ? (block.layout as GalleryLayout)
              : 'auto'
          }
        />
      </div>
    </section>
  )
}
