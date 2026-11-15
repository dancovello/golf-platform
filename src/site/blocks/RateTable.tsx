import type { CSSProperties } from 'react'

import type { RateTableBlock } from '@/payload-types'

import { Button } from '../components/Button'
import { Phone } from '../components/Icons'
import type { ClubSite } from '../loadClub'
import { siteToday } from '../today'
import type { BlockContext } from './resolve'
import { isCurrentSeason, priceListPhase, ukLongDate, visibleLists } from './seasons'
import { Tabs } from './Tabs'

type Tab = NonNullable<RateTableBlock['tabs']>[number]
type Section = NonNullable<Tab['sections']>[number]

const prices = (row: NonNullable<Section['rows']>[number], count: number) =>
  [row.price1, row.price2, row.price3, row.price4].slice(0, count).map((p) => p?.trim() || '—')

const DAY = 24 * 60 * 60 * 1000

/** A list that is shown before its "valid from" day (G2), with that day. */
const fromLine = (s: Section) =>
  s.validFrom ? `These prices apply from ${ukLongDate(s.validFrom)}.` : null

/**
 * The tabs and price lists to show today (G2): expired lists dropped, upcoming ones only when
 * the club shows them early, and tabs left empty dropped. Style A's tabs are seasons, so the
 * "show the next list rather than nothing" rule looks across all tabs; in B and C each tab is an
 * audience with its own seasons, so it applies tab by tab.
 */
const datedTabs = (block: RateTableBlock, today: Date) => {
  const style = block.style ?? 'classic'
  const early = Boolean(block.showUpcoming)
  const tabs = (block.tabs ?? []).filter((t) => t.sections?.length)
  const keep = (tab: Tab, shown: Set<Section>, upcoming: Set<Section>) => ({
    ...tab,
    sections: (tab.sections ?? []).filter((s) => shown.has(s)),
    upcoming,
  })
  if (style === 'classic') {
    const all = tabs.flatMap((t) => t.sections ?? [])
    const shown = visibleLists(all, today, early)
    const set = new Set(shown.map((v) => v.list))
    const upcoming = new Set(shown.filter((v) => v.upcoming).map((v) => v.list))
    return tabs.map((t) => keep(t, set, upcoming)).filter((t) => t.sections.length > 0)
  }
  return tabs
    .map((t) => {
      const shown = visibleLists(t.sections ?? [], today, early)
      return keep(
        t,
        new Set(shown.map((v) => v.list)),
        new Set(shown.filter((v) => v.upcoming).map((v) => v.list)),
      )
    })
    .filter((t) => t.sections.length > 0)
}

/** A season card is "Now" by its dates when it has them, otherwise by its months. */
const isNow = (s: Section, today: Date) =>
  s.validFrom || s.validUntil ? priceListPhase(s, today) === 'current' : isCurrentSeason(s, today)

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
  const today = siteToday()
  const tabs = datedTabs(block, today)
  if (tabs.length === 0) return null
  const columns = style === 'seasons' ? ['Price'] : (block.columns ?? []).map((c) => c.label)
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

  const table = (section: Section, caption: string, upcoming: boolean) => (
    <>
      {upcoming && fromLine(section) ? (
        <p className="t-label-s rate-from">{fromLine(section)}</p>
      ) : null}
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

  const seasonCards = (tab: (typeof tabs)[number]) => {
    const sections = tab.sections
    // Phones show the current season first.
    const order = [...sections.keys()].sort(
      (a, b) => Number(isNow(sections[b], today)) - Number(isNow(sections[a], today)),
    )
    return (
      <div className="rate-season-cards">
        {sections.map((s, i) => {
          const now = isNow(s, today)
          const from = tab.upcoming.has(s) ? fromLine(s) : null
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
                  {from ? <p className="t-label-s rate-from">{from}</p> : null}
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
        {tab.sections.map((s, i) => (
          <div key={i}>{table(s, `${block.heading} — ${tab.label}`, tab.upcoming.has(s))}</div>
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
      // Style A opens on the season in force today, not simply the first tab.
      initial={
        style === 'classic'
          ? Math.max(
              0,
              tabs.findIndex((t) => t.sections.some((s) => !t.upcoming.has(s))),
            )
          : 0
      }
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
