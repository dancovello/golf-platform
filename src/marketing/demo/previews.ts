import type { MarketingWeekBlock } from '@/payload-types'

export type PreviewID = MarketingWeekBlock['moments'][number]['preview']

/** A picture of one of a club's live blocks: a title, its status line and a few rows. */
export type PreviewData = { title: string; status: string; when: string; rows: [string, string][] }

/**
 * The sample content each live block preview shows (Figma Preview/Course Status, News Post,
 * Green Fees, Hole Guide). The data shapes of blocks that work today; demo club values.
 */
export const PREVIEWS: Record<PreviewID, PreviewData> = {
  courseStatus: {
    title: 'Course status',
    status: 'Course open',
    when: 'Updated 06:12',
    rows: [
      ['Greens', 'Cut & rolled'],
      ['Tees', 'Main tees in play'],
      ['Bunkers', 'Raked, playable'],
    ],
  },
  news: {
    title: 'News',
    status: 'Published',
    when: 'Wed 09:30',
    rows: [
      ['Headline', 'Captain’s Day draw'],
      ['Section', 'Club news'],
      ['Shown on', 'Homepage, News'],
    ],
  },
  greenFees: {
    title: 'Green fees',
    status: 'Winter rates',
    when: 'From Mon',
    rows: [
      ['Weekday', '£55'],
      ['Weekend', '£70'],
      ['Twilight', '£35'],
    ],
  },
  holeGuide: {
    title: 'Hole 7 · The Firs',
    status: 'Updated',
    when: 'Sat 08:15',
    rows: [
      ['White tee', '412 yds'],
      ['Par · SI', '4 · 3'],
      ['Note', 'New back tee'],
    ],
  },
}
