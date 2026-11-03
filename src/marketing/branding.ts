import defaultLogo from './site/assets/logo.svg'

import type { MarketingMedia } from '@/payload-types'

/** The logo as drawn (viewBox of src/marketing/site/assets/logo.svg): width over height. */
export const DEFAULT_LOGO_RATIO = 1009.08 / 217.7

export type LogoImage = { src: string; ratio: number }

/** The built-in A1.Engine logo, used until a logo is uploaded under Company website → Settings. */
export const BUILT_IN_LOGO: LogoImage = { src: defaultLogo.src, ratio: DEFAULT_LOGO_RATIO }

const asMedia = (value: unknown): MarketingMedia | null =>
  value && typeof value === 'object' ? (value as MarketingMedia) : null

/** The uploaded logo from the settings, or the built-in one. */
export const logoFrom = (logo: unknown): LogoImage => {
  const media = asMedia(logo)
  if (!media?.url) return BUILT_IN_LOGO
  const ratio = media.width && media.height ? media.width / media.height : DEFAULT_LOGO_RATIO
  return { src: media.sizes?.w1600?.url ?? media.url, ratio }
}

/** The address of an uploaded picture from the settings, if there is one. */
export const mediaUrl = (value: unknown, size?: 'w640' | 'w1600'): string | undefined => {
  const media = asMedia(value)
  return (size && media?.sizes?.[size]?.url) || media?.url || undefined
}
