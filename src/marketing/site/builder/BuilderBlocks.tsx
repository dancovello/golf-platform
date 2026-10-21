import type { CSSProperties } from 'react'

import { fontSetVariables } from '@/app/(frontend)/fonts'
import type { MarketingBuilderHeroBlock, MarketingLiveDemoBlock } from '@/payload-types'
import { DEMO_CLUBS, demoClubSite, demoContext } from '@/marketing/demo/clubs'
import { demoCourse } from '@/marketing/demo/course'
import { DemoFrame } from '@/marketing/demo/DemoFrame'
import { FLIPPER_CLUB } from '@/marketing/demo/flipper'
import { PREVIEWS } from '@/marketing/demo/previews'
import { HoleGrid } from '@/site/blocks/HoleGrid'
import { Hero } from '@/site/blocks/Hero'
import { brandCSSVariables } from '@/theme/colour'

import '@/site/blocks/holes.css'

import { PreviewCard } from '../home/PreviewCard'
import { BrowserChrome, MarketingButton } from '../parts'
import { BlockFlipper } from './BlockFlipper'
import { DialColours, TokenDial } from './TokenDial'

/** Website builder intro (183:3044): centred heading, two buttons, the Block Flipper. */
export const BuilderHero = ({ block }: { block: MarketingBuilderHeroBlock }) => {
  const primary = block.primary?.label && block.primary.href ? block.primary : null
  const secondary = block.secondary?.label && block.secondary.href ? block.secondary : null
  return (
    <div className="mk-builder-hero">
      <header className="mk-header mk-header--page mk-header--center">
        {block.eyebrow ? <p className="mk-eyebrow">{block.eyebrow}</p> : null}
        <h1 className="mk-header-title">{block.title}</h1>
        {block.subhead ? <p className="mk-header-body">{block.subhead}</p> : null}
      </header>
      {primary || secondary ? (
        <div className="mk-builder-actions">
          {primary ? (
            <MarketingButton label={primary.label!} href={primary.href!} variant="primary" />
          ) : null}
          {secondary ? (
            <MarketingButton label={secondary.label!} href={secondary.href!} variant="secondary" />
          ) : null}
        </div>
      ) : null}
      <BlockFlipper address={FLIPPER_CLUB.domain} />
    </div>
  )
}

const kingsmere = DEMO_CLUBS.find((c) => c.id === 'bookingLed') ?? DEMO_CLUBS[2]
const ashgrove = DEMO_CLUBS[0]

/** Token Dial (183:3115): the Booking-led demo club's hero takes the picked colour. */
const TokenDialDemo = () => (
  <TokenDial
    base={kingsmere.brand}
    frame={
      // The window is 776 wide with a 480-tall viewport: 845 at the hero's 1366 design width.
      <DemoFrame club={kingsmere} label={`${kingsmere.name}’s home page`} height={845}>
        <DialColours>
          <Hero block={kingsmere.hero} ctx={demoContext()} club={demoClubSite(kingsmere)} base="" />
        </DialColours>
      </DemoFrame>
    }
  />
)

/** Course guide (197:6841): the real Hole Grid, style C, on the demo club's course page. */
const CourseGuideDemo = () => (
  <div className="mk-guide-demo">
    {/* A 632-tall viewport at 1200 wide: 719 at the block's 1366 design width. */}
    <DemoFrame
      club={ashgrove}
      label={`${ashgrove.name}’s course guide`}
      height={719}
      path="/the-course"
    >
      <HoleGrid
        block={
          {
            blockType: 'holeGrid',
            style: 'guide',
            course: 'demo-championship',
            eyebrow: 'The Championship course',
            heading: 'Hole by hole',
          } as never
        }
        ctx={demoContext({ course: () => demoCourse() })}
      />
    </DemoFrame>
  </div>
)

/** Course status (290:9552): the course report and a news post, as they look on the site. */
const CourseStatusDemo = () => {
  const theme = {
    ...brandCSSVariables(ashgrove.brand),
    ...fontSetVariables(ashgrove.fontSet),
  } as CSSProperties
  return (
    <figure
      className="mk-demo mk-status-demo"
      aria-label={`Demo club: ${ashgrove.name}’s course report and news`}
    >
      <BrowserChrome address={ashgrove.domain} />
      <div className="club-theme mk-status-demo-view" style={theme}>
        <PreviewCard preview={PREVIEWS.courseStatus} theme={theme} />
        <PreviewCard preview={PREVIEWS.news} theme={theme} />
      </div>
    </figure>
  )
}

/** A live demo with up to three details under it. */
export const LiveDemo = ({ block }: { block: MarketingLiveDemoBlock }) => (
  <div className="mk-live-demo">
    {block.demo === 'tokenDial' ? <TokenDialDemo /> : null}
    {block.demo === 'courseGuide' ? <CourseGuideDemo /> : null}
    {block.demo === 'courseStatus' ? <CourseStatusDemo /> : null}
    {block.details?.length ? (
      <ul className="mk-details">
        {block.details.map((d, i) => (
          <li key={d.id ?? i}>
            <h3 className="mk-detail-title">{d.title}</h3>
            <p className="mk-detail-body">{d.body}</p>
          </li>
        ))}
      </ul>
    ) : null}
  </div>
)
