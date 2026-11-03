import { BRAND } from '@/brand'
import { logoFrom } from '../../branding'
import { marketingSettings } from '../../settings'

/**
 * Marketing/Wordmark (174:1816): the company logo, from Company website → Settings → Logo and
 * icon, or the built-in A1.Engine logo until one is uploaded. The link carries the name for
 * screen readers, so the picture itself has no description.
 */
export const Wordmark = async () => {
  const { branding } = await marketingSettings()
  const logo = logoFrom(branding?.logo)
  return (
    <a className="mk-wordmark" href="/" aria-label={`${BRAND.name}, home`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- the logo, from R2 or the build */}
      <img src={logo.src} alt="" style={{ aspectRatio: logo.ratio }} data-hole />
    </a>
  )
}
