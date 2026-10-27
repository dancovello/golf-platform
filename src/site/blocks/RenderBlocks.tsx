import type { Page } from '@/payload-types'

import type { ClubSite } from '../loadClub'
import { CtaCardGrid } from './CtaCardGrid'
import { DocumentList } from './DocumentList'
import { Gallery } from './Gallery'
import { Hero } from './Hero'
import { MapBlock } from './MapBlock'
import { RateTable } from './RateTable'
import { RichText } from './RichText'
import { TwoColumn } from './TwoColumn'
import { PullQuote } from './PullQuote'
import { Timeline } from './Timeline'
import { LogoStrip } from './LogoStrip'
import { Faq } from './Faq'
import { Team } from './Team'
import { Membership } from './Membership'
import { HoleGrid } from './HoleGrid'
import { Scorecard } from './Scorecard'
import { CourseStatus } from './CourseStatus'
import { CourseRecord } from './CourseRecord'
import { NewsFeed } from '../news/NewsFeed'
import { EventsFeed } from '../events/EventsFeed'
import type { BlockContext } from './resolve'

import './blocks.css'
import './hero.css'
import './ctaCardGrid.css'
import './twoColumn.css'
import './richText.css'
import './rateTable.css'
import './gallery.css'
import './documentList.css'
import './map.css'
import './pullQuote.css'
import './timeline.css'
import './logoStrip.css'
import './faq.css'
import './team.css'
import './membership.css'
import './holes.css'
import './scorecard.css'
import './courseStatus.css'
import './courseRecord.css'
import '../components/buttons.css'
// After buttons.css: the news styles refine the shared link buttons (same as on news pages).
import '../news/news.css'
import '../events/events.css'

type LayoutBlock = NonNullable<Page['layout']>[number]

/** Draws a page's blocks in order. Unknown block types are skipped. */
export const RenderBlocks = ({
  layout,
  ctx,
  club,
  base,
  pageUpdatedAt = null,
}: {
  layout: LayoutBlock[]
  ctx: BlockContext
  club: ClubSite
  base: string
  /** The page's last save, for "Prices last updated". */
  pageUpdatedAt?: string | null
}) =>
  layout.map((block, i) => {
    switch (block.blockType) {
      case 'hero':
        return <Hero key={block.id ?? i} block={block} ctx={ctx} club={club} base={base} />
      case 'ctaCardGrid':
        return <CtaCardGrid key={block.id ?? i} block={block} ctx={ctx} base={base} />
      case 'twoColumn':
        return <TwoColumn key={block.id ?? i} block={block} ctx={ctx} base={base} />
      case 'richText':
        return <RichText key={block.id ?? i} block={block} ctx={ctx} base={base} />
      case 'rateTable':
        return (
          <RateTable
            key={block.id ?? i}
            block={block}
            ctx={ctx}
            club={club}
            base={base}
            pageUpdatedAt={pageUpdatedAt}
          />
        )
      case 'gallery':
        return <Gallery key={block.id ?? i} block={block} ctx={ctx} />
      case 'documentList':
        return <DocumentList key={block.id ?? i} block={block} ctx={ctx} base={base} />
      case 'map':
        return <MapBlock key={block.id ?? i} block={block} club={club} />
      case 'pullQuote':
        return <PullQuote key={block.id ?? i} block={block} ctx={ctx} />
      case 'timeline':
        return <Timeline key={block.id ?? i} block={block} ctx={ctx} />
      case 'logoStrip':
        return <LogoStrip key={block.id ?? i} block={block} ctx={ctx} />
      case 'faq':
        return <Faq key={block.id ?? i} block={block} ctx={ctx} club={club} base={base} />
      case 'team':
        return <Team key={block.id ?? i} block={block} ctx={ctx} base={base} />
      case 'membership':
        return <Membership key={block.id ?? i} block={block} ctx={ctx} base={base} />
      case 'holeGrid':
        return <HoleGrid key={block.id ?? i} block={block} ctx={ctx} />
      case 'scorecard':
        return <Scorecard key={block.id ?? i} block={block} ctx={ctx} />
      case 'courseStatus':
        return <CourseStatus key={block.id ?? i} block={block} ctx={ctx} club={club} base={base} />
      case 'courseRecord':
        return <CourseRecord key={block.id ?? i} block={block} ctx={ctx} />
      case 'newsFeed':
        return <NewsFeed key={block.id ?? i} block={block} club={club} base={base} />
      case 'eventsFeed':
        return <EventsFeed key={block.id ?? i} block={block} club={club} base={base} />
      default:
        return null
    }
  })
