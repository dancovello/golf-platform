/**
 * Staging-only preview of a club's site at /preview/<club short name>, until real domains
 * arrive in build step 4. Off unless SITE_PREVIEW=on, and never on production even then.
 * Staging and pull-request previews are also behind the Vercel login.
 */
export const sitePreviewEnabled = (): boolean =>
  process.env.SITE_PREVIEW === 'on' && process.env.VERCEL_ENV !== 'production'

/** Where a club's site starts, e.g. "/preview/heathcote". The one place to change when clubs
 * move to their own domains in build step 4 (the address then becomes ""). */
export const siteBase = (clubSlug: string) => `/preview/${clubSlug}`
