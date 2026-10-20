import type { HeroBlock } from '@/payload-types'

import { Button } from '../components/Button'
import type { ClubSite } from '../loadClub'
import { HeroFit } from './HeroFit'
import { HeroVideo } from './HeroVideo'
import type { SiteMedia } from './media'
import type { BlockContext } from './resolve'

/** Full-bleed styles, which a transparent header (style B) can sit over. */
export const heroIsFullBleed = (block: { blockType?: string; style?: string | null }) =>
  block.blockType === 'hero' && block.style !== 'resort'

/** A full-bleed hero's photo shading, for the transparent header over it. */
export const heroShading = (block: { blockType?: string; image?: unknown }, ctx: BlockContext) =>
  block.blockType === 'hero' ? ctx.media(block.image)?.shading : undefined

const Media = ({
  image,
  video,
  sizes,
}: {
  image: SiteMedia
  video: SiteMedia | null
  sizes: string
}) =>
  video ? (
    <HeroVideo video={video} poster={image} />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
    <img
      className="hero-media"
      src={image.url}
      srcSet={image.srcSet ?? undefined}
      sizes={sizes}
      alt={image.alt}
      fetchPriority="high"
      style={{ objectPosition: image.position }}
    />
  )

/**
 * Hero (docs/design/07-figma-hero-build-spec.md), three design styles:
 * A · Heritage, B · Resort, C · Booking-led. At most four things in the copy: an eyebrow, a
 * headline and up to two buttons. Style C's tee-time search bar becomes the club's booking
 * button (Dan, 2026-10-12: the booking widget is out of scope for v1); its live course status
 * chip arrives with the Course Status block.
 */
export const Hero = ({
  block,
  ctx,
  club,
  base,
}: {
  block: HeroBlock
  ctx: BlockContext
  club: ClubSite
  base: string
}) => {
  const image = ctx.media(block.image)
  if (!image || !image.mimeType.startsWith('image/')) return null
  const videoMedia = block.mediaType === 'video' ? ctx.media(block.video) : null
  const video = videoMedia?.mimeType.startsWith('video/') ? videoMedia : null
  const primary = ctx.link(block.primaryButton)
  const secondary = ctx.link(block.secondaryLink)
  const style = block.style ?? 'heritage'

  const eyebrow = block.eyebrow ? <p className="t-eyebrow hero-eyebrow">{block.eyebrow}</p> : null

  if (style === 'resort') {
    return (
      <section className="hero hero-resort">
        <div className="hero-resort-band on-brand">
          <div className="hero-container hero-resort-copy">
            {eyebrow}
            <h1 className="t-display-l hero-headline">{block.headline}</h1>
            {primary || secondary ? (
              <div className="hero-actions">
                {primary ? <Button {...primary} base={base} style="accent" arrow /> : null}
                {secondary ? <Button {...secondary} base={base} style="link" onDark /> : null}
              </div>
            ) : null}
          </div>
        </div>
        <figure className="hero-container hero-resort-figure">
          <div className="hero-resort-frame">
            <Media image={image} video={video} sizes="(max-width: 1200px) 100vw, 1200px" />
          </div>
          {block.caption ? (
            <figcaption className="t-caption hero-caption">{block.caption}</figcaption>
          ) : null}
        </figure>
      </section>
    )
  }

  const booking = club.header.booking
  return (
    <section className={`hero hero-full hero-${style} on-image`} style={image.shading}>
      <HeroFit />
      <Media image={image} video={video} sizes="100vw" />
      <div className="hero-scrim" aria-hidden="true" />
      <div className="hero-container hero-copy">
        {eyebrow}
        <h1 className={`hero-headline ${style === 'heritage' ? 't-display-caps' : 't-display-xl'}`}>
          {block.headline}
        </h1>
        {style === 'heritage' ? <hr className="hero-rule" /> : null}
        <div className="hero-actions">
          {style === 'bookingLed' ? (
            booking ? (
              <Button label={booking.label} link={booking.link} base={base} style="accent" arrow />
            ) : null
          ) : (
            <>
              {primary ? <Button {...primary} base={base} style="outline" onDark arrow /> : null}
              {secondary ? <Button {...secondary} base={base} style="link" onDark /> : null}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
