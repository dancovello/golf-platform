/**
 * The icons a feature card may use: the shared line-icon set from the Figma "Shared components"
 * page (24px grid, 1.25 stroke), limited to the ones that make sense beside a feature. Kept free
 * of React so the CMS can list them; the website draws them (src/marketing/site/MarketingIcon).
 */
export const FEATURE_ICONS = [
  { value: 'check', label: 'Tick' },
  { value: 'clock', label: 'Clock' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'players', label: 'People' },
  { value: 'flag', label: 'Flag' },
  { value: 'lock', label: 'Lock' },
  { value: 'mail', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'pin', label: 'Location' },
  { value: 'search', label: 'Search' },
  { value: 'file', label: 'Document' },
  { value: 'download', label: 'Download' },
  { value: 'info', label: 'Information' },
  { value: 'sun', label: 'Sun' },
  { value: 'expand', label: 'Expand' },
  { value: 'arrow-up-right', label: 'Arrow out' },
] as const

export type FeatureIcon = (typeof FEATURE_ICONS)[number]['value']
