import type { CSSProperties } from 'react'

import type { RateTableBlock } from '@/payload-types'

import { Button } from '../components/Button'
import { Phone } from '../components/Icons'
import type { ClubSite } from '../loadClub'
import { siteToday } from '../today'
import type { BlockContext } from './resolve'
import { isCurrentSeason } from './seasons'
import { Tabs } from './Tabs'

type Tab = NonNullable<RateTableBlock['tabs']>[number]
type Section = NonNullable<Tab['sections']>[number]

const prices = (row: NonNullable<Section['rows']>[number], count: number) =>
  [row.price1, row.price2, row.price3, row.price4].slice(0, count).map((p) => p?.trim() || '—')

const DAY = 24 * 60 * 60 * 1000

/**
 * Rate / Pricing Table (docs/design/10), three styles: A Classic (season tabs, a real table),
 * B Seasons (audience segments, a card per season with the current one marked "Now"),
 * C Matrix (audience segments, four-price table, sticky booking panel). "Prices last updated"
 * is the page's own save date, never typed in.
 */
export const RateTable = ({
  block,
  ctx,
  club,
  base,
  pageUpdatedAt,
}: {
  block: RateTableBlock
  ctx: BlockContext
  club: ClubSite
  base: string
  pageUpdatedAt: string | null
}) => {
  const style = block.style ?? 'classic'
  const tabs = (block.tabs ?? []).filter((t) => t.sections?.length)
  if (tabs.length === 0) return null
  const columns = style === 'seasons' ? ['Price'] : (block.columns ?? []).map((c) => c.label)
  const today = siteToday()
  const button = ctx.link(block.button) ?? club.header.booking
  const updated = pageUpdatedAt ? new Date(pageUpdatedAt) : null
  const fresh = updated ? today.getTime() - updated.getTime() < 90 * DAY : false

  // Phones (docs/design/13 v2, "Rate Row / Mobile"): each rate stacks, one line per price.
  const stacked = (section: Section) => (
    <div className="rate-stack" aria-hidden="true">
      {(section.rows ?? []).map((row, i) => (
        <div key={i} className="rate-stack-row">
          <p className="t-heading-m rate-stack-name">{row.label}</p>
          {row.subLabel ? <p className="t-body-s rate-sub">{row.subLabel}</p> : null}
          <dl>
            {prices(row, columns.length).map((p, k) => (
              <div key={k}>
                <dt className="t-body-s">{columns[k]}</dt>
                <dd className="t-data-serif">{p}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  )

  const table = (section: Section, caption: string) => (
    <>
      {stacked(section)}
      <div className="rate-scroll">
        <table className="rate-table">
          <caption className="visually-hidden">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="t-data-label">
                {style === 'matrix' ? 'Course' : 'Rate'}
              </th>
              {columns.map((c, i) => (
                <th key={i} scope="col" className="t-data-label rate-price">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(section.rows ?? []).map((row, i) => (
              <tr key={i}>
                <th scope="row">
                  <span className="t-data-sans">{row.label}</span>
                  {row.subLabel ? <span className="t-body-s rate-sub">{row.subLabel}</span> : null}
                </th>
                {prices(row, columns.length).map((p, k) => (
                  <td key={k} className="t-data-sans rate-price">
                    {p}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )

  const seasonCards = (tab: Tab) => {
    const sections = tab.sections ?? []
    // Phones show the current season first.
    const order = [...sections.keys()].sort(
      (a, b) =>
        Number(isCurrentSeason(sections[b], today)) - Number(isCurrentSeason(sections[a], today)),
    )
    return (
      <div className="rate-season-cards">
        {sections.map((s, i) => {
          const now = isCurrentSeason(s, today)
          return (
            <article
              key={i}
              className={`rate-season${now ? ' is-current' : ''}`}
              style={{ '--mobile-order': order.indexOf(i) } as CSSProperties}
            >
              <header className="rate-season-head">
                <div>
                  <h3 className="t-heading-m">{s.name}</h3>
                  {s.period ? <p className="t-body-s rate-sub">{s.period}</p> : null}
                </div>
                {now ? <span className="t-label-s rate-now">Now</span> : null}
              </header>
              <dl className="rate-season-list">
                {(s.rows ?? []).map((row, k) => (
                  <div key={k} className="rate-season-row">
                    <dt className="t-data-sans">{row.label}</dt>
                    <dd className="t-data-sans rate-price">{prices(row, 1)[0]}</dd>
                  </div>
                ))}
              </dl>
              {s.note ? <p className="t-body-s rate-note">{s.note}</p> : null}
            </article>
          )
        })}
      </div>
    )
  }

  const panels = tabs.map((tab, t) =>
    style === 'seasons' ? (
      seasonCards(tab)
    ) : (
      <div key={t} className="rate-lists">
        {(tab.sections ?? []).map((s, i) => (
          <div key={i}>{table(s, `${block.heading} — ${tab.label}`)}</div>
        ))}
      </div>
    ),
  )

  const stamp = updated ? (
    <p className="t-label-s rate-updated" data-volatile>
      {fresh ? <span className="rate-dot" aria-hidden="true" /> : null}
      Prices last updated{' '}
      {updated.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
    </p>
  ) : null

  const footer = (
    <div className="rate-footer">
      <div>
        {block.footnote ? <p className="t-body-s rate-footnote">{block.footnote}</p> : null}
        {stamp}
      </div>
      {button && style !== 'matrix' ? (
        <Button
          label={button.label}
          link={button.link}
          base={base}
          style={style === 'seasons' ? 'solid' : 'accent'}
          arrow
        />
      ) : null}
    </div>
  )

  const header = (
    <div className={`blk-header${style === 'seasons' ? '' : ' is-stacked'}`}>
      <div>
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        <h2 className="t-heading-l blk-heading">{block.heading}</h2>
        {block.intro ? <p className="t-body-m blk-intro rate-intro">{block.intro}</p> : null}
      </div>
    </div>
  )

  const switcher = (
    <Tabs
      labels={tabs.map((t) => t.label)}
      panels={panels}
      variant={style === 'classic' ? 'tabs' : 'segments'}
      label={block.heading}
    />
  )

  if (style === 'matrix') {
    const phone = block.showPhone !== false ? club.header.phone : null
    return (
      <section className="blk rate rate-matrix">
        <div className="blk-container rate-matrix-grid">
          <div>
            {header}
            {switcher}
            {footer}
          </div>
          <aside className="rate-aside on-brand">
            {block.asideEyebrow ? (
              <p className="t-eyebrow blk-eyebrow">{block.asideEyebrow}</p>
            ) : null}
            {block.asideHeading ? (
              <h3 className="t-heading-m rate-aside-heading">{block.asideHeading}</h3>
            ) : null}
            {block.included?.length ? (
              <ul className="rate-included t-body-s">
                {block.included.map((x, i) => (
                  <li key={i}>{x.item}</li>
                ))}
              </ul>
            ) : null}
            {button ? (
              <div className="rate-aside-cta">
                <Button label={button.label} link={button.link} base={base} style="accent" arrow />
              </div>
            ) : null}
            {phone ? (
              <a className="t-label-s rate-phone" href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>
                <Phone /> Or call {phone}
              </a>
            ) : null}
          </aside>
        </div>
      </section>
    )
  }

  return (
    <section className={`blk rate rate-${style}${style === 'seasons' ? ' on-subtle' : ''}`}>
      <div
        className={`blk-container${style === 'classic' ? ' rate-narrow' : ' rate-seasons-layout'}`}
      >
        {header}
        {switcher}
        {footer}
      </div>
    </section>
  )
}
