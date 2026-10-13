import type { HoleGridBlock } from '@/payload-types'

import { CourseGuide } from './CourseGuide'
import { HoleCards } from './HoleCards'
import { HoleCarousel } from './HoleCarousel'
import { nines } from './holeParts'
import type { BlockContext } from './resolve'
import { Tabs } from './Tabs'

/**
 * Hole-by-hole (docs/design/09), three styles over one of the club's courses: A Cards (front
 * and back nine tabs; a card opens the hole's details), B Carousel (tall photo cards on the
 * brand colour) and C Course guide (a row per hole with tip and every tee).
 */
export const HoleGrid = ({ block, ctx }: { block: HoleGridBlock; ctx: BlockContext }) => {
  const course = ctx.course(block.course)
  if (!course || course.holes.length === 0) return null
  const style = block.style ?? 'cards'
  const eyebrow = block.eyebrow ?? null

  if (style === 'carousel') {
    return (
      <section className="blk holes holes-carousel on-brand">
        <div className="blk-container">
          <HoleCarousel
            holes={course.holes}
            tees={course.tees}
            eyebrow={eyebrow}
            heading={block.heading}
          />
        </div>
      </section>
    )
  }

  if (style === 'guide') {
    return (
      <section className="blk holes holes-guide on-subtle">
        <div className="blk-container">
          <CourseGuide
            holes={course.holes}
            tees={course.tees}
            eyebrow={eyebrow}
            heading={block.heading}
          />
        </div>
      </section>
    )
  }

  const parts = nines(course.holes)
  return (
    <section className="blk holes holes-cards">
      <div className="blk-container">
        <div className="blk-header">
          <div>
            {eyebrow ? <p className="t-eyebrow blk-eyebrow">{eyebrow}</p> : null}
            <h2 className="t-heading-l blk-heading">{block.heading}</h2>
          </div>
        </div>
        <Tabs
          variant="tabs"
          label="Nine"
          labels={parts.length > 1 ? ['Front nine', 'Back nine'] : ['All holes']}
          panels={parts.map((holes, i) => (
            <HoleCards
              key={i}
              holes={holes}
              tees={course.tees}
              label={`${block.heading}: ${i === 0 ? 'front nine' : 'back nine'}`}
            />
          ))}
        />
      </div>
    </section>
  )
}
