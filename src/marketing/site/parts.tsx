import type { MarketingMedia } from '@/payload-types'
import type { SiteMedia } from '@/site/blocks/media'

import dots from './assets/browser-dots.svg'
import { MarketingIcon } from './MarketingIcon'

/** True for a page on this site ("/pricing"); anything else opens as a normal web link. */
const isInternal = (href: string) => href.startsWith('/')

/**
 * Marketing/Button (Figma 174:1846). Primary: the one action per view, with an arrow that nudges
 * 3px on hover. Secondary: alternatives. Full width and 44px tall on phones (mobile CTA, 297:9754),
 * where the arrow is dropped.
 */
export const MarketingButton = ({
  label,
  href,
  variant,
}: {
  label: string
  href: string
  variant: 'primary' | 'secondary'
}) => (
  <a
    className={`mk-button mk-button--${variant}`}
    href={href}
    {...(isInternal(href) ? {} : { rel: 'noopener' })}
  >
    <span>{label}</span>
    {variant === 'primary' ? (
      <span className="mk-button-icon">
        <MarketingIcon name="arrow-right" size={16} />
      </span>
    ) : null}
  </a>
)

/**
 * Marketing/Availability Badge (263:8726): text and icon, never colour alone. "Small" is the size
 * used on feature cards.
 */
export const AvailabilityBadge = ({
  status,
  size = 'default',
}: {
  status: 'live' | 'coming-next'
  size?: 'default' | 'small'
}) => (
  <span className={`mk-badge mk-badge--${status} mk-badge--${size}`}>
    <MarketingIcon name={status === 'live' ? 'check' : 'clock'} size={size === 'small' ? 12 : 14} />
    <span>{status === 'live' ? 'Live' : 'Coming next'}</span>
  </span>
)

/** Marketing/Browser Chrome (176:1929): the window bar above a product screen or live block. */
export const BrowserChrome = ({ address }: { address: string }) => (
  <div className="mk-chrome">
    {/* eslint-disable-next-line @next/next/no-img-element -- a 42×10 decoration from Figma */}
    <img src={dots.src} width={42} height={10} alt="" />
    <span className="mk-chrome-address">
      <MarketingIcon name="lock" size={12} />
      <span>{address}</span>
    </span>
    <span className="mk-chrome-balance" aria-hidden="true" />
  </div>
)

/** A marketing photo in the shape the club sites' Photo component draws (srcset, focal point). */
export const marketingPhoto = (image: MarketingMedia): SiteMedia | null => {
  if (!image.url) return null
  const sizes = Object.values(image.sizes ?? {}).filter((s): s is { url: string; width: number } =>
    Boolean(s?.url && s.width),
  )
  return {
    url: image.url,
    alt: image.alt,
    mimeType: image.mimeType ?? 'image/jpeg',
    width: image.width ?? null,
    height: image.height ?? null,
    srcSet: sizes.length ? sizes.map((s) => `${s.url} ${s.width}w`).join(', ') : null,
    position: `${image.focalX ?? 50}% ${image.focalY ?? 50}%`,
    shading: {},
  }
}
