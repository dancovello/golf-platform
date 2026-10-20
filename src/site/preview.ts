/**
 * Staging-only preview of a club's site at /preview/<club short name>. Clubs' real sites are
 * on their own domains (src/proxy.ts). Off unless SITE_PREVIEW=on, and never on production
 * even then (the admin's live preview still works there: src/site/resolveSite.ts).
 * Staging and pull-request previews are also behind the Vercel login.
 */
export const sitePreviewEnabled = (): boolean =>
  process.env.SITE_PREVIEW === 'on' && process.env.VERCEL_ENV !== 'production'

/** Where a club's site starts on the preview, e.g. "/preview/heathcote". On its own domain
 * it's "" (src/site/resolveSite.ts). */
export const siteBase = (clubSlug: string) => `/preview/${clubSlug}`
