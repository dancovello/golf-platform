/** A web address part: lower-case letters, numbers and single dashes, e.g. "green-fees". */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** "Green Fees & Visitors" → "green-fees-visitors". */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const SLUG_MESSAGE = 'Lower-case letters, numbers and dashes only.'
