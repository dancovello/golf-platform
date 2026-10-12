import { Button } from '../components/Button'
import type { SiteMedia } from './media'
import type { ResolvedLink } from './resolve'

/** A photo with its sized copies. `alt` defaults to the description set in the CMS. */
export const Photo = ({
  image,
  sizes,
  className = '',
  alt,
  eager = false,
}: {
  image: SiteMedia
  sizes: string
  className?: string
  alt?: string
  eager?: boolean
}) => (
  // eslint-disable-next-line @next/next/no-img-element -- sized copies via srcset from R2
  <img
    className={className}
    src={image.url}
    srcSet={image.srcSet ?? undefined}
    sizes={sizes}
    alt={alt ?? image.alt}
    loading={eager ? undefined : 'lazy'}
    width={image.width ?? undefined}
    height={image.height ?? undefined}
    style={{ objectPosition: image.position }}
  />
)

/** Plain text from the CMS, a blank line between paragraphs. */
export const Paragraphs = ({
  text,
  className = '',
}: {
  text: string | null | undefined
  className?: string
}) =>
  (text ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, i) => (
      <p key={i} className={className}>
        {p}
      </p>
    ))

/** An underlined text link with an arrow (Figma Button / Link). */
export const TextLink = ({
  link,
  base,
  onDark = false,
}: {
  link: ResolvedLink | null
  base: string
  onDark?: boolean
}) =>
  link ? (
    <Button label={link.label} link={link.link} base={base} style="link" onDark={onDark} />
  ) : null

/** A real image: the CMS only offers images here, but a stray video is never drawn as one. */
export const isImage = (m: SiteMedia | null): m is SiteMedia =>
  Boolean(m?.mimeType.startsWith('image/'))
