/**
 * Re-save every original photo so the hidden details a phone or camera adds are dropped: where
 * it was taken (GPS), when, the device and sometimes the owner's name (uploads audit, finding 1,
 * 22 Oct 2026). Setting a resize option makes Payload run the original through sharp, which
 * leaves that metadata out, turns the photo the right way up, and replaces a browser-uploaded
 * original with the cleaned copy. 6000px wide, never enlarged, so normal photos keep their size.
 *
 * Videos and documents aren't touched: the admin asks editors to remove location and author
 * details before uploading them. Photos uploaded before this change: scripts/clean-photo-details.ts.
 */
export const cleanOriginal = { width: 6000, withoutEnlargement: true } as const
