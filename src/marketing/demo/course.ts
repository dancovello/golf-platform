import { HOLE_CARD, HOLE_TIPS } from '@/demo/courseCard'
import type { SiteCourse } from '@/site/blocks/resolve'

import { demoPicture } from './clubs'

const PICTURES = ['heathland', 'lakeside', 'parkland', 'links']

/**
 * The demo club's Championship course, for the course guide demo (Website builder, 197:6841):
 * the same card as the demo club seed, drawn by the real Hole Grid block with no database.
 */
export const demoCourse = (): SiteCourse => ({
  id: 'demo-championship',
  name: 'The Championship course',
  tees: [
    {
      colour: 'white',
      name: 'White',
      rating: 74.1,
      slope: 138,
      ratingWomen: 79.6,
      slopeWomen: 145,
    },
    {
      colour: 'yellow',
      name: 'Yellow',
      rating: 72.3,
      slope: 131,
      ratingWomen: 77.5,
      slopeWomen: 139,
    },
    { colour: 'red', name: 'Red', rating: 75.2, slope: 134, ratingWomen: 80.1, slopeWomen: 139 },
  ],
  holes: HOLE_CARD.map(([name, par, strokeIndex, white, yellow, red], i) => ({
    number: i + 1,
    name,
    par,
    strokeIndex,
    ladiesPar: i === HOLE_CARD.findIndex((h) => h[1] === 4) ? 5 : null,
    ladiesStrokeIndex: (strokeIndex % 18) + 1,
    yards: [white, yellow, red],
    image: demoPicture(PICTURES[i % PICTURES.length]),
    video: null,
    tip: HOLE_TIPS[i % HOLE_TIPS.length],
    photos: [],
    plan: null,
    description: null,
    notes: [],
    hazards: [],
  })),
  tipFrom: null,
})
