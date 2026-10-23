import type { CSSProperties } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import type { MarketingWeekBlock } from '@/payload-types'
import { brandCSSVariables } from '@/theme/colour'

import { DEMO_CLUBS } from '../../demo/clubs'
import { PREVIEWS } from '../../demo/previews'
import { WeekTimeline } from './WeekTimeline'

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
