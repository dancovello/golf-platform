import type { CSSProperties } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import type { MarketingWeekBlock } from '@/payload-types'
import { brandCSSVariables } from '@/theme/colour'

import { DEMO_CLUBS } from '../../demo/clubs'
import { WeekTimeline } from './WeekTimeline'

type Preview = MarketingWeekBlock['moments'][number]['preview']

/**
 * The sample content each live block preview shows (Figma Preview/Course Status, News Post,
 * Green Fees, Hole Guide). The data shapes of blocks that work today; demo club values.
 */
const PREVIEWS: Record<
  Preview,
  { title: string; status: string; when: string; rows: [string, string][] }
> = {
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

/** A week at the club (178:2451): four Timeline Moments, each with a live block preview. */
export const Week = ({ block }: { block: MarketingWeekBlock }) => {
  const club = DEMO_CLUBS[0]
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  return (
    <WeekTimeline
      moments={block.moments.map((m) => ({
        time: m.time,
        title: m.title,
        body: m.body,
        preview: PREVIEWS[m.preview],
      }))}
      theme={theme}
    />
  )
}
