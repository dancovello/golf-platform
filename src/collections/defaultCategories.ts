/** The categories every new club starts with, for news and for documents. A club's editors can rename, remove or add to
 * them (Categories in the admin); this list is only the starting point, and it is what the
 * categories migration gave every existing club. The slug is what appears in web addresses
 * such as /news?category=course, so it never changes when a category is renamed. */
export const DEFAULT_CATEGORIES = [
  { name: 'Course news', slug: 'course' },
  { name: 'Competitions', slug: 'competitions' },
  { name: 'Clubhouse', slug: 'clubhouse' },
  { name: 'Membership', slug: 'membership' },
  { name: 'Academy', slug: 'academy' },
  { name: 'Club news', slug: 'club' },
  // The categories documents have always had. One list serves news and documents, so these
  // sit beside the news ones. (The slug 'course' was already taken by "Course news".)
  { name: 'Course & scorecards', slug: 'course-scorecards' },
  { name: 'Policies', slug: 'policies' },
  { name: 'Forms', slug: 'forms' },
  { name: 'Minutes', slug: 'minutes' },
  { name: 'Visitors', slug: 'visitors' },
  { name: 'Other', slug: 'other' },
] as const

/** What a document's category used to be called before documents shared the club's list. */
export const LEGACY_DOCUMENT_CATEGORY_SLUGS: Record<string, string> = {
  course: 'course-scorecards',
}
