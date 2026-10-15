/**
 * The picture check (block-regression): one page per block, holding every design style of
 * that block, for each of the two Figma colour themes. Add a block here when it's built;
 * tests/visual/seed-visual.ts creates the pages and blocks.spec.ts photographs them.
 */
export const VISUAL_CLUBS = [
  { slug: 'visual-default', name: 'Heathcote', theme: 'Default tenant' },
  { slug: 'visual-coastal', name: 'Saltmarsh Links', theme: 'Demo · Coastal links' },
] as const

export const VISUAL_VIEWPORTS = [
  { name: 'desktop', width: 1366, height: 900 },
  { name: 'mobile', width: 375, height: 812 },
] as const

/** Page slugs, one per block. */
export const VISUAL_PAGES = [
  'hero',
  'cta-card-grid',
  'two-column',
  'rich-text',
  'rate-table',
  'gallery',
  'documents',
  'map',
  'pull-quote',
  'timeline',
  'logo-strip',
  'faq',
  'team',
  'membership',
  'holes',
  'scorecard',
  'course-status',
  'news-block',
] as const

/** Template pages (not blocks): name for the picture, and the address under the club. */
export const VISUAL_TEMPLATES = [
  { name: 'news-archive', path: 'news' },
  { name: 'news-article', path: 'news/hollow-tining-week-what-to-expect-on-the-greens' },
  { name: 'events-archive', path: 'events' },
] as const
