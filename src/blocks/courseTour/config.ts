import type { Block } from 'payload'

import { styleField } from '../shared'
import { type BlockDefinition, type BlockRef, idOf } from '../types'

/** The address of one hole's page under the tour's own page: "hole-7". */
export const holeSegment = (number: number) => `hole-${number}`

/** "hole-7" → 7. Null for anything that isn't a hole a course could have (1 to 18). */
export const holeFromSegment = (segment: string | undefined): number | null => {
  const match = /^hole-([1-9]|1[0-8])$/.exec(segment ?? '')
  return match ? Number(match[1]) : null
}

/**
 * Course tour (Figma page "Course Tour (hole pages)"; decisions.md, 12 Nov 2026). One block,
 * three design styles, reading one of the club's courses. Unlike every other block it makes
 * pages: the page it sits on gets an address for each hole (the page's own address plus
 * "/hole-N", src/site/routes/views.tsx), so editors never create 18 pages.
 */
const config: Block = {
  slug: 'courseTour',
  labels: { singular: 'Course tour', plural: 'Course tours' },
  interfaceName: 'CourseTourBlock',
  fields: [
    styleField([
      { label: 'A · Hole story: a big photo, then the hole told in sections', value: 'story' },
      {
        label: 'B · Split-screen guide: photos stay on the left, details on the right',
        value: 'split',
      },
      {
        label: 'C · Course journey: a strip of every hole, a photo viewer and tabs',
        value: 'journey',
      },
    ]),
    {
      name: 'heading',
      label: 'Heading',
      type: 'text',
      required: true,
      defaultValue: 'Course tour',
      maxLength: 40,
      admin: { description: 'Names the list of holes. Style C shows it above the strip.' },
    },
    {
      name: 'course',
      label: 'Course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      admin: {
        description:
          'Each hole of this course gets its own page under this one, e.g. “/course-tour/hole-2”. Photos, tees and notes come from Courses. Give this page its own address and put the tour first on it.',
      },
    },
    {
      name: 'scorecardPage',
      label: 'Scorecard page (optional)',
      type: 'relationship',
      relationTo: 'pages',
      admin: { description: 'Shown as a “View full scorecard” link on every hole.' },
    },
  ],
}

export const courseTour: BlockDefinition = {
  config,
  refs: (block, path) => {
    const refs: BlockRef[] = []
    const course = idOf(block.course)
    if (course) refs.push({ collection: 'courses', id: course, path: `${path}.course` })
    const scorecard = idOf(block.scorecardPage)
    if (scorecard) refs.push({ collection: 'pages', id: scorecard, path: `${path}.scorecardPage` })
    return refs
  },
}
