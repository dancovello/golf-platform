import { sitePreviewEnabled } from './preview'

/**
 * Today's date for the public site (e.g. which rate season is "Now"). The browser and picture
 * tests pin it with SITE_FIXED_TODAY so pictures don't change with the calendar; that only
 * works on the staging preview, never in production.
 */
export const siteToday = (): Date => {
  const fixed = process.env.SITE_FIXED_TODAY
  if (fixed && sitePreviewEnabled()) {
    const d = new Date(`${fixed}T12:00:00Z`)
    if (!Number.isNaN(d.getTime())) return d
  }
  return new Date()
}
