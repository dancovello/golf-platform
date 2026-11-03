import type {
  MarketingAssuranceBlock,
  MarketingCompareRowsBlock,
  MarketingObjectionsBlock,
  MarketingStepsBlock,
} from '@/payload-types'

import { MarketingIcon } from '../MarketingIcon'

/** Marketing/Assurance Item (351:1811): a tick, a short title and one true line. */
export const Assurance = ({ block }: { block: MarketingAssuranceBlock }) => (
  <ul className="mk-assure">
    {block.items.map((item, i) => (
      <li key={item.id ?? i} className="mk-assure-item">
        <span className="mk-assure-icon">
          <MarketingIcon name="check" size={20} />
        </span>
        <span className="mk-assure-text">
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </span>
      </li>
    ))}
  </ul>
)

/** Marketing/Compare Row (351:1818): "how it usually goes" against ours, a row at a time. */
export const CompareRows = ({ block }: { block: MarketingCompareRowsBlock }) => (
  <div className="mk-cmp">
    <div className="mk-cmp-labels" aria-hidden="true">
      <p>{block.oldLabel}</p>
      <p>{block.ourLabel}</p>
    </div>
    <ul>
      {block.rows.map((row, i) => (
        <li key={row.id ?? i} className="mk-cmp-row">
          <p className="mk-cmp-old">
            <span className="mk-cmp-icon">
              <MarketingIcon name="close" size={20} />
            </span>
            <span>
              <span className="mk-visually-hidden">{block.oldLabel}: </span>
              {row.oldWay}
            </span>
          </p>
          <p className="mk-cmp-our">
            <span className="mk-cmp-icon is-tick">
              <MarketingIcon name="check" size={20} />
            </span>
            <span>
              <span className="mk-visually-hidden">{block.ourLabel}: </span>
              {row.ourWay}
            </span>
          </p>
        </li>
      ))}
    </ul>
  </div>
)

/** Marketing/Step Card (351:1829): numbered steps in a row. */
export const Steps = ({ block }: { block: MarketingStepsBlock }) => (
  <ol className="mk-stepcards" data-count={block.steps.length}>
    {block.steps.map((step, i) => (
      <li key={step.id ?? i} className="mk-stepcard">
        <span className="mk-stepcard-number">{String(i + 1).padStart(2, '0')}</span>
        <h3 className="mk-stepcard-title">{step.title}</h3>
        <p>{step.body}</p>
      </li>
    ))}
  </ol>
)

/** Marketing/Objection Card (351:1833): the committee's question, answered in the first sentence. */
export const Objections = ({ block }: { block: MarketingObjectionsBlock }) => (
  <ul className="mk-objections">
    {block.items.map((item, i) => (
      <li key={item.id ?? i} className="mk-objection">
        <p className="mk-objection-topic">{item.topic}</p>
        <h3 className="mk-objection-question">{item.question}</h3>
        <p className="mk-objection-answer">{item.answer}</p>
      </li>
    ))}
  </ul>
)
