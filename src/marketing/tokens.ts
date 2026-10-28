import type { MarketingSetting } from '@/payload-types'

import { formatPrice } from './settings'

/**
 * Values copy may refer to, filled from the marketing settings so the site never states a
 * number that isn't in Settings: {price} "£149", {vat} "+ VAT", {term} "12", {notice} "90".
 */
export const fillTokens = (text: string, settings: MarketingSetting): string => {
  const pricing = settings.pricing
  return text
    .replaceAll('{price}', formatPrice(pricing?.monthlyPrice ?? 149))
    .replaceAll('{vat}', pricing?.vatLabel ?? '+ VAT')
    .replaceAll('{term}', String(pricing?.minimumTermMonths ?? 12))
    .replaceAll('{notice}', String(pricing?.noticeDays ?? 90))
}
