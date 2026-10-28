import type {
  MarketingDemoExampleBlock,
  MarketingMigrationBlock,
  MarketingRequestHeroBlock,
} from '@/payload-types'
import { DEMO_CLUBS } from '@/marketing/demo/clubs'
import { DemoHero } from '@/marketing/demo/DemoHero'
import { requestHomepage } from '@/marketing/requests/actions'
import { initialRequestState } from '@/marketing/requests/submit'
import { turnstileSiteKey } from '@/site/contact/turnstile'

import { RequestForm } from './RequestForm'

/**
 * The Switching intro (Hero row 290:38583): the page's heading, tick points and the Homepage
 * Request Form, side by side on desktop, stacked on phones (300:9650). Marketing pages are
 * drawn fresh for every visit (force-dynamic), so the form's time check starts at page load.
 */
export const RequestHero = ({ block }: { block: MarketingRequestHeroBlock }) => (
  <div className="mk-request-hero">
    <div className="mk-request-copy">
      <header className="mk-header mk-header--page mk-header--left">
        {block.eyebrow ? <p className="mk-eyebrow">{block.eyebrow}</p> : null}
        <h1 className="mk-header-title">{block.title}</h1>
        {block.subhead ? <p className="mk-header-body">{block.subhead}</p> : null}
      </header>
      {block.points?.length ? (
        <ul className="mk-ticks">
          {block.points.map((point, i) => (
            <li key={point.id ?? i}>
              <span className="mk-tick" aria-hidden="true">
                ✓
              </span>
              {point.text}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
    <RequestForm
      copy={{
        title: block.form?.title ?? 'Your club',
        intro: block.form?.intro,
        button: block.form?.button ?? 'Rebuild my homepage',
        footnote: block.form?.footnote,
        sentTitle: block.form?.sentTitle ?? 'On its way.',
      }}
      action={requestHomepage}
      initial={initialRequestState()}
      turnstileSiteKey={turnstileSiteKey()}
    />
  </div>
)

/**
 * The example under the intro (270:9005, mobile 300:9684): a demo club's real homepage hero,
 * in place of Figma's deprecated URL Reskin (hand-off §6).
 */
export const DemoExample = ({ block }: { block: MarketingDemoExampleBlock }) => (
  <div className="mk-demo-example">
    <div className="mk-demo-example-label">
      {block.eyebrow ? <p className="mk-eyebrow">{block.eyebrow}</p> : null}
      <p className="mk-demo-example-caption">{block.caption}</p>
    </div>
    <DemoHero club={DEMO_CLUBS[0]} />
  </div>
)

/** "The switch" (186:6615): a card per week. */
export const Migration = ({ block }: { block: MarketingMigrationBlock }) => (
  <ol className="mk-weeks">
    {(block.weeks ?? []).map((week, i) => (
      <li key={week.id ?? i} className="mk-week-card">
        <p className="mk-week-label">{week.label}</p>
        <h3 className="mk-week-title">{week.title}</h3>
        <p className="mk-week-body">{week.body}</p>
      </li>
    ))}
  </ol>
)
