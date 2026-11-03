/** The categories every new club starts with. A club's editors can rename, remove or add to
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
] as const
