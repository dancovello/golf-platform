import type { CourseTourBlock } from '@/payload-types'

import type { ClubSite } from '../loadClub'
import type { BlockContext } from './resolve'
import { buildTour } from './tour'
import { TourJourney } from './TourJourney'
import { TourSplit } from './TourSplit'
import { TourStory } from './TourStory'

/**
 * Course tour (decisions.md, 12 Nov 2026): one hole of one of the club's courses, in one of
 * three styles. The page it sits on shows the first hole; "/hole-N" under that page shows the
 * others (src/site/routes/views.tsx). Nothing is drawn if the course or the hole is missing.
 */
export const CourseTour = ({
  block,
  ctx,
  club,
  base,
  pageSlug,
  holeNumber = 1,
  titleTag = 'h2',
}: {
  block: CourseTourBlock
  ctx: BlockContext
  club: ClubSite
  base: string
  pageSlug: string
  holeNumber?: number
  titleTag?: 'h1' | 'h2'
}) => {
  const tour = buildTour({ block, ctx, club, base, pageSlug, holeNumber, titleTag })
  if (!tour) return null
  if (block.style === 'split') return <TourSplit tour={tour} />
  if (block.style === 'journey') return <TourJourney tour={tour} />
  return <TourStory tour={tour} />
}
