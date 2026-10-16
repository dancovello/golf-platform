/** News categories, in the order the archive's filter pills show them. A plain module so the
 * website can use it without loading the CMS. */
export const NEWS_CATEGORIES = [
  { label: 'Course news', value: 'course' },
  { label: 'Competitions', value: 'competitions' },
  { label: 'Clubhouse', value: 'clubhouse' },
  { label: 'Membership', value: 'membership' },
  { label: 'Academy', value: 'academy' },
  { label: 'Club news', value: 'club' },
] as const

export type NewsCategory = (typeof NEWS_CATEGORIES)[number]['value']

export const newsCategoryLabel = (value: string | null | undefined) =>
  NEWS_CATEGORIES.find((c) => c.value === value)?.label ?? 'News'
