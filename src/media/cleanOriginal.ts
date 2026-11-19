/**
 * Re-save every uploaded photo so the hidden details a phone or camera adds are dropped: where
 * it was taken (GPS), when, the device and sometimes the owner's name (uploads audit, finding 1,
 * 22 Oct 2026). Setting a resize option makes Payload run the original through sharp, which
 * leaves that metadata out, turns the photo the right way up, and replaces a browser-uploaded
 * original with the cleaned copy.
 *
 * 1024px wide at most, never enlarged (Dan, 19 Nov 2026): the full-size original is not kept,
 * because it is the same photo as the largest copy and only takes up storage. Nothing on the
 * website is shown larger than this.
 *
 * Videos and documents aren't touched: the admin asks editors to remove location and author
 * details before uploading them. Photos uploaded before this change: scripts/clean-photo-details.ts.
 */
export const cleanOriginal = { width: 1024, withoutEnlargement: true } as const
