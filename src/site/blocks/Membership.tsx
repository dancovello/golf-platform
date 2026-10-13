import type { MembershipBlock } from '@/payload-types'

import { Button } from '../components/Button'
import { Check } from '../components/Icons'
import { Paragraphs } from './parts'
import type { BlockContext, ResolvedLink } from './resolve'
import { SwipeRow } from './SwipeRow'
import { Tabs } from './Tabs'

type Tier = NonNullable<MembershipBlock['tiers']>[number]

const ON_APPLICATION = 'On application'

/** A table value: "yes" is a tick, empty is a dash, anything else is shown as typed. */
const Value = ({ value }: { value: string | null | undefined }) => {
  const v = value?.trim() ?? ''
  if (/^(yes|y|✓|✔)$/i.test(v))
    return (
      <span className="mb-tick" role="img" aria-label="Included">
        <Check />
      </span>
    )
  if (!v || /^(no|n|—|-)$/i.test(v)) return <span aria-label="Not included">—</span>
  return <>{v}</>
}

/**
 * Membership Tier Cards (docs/design/10), three styles over one list of categories:
 * A Cards (published prices, one "Most popular" card in the brand colour), B Compare (a real
 * table; one card per category on phones) and C Enquire (no prices: availability and an
 * enquiry card). The enquiry card links to the club's contact page for now; the built-in
 * form waits for the email provider decision (docs/product/03).
 */
export const Membership = ({
  block,
  ctx,
  base,
}: {
  block: MembershipBlock
  ctx: BlockContext
  base: string
}) => {
  const style = block.style ?? 'cards'
  const tiers = block.tiers ?? []
  if (tiers.length === 0) return null
  const buttonLabel =
    block.buttonLabel?.trim() ||
    (style === 'compare' ? 'Apply' : style === 'enquire' ? 'Enquire' : 'Apply for membership')
  const linkOf = (t: Tier): ResolvedLink | null => ctx.link(t.link, buttonLabel)
  const action = ctx.link(block.action)

  const header = (
    <div className="blk-header">
      <div className="mb-heading">
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        <h2 className="t-heading-l blk-heading">{block.heading}</h2>
        {block.intro ? <p className="t-body-l mb-intro">{block.intro}</p> : null}
      </div>
      {action ? (
        <Button label={action.label} link={action.link} base={base} style="outline" arrow />
      ) : null}
    </div>
  )
  const note = block.note ? <Paragraphs text={block.note} className="t-body-s mb-note" /> : null

  if (style === 'compare') {
    const features = block.features ?? []
    const valueAt = (t: Tier, i: number) => t.values?.[i]?.value
    const corner = tiers.find((t) => t.period)?.period ?? ''
    const priceOf = (t: Tier) => t.price?.trim() || ON_APPLICATION
    const narrow = [...tiers].sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended))
    return (
      <section className="blk mb mb-compare on-subtle">
        <div className="blk-container">
          {header}
          <div className="mb-table-wide">
            <table className="mb-table">
              <thead>
                <tr>
                  <td className="t-data-label mb-corner">{corner}</td>
                  {tiers.map((t, i) => (
                    <th key={i} scope="col" className={t.recommended ? 'is-recommended' : ''}>
                      <span className="t-heading-m mb-tier-name">{t.name}</span>
                      <span className="t-data-sans mb-tier-price">{priceOf(t)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="t-body-s">
                {features.map((f, r) => (
                  <tr key={r}>
                    <th scope="row">{f.label}</th>
                    {tiers.map((t, i) => (
                      <td key={i} className={t.recommended ? 'is-recommended' : ''}>
                        <Value value={valueAt(t, r)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td />
                  {tiers.map((t, i) => {
                    const l = linkOf(t)
                    return (
                      <td key={i} className={t.recommended ? 'is-recommended' : ''}>
                        {l ? (
                          <Button
                            label={l.label}
                            link={l.link}
                            base={base}
                            style={t.recommended ? 'accent' : 'link'}
                            arrow
                          />
                        ) : null}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="mb-table-narrow">
            <Tabs
              variant="segments"
              label="Membership categories"
              labels={narrow.map((t) => t.name)}
              panels={narrow.map((t) => {
                const i = tiers.indexOf(t)
                const l = linkOf(t)
                return (
                  <div key={i} className="mb-narrow-panel">
                    <table className="mb-table">
                      <thead>
                        <tr>
                          <td className="t-data-label mb-corner">{corner}</td>
                          <th scope="col">
                            <span className="t-heading-m mb-tier-name">{t.name}</span>
                            <span className="t-data-sans mb-tier-price">{priceOf(t)}</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="t-body-s">
                        {features.map((f, r) => (
                          <tr key={r}>
                            <th scope="row">{f.label}</th>
                            <td>
                              <Value value={valueAt(t, r)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {l ? (
                      <Button
                        label={l.label}
                        link={l.link}
                        base={base}
                        style={t.recommended ? 'accent' : 'outline'}
                        arrow
                      />
                    ) : null}
                  </div>
                )
              })}
            />
          </div>
          {note}
        </div>
      </section>
    )
  }

  if (style === 'enquire') {
    const card = block.card ?? {}
    const cardLink = ctx.link(card.link)
    return (
      <section className="blk mb mb-enquire">
        <div className="blk-container">
          {header}
          <div className="mb-enquire-layout">
            <ul className="mb-categories">
              {tiers.map((t, i) => {
                const l = linkOf(t)
                return (
                  <li key={i} className="mb-category">
                    <div className="mb-category-text">
                      <p className="mb-category-name">
                        <span className="t-heading-m">{t.name}</span>
                        {t.availability ? (
                          <span className="t-data-label mb-tag">{t.availability}</span>
                        ) : null}
                      </p>
                      {t.description ? (
                        <p className="t-body-s mb-description">{t.description}</p>
                      ) : null}
                    </div>
                    {l ? (
                      <Button label={l.label} link={l.link} base={base} style="link" arrow />
                    ) : null}
                  </li>
                )
              })}
            </ul>
            {card.heading || cardLink ? (
              <aside className="mb-card">
                {card.heading ? <h3 className="t-heading-m">{card.heading}</h3> : null}
                {card.text ? <Paragraphs text={card.text} className="t-body-s" /> : null}
                {cardLink ? (
                  <Button
                    label={cardLink.label}
                    link={cardLink.link}
                    base={base}
                    style="accent"
                    arrow
                  />
                ) : null}
                {card.note ? <p className="t-label-s mb-card-note">{card.note}</p> : null}
              </aside>
            ) : null}
          </div>
          {note}
        </div>
      </section>
    )
  }

  const cards = tiers.map((t, i) => {
    const l = linkOf(t)
    const price = t.price?.trim()
    return (
      <article key={i} className={`mb-tier${t.recommended ? ' is-recommended' : ''}`}>
        <div className="mb-tier-top">
          <h3 className="t-heading-m">{t.name}</h3>
          {t.recommended ? <span className="t-data-label mb-popular">Most popular</span> : null}
        </div>
        <p className="mb-price">
          {price ? (
            <>
              <span className="t-heading-l">{price}</span>
              {t.period ? <span className="t-label-s mb-period">{t.period}</span> : null}
            </>
          ) : (
            <span className="t-heading-m">{ON_APPLICATION}</span>
          )}
        </p>
        {t.description ? <p className="t-body-s mb-description">{t.description}</p> : null}
        {t.benefits && t.benefits.length > 0 ? (
          <ul className="mb-benefits t-body-s">
            {t.benefits.map((b, k) => (
              <li key={k}>
                <Check />
                {b.text}
              </li>
            ))}
          </ul>
        ) : null}
        {l ? (
          <Button
            label={l.label}
            link={l.link}
            base={base}
            style={t.recommended ? 'accent' : 'outline'}
            onDark={!!t.recommended}
            arrow
          />
        ) : null}
      </article>
    )
  })

  return (
    <section className="blk mb mb-cards">
      <div className="blk-container">
        {header}
        <SwipeRow className={`mb-tiers cols-${Math.min(tiers.length, 4)}`} label={block.heading}>
          {cards}
        </SwipeRow>
        {note}
      </div>
    </section>
  )
}
