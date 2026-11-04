import { isGAMeasurementID } from '@/site/privacy/policy'

/**
 * The company site's Google Analytics ID (MARKETING_GA_ID, e.g. G-AB12CD34EF). Not a secret.
 * Set on production only, so staging and previews never add test visits to the real numbers.
 * Empty or not in the right shape: no banner and no analytics. Same check as the clubs' IDs.
 */
export const marketingGAId = (value: string | undefined = process.env.MARKETING_GA_ID) => {
  const id = value?.trim()
  return isGAMeasurementID(id) ? id : null
}
