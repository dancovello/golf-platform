import type { MarketingSetting } from '@/payload-types'

import { formatPrice } from './settings'

/**
 * Values copy may refer to, filled from the marketing settings so the site never states a
 * number that isn't in Settings: {price} "£149", {term} "12", {notice} "90".
 */
export const fillTokens = (text: string, settings: MarketingSetting): string => {
  const pricing = settings.pricing
  // {vat} is no longer used (not VAT registered, 9 Nov 2026). Saved text that still has it loses
  // the token and its extra space.
  return text
    .replaceAll(' {vat}', '')
    .replaceAll('{vat}', '')
    .replaceAll('{price}', formatPrice(pricing?.monthlyPrice ?? 149))
    .replaceAll('{term}', String(pricing?.minimumTermMonths ?? 12))
    .replaceAll('{notice}', String(pricing?.noticeDays ?? 90))
}
