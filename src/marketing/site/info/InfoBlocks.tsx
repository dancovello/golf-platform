import type { MarketingReviewedBlock, MarketingRoadmapBlock } from '@/payload-types'

import { AvailabilityBadge } from '../parts'

type TextNode = { text?: string; children?: TextNode[] }

/** Every word in a rich text value. */
const wordsIn = (node: TextNode | undefined): number =>
  (node?.text?.split(/\s+/).filter(Boolean).length ?? 0) +
  (node?.children ?? []).reduce((sum, child) => sum + wordsIn(child), 0)

/** Minutes to read the page's text at 200 words a minute, never less than one. */
export const readMinutes = (richTexts: unknown[]): number => {
  const words = richTexts.reduce<number>(
    (sum, value) => sum + wordsIn((value as { root?: TextNode } | null)?.root),
    0,
  )
  return Math.max(1, Math.ceil(words / 200))
}

const LONDON = 'Europe/London'

/** Accessibility statement "Meta" (212:8199): "Last reviewed 14 October 2026 · 4 minute read". */
export const Reviewed = ({
  block,
  minutes,
}: {
  block: MarketingReviewedBlock
  minutes: number
}) => {
  const date = new Date(block.date)
  return (
    <p className="mk-reviewed">
      <span>
        {block.label === 'updated' ? 'Last updated' : 'Last reviewed'}{' '}
        <time dateTime={date.toISOString().slice(0, 10)}>
          {date.toLocaleDateString('en-GB', {
            timeZone: LONDON,
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </time>
      </span>{' '}
      <span aria-hidden="true">·</span> <span>{minutes} minute read</span>
    </p>
  )
}

/** Changelog before launch (187:6499): the empty state, then a Roadmap Card (264:8753) for
 * each thing being built, each with the Coming next badge. */
export const Roadmap = ({ block }: { block: MarketingRoadmapBlock }) => (
  <div className="mk-roadmap">
    <div className="mk-roadmap-empty">
      <h2>{block.emptyTitle}</h2>
      {block.emptyBody ? <p>{block.emptyBody}</p> : null}
    </div>
    <ul className="mk-roadmap-cards" data-count={block.cards.length}>
      {block.cards.map((card, i) => (
        <li key={card.id ?? i} className="mk-roadmap-card">
          <AvailabilityBadge status="coming-next" />
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </li>
      ))}
    </ul>
  </div>
)
