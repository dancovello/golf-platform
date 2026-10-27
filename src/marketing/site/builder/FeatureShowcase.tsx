import type { CSSProperties, ReactNode } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import { DEMO_CLUBS, demoClubSite, demoContext } from '@/marketing/demo/clubs'
import {
  SEARCH_CONTACT,
  SEARCH_QUERY,
  SEARCH_QUICK,
  SEARCH_RESULTS,
  SEARCH_SHORTCUTS,
  SHOWCASE_EVENTS,
  showcaseRates,
  showcaseStatus,
} from '@/marketing/demo/showcase'
import type { MarketingFeatureShowcaseBlock } from '@/payload-types'
import { CourseStatus } from '@/site/blocks/CourseStatus'
import { RateTable } from '@/site/blocks/RateTable'
import { EventsAgenda } from '@/site/events/EventsFeed'
import { brandCSSVariables } from '@/theme/colour'

import { DemoSearch, Spotlight, StageFit } from './ShowcaseClient'

type Feature = MarketingFeatureShowcaseBlock['items'][number]['feature']

const club = DEMO_CLUBS[0]
const site = demoClubSite(club)

/** Two versions of the same real component, one fading into the other: the change a club makes. */
const Change = ({ before, after }: { before: ReactNode; after: ReactNode }) => (
  <div className="mk-change">
    <div className="mk-change-before">{before}</div>
    <div className="mk-change-after">{after}</div>
  </div>
)

/** The club's real Course status block (Widget style), the trolley rule changing. */
const courseStatus = (trolleys: 'allowed' | 'paths') => (
  <CourseStatus
    block={
      {
        blockType: 'courseStatus',
        style: 'widget',
        eyebrow: 'Today on the course',
        heading: 'Course status',
        intro: 'Posted by the duty manager, and shown on the homepage.',
      } as never
    }
    ctx={demoContext({ courseStatus: showcaseStatus(trolleys) })}
    club={site}
    base=""
  />
)

/** The club's real Events block (Agenda style): its Event cards as rows, with date and place. */
const events = (
  <EventsAgenda
    eyebrow="What’s on"
    heading="Competitions and socials"
    intro="Fixtures in date order, from the club's events."
    allHref="#"
    events={SHOWCASE_EVENTS}
    base=""
  />
)

/** The club's real Rate table block, one weekday rate changing. */
const rates = (weekday: string) => (
  <RateTable
    block={showcaseRates(weekday)}
    ctx={demoContext()}
    club={site}
    base=""
    pageUpdatedAt={null}
  />
)

/** The club's real header search, empty at first, then answering a typed question. */
const search = (
  <DemoSearch
    base=""
    clubSlug={site.slug}
    clubName={club.name}
    shortcuts={SEARCH_SHORTCUTS}
    contact={SEARCH_CONTACT}
    phone={null}
    demo={{ query: SEARCH_QUERY, quick: SEARCH_QUICK, results: SEARCH_RESULTS }}
  />
)

/** How wide each real component is laid out before it is shrunk into its card. */
const VISUALS: Record<Feature, { width: number; node: ReactNode }> = {
  courseStatus: {
    width: 900,
    node: <Change before={courseStatus('allowed')} after={courseStatus('paths')} />,
  },
  events: { width: 1000, node: events },
  search: { width: 960, node: search },
  greenFees: { width: 900, node: <Change before={rates('£60')} after={rates('£55')} /> },
}

/**
 * Feature showcase (Dan, 26 Oct, after Linear's AI page; reworked 27 Oct): up to four everyday
 * features in a 2 × 2 grid. Each card shows the club site's own component, not a lookalike: the
 * real Course status, Event cards, Rate table and header search, in the demo club's colours,
 * with one small change happening. The pictures are inert and hidden from screen readers: each
 * card's title and text carry the meaning. While the grid is on screen the rest of the page
 * fades back (Spotlight).
 */
export const FeatureShowcase = ({ block }: { block: MarketingFeatureShowcaseBlock }) => {
  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties
  return (
    <Spotlight>
      <ul className="mk-showcase" data-count={block.items.length}>
        {block.items.map((item, i) => {
          const visual = VISUALS[item.feature]
          return (
            <li key={item.id ?? i} className="mk-showcase-card">
              <div className="mk-showcase-stage" aria-hidden="true">
                <div className={`club-theme mk-sc mk-sc--${item.feature}`} style={theme} inert>
                  <StageFit width={visual.width}>{visual.node}</StageFit>
                </div>
              </div>
              <div className="mk-showcase-text">
                <h3 className="mk-detail-title">{item.title}</h3>
                <p className="mk-detail-body">{item.body}</p>
              </div>
            </li>
          )
        })}
      </ul>
    </Spotlight>
  )
}
