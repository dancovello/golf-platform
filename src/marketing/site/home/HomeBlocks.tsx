import type {
  MarketingCompareBlock,
  MarketingContentMovesBlock,
  MarketingHomeHeroBlock,
  MarketingProofStatsBlock,
} from '@/payload-types'

import { TenantMorph } from '../../demo/TenantMorph'
import { formatPrice, marketingSettings } from '../../settings'
import { BrowserChrome, MarketingButton } from '../parts'
import { ProofStat } from '../ProofStat'

/** Home hero (Figma 176:2213; mobile 273:8968): the page's one H1, then the Tenant Morph. */
export const HomeHero = async ({ block }: { block: MarketingHomeHeroBlock }) => {
  const settings = await marketingSettings()
  const price = formatPrice(settings.pricing?.monthlyPrice ?? 149)
  const proof = (block.proofLine ?? '')
    .split('·')
    .map((part) => part.trim().replaceAll('{price}', price))
    .filter(Boolean)
  return (
    <div className="mk-home-hero">
      <div className="mk-home-hero-copy">
        <h1 className="mk-display-xl mk-home-hero-title">{block.title}</h1>
        {block.subhead ? <p className="mk-home-hero-body">{block.subhead}</p> : null}
        <div className="mk-home-hero-actions">
          {block.primary?.label && block.primary.href ? (
            <MarketingButton
              label={block.primary.label}
              href={block.primary.href}
              variant="primary"
            />
          ) : null}
          {block.secondary?.label && block.secondary.href ? (
            <MarketingButton
              label={block.secondary.label}
              href={block.secondary.href}
              variant="secondary"
              arrow={false}
            />
          ) : null}
        </div>
        {proof.length ? (
          <p className="mk-home-hero-proof">
            {proof.map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </p>
        ) : null}
      </div>
      <div className="mk-home-hero-demo">
        <TenantMorph />
      </div>
      {block.note || block.noteStrong ? (
        <p className="mk-home-hero-note">
          <span className="mk-live-dot" aria-hidden="true" />
          <span>
            {block.note} {block.noteStrong ? <strong>{block.noteStrong}</strong> : null}
          </span>
        </p>
      ) : null}
    </div>
  )
}

/** Proof Stats in a row of up to three (First impressions, 180:2674). */
export const ProofStats = ({ block }: { block: MarketingProofStatsBlock }) => (
  <div className="mk-proof-row" data-count={block.stats.length}>
    {block.stats.map((stat, i) => (
      <ProofStat
        key={stat.id ?? i}
        number={stat.number}
        claim={stat.claim}
        source={stat.source}
        methodHref={stat.methodHref}
      />
    ))}
  </div>
)

/** "A great website" vs "A poor website" (First impressions, 180:2674), with footnotes. */
export const Compare = ({ block }: { block: MarketingCompareBlock }) => (
  <div className="mk-compare">
    <div className="mk-compare-row">
      {(['good', 'poor'] as const).map((key) => {
        const side = block[key]
        return (
          <section key={key} className={`mk-compare-panel mk-compare-panel--${key}`}>
            <p className="mk-compare-label">{side.label}</p>
            <h3 className="mk-compare-title">{side.title}</h3>
            <ul>
              {(side.points ?? []).map((point, i) => (
                <li key={point.id ?? i}>{point.text}</li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
    {block.footnotes ? <p className="mk-footnotes">{block.footnotes}</p> : null}
  </div>
)

/**
 * Your content comes with you (289:9518): the current site's content, copied into blocks, and
 * three steps. The two windows are an example, shown on a demo club's address and labelled so.
 */
export const ContentMoves = ({ block }: { block: MarketingContentMovesBlock }) => (
  <div className="mk-moves">
    <div
      className="mk-moves-visual"
      role="group"
      aria-label="Example: a demo club’s site, copied into blocks"
    >
      <div className="mk-moves-window">
        <BrowserChrome address="ashgrovepark.golf" />
        <div className="mk-moves-body">
          <p className="mk-moves-heading">Found on the current site · Demo club</p>
          <ul>
            {(block.found ?? []).map((row, i) => (
              <li key={row.id ?? i}>
                <span>{row.label}</span>
                <span className="mk-moves-count">{row.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mk-moves-connector" aria-hidden="true">
        {block.chip ? <span className="mk-moves-chip">{block.chip}</span> : null}
        <span className="mk-moves-arrow">→</span>
      </div>
      <div className="mk-moves-window">
        <BrowserChrome address="ashgrovepark.golf" />
        <div className="mk-moves-body">
          <p className="mk-moves-heading">Built into blocks, ready to edit</p>
          <ul>
            {(block.built ?? []).map((row, i) => (
              <li key={row.id ?? i}>
                <span>{row.label}</span>
                <span className="mk-ready">
                  <span className="mk-live-dot" aria-hidden="true" />
                  Ready
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
    {block.steps?.length ? (
      <ol className="mk-steps">
        {block.steps.map((step, i) => (
          <li key={step.id ?? i}>
            <span className="mk-step-number">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="mk-step-title">{step.title}</h3>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>
    ) : null}
  </div>
)
