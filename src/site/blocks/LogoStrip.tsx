import type { CSSProperties } from 'react'

import type { LogoStripBlock } from '@/payload-types'

import { isSafeURL } from '@/fields/link'

import { isImage } from './parts'
import type { BlockContext } from './resolve'
import { NEW_TAB } from '../components/links'

type Partner = { name: string; url: string | null; logo: string | null }

/**
 * Partner / Logo Strip (docs/design/11), three styles: A Row (≤6), B Grid (ruled, beside an
 * intro), C Marquee (slow loop on the brand colour; pauses on hover/focus; still for reduced
 * motion). Logos sit in equal 180×72 boxes in one tone of the text colour (a CSS mask), full
 * strength on hover. Until a logo is uploaded the organisation's name stands in.
 */
export const LogoStrip = ({ block, ctx }: { block: LogoStripBlock; ctx: BlockContext }) => {
  const style = block.style ?? 'row'
  const partners: Partner[] = (block.partners ?? []).map((p) => {
    const m = ctx.media(p.logo)
    return {
      name: p.name,
      url: isSafeURL(p.url) ? p.url.trim() : null,
      logo: isImage(m) ? (m.srcSet?.split(', ')[0]?.split(' ')[0] ?? m.url) : null,
    }
  })
  if (partners.length === 0) return null
  const shown = style === 'row' ? partners.slice(0, 6) : partners

  const slot = (p: Partner, i: number, hidden = false) => {
    const inner = p.logo ? (
      <span
        className="ls-logo"
        role={hidden ? undefined : 'img'}
        aria-label={hidden ? undefined : p.name}
        // JSON.stringify quotes and escapes the address, so it can't end the CSS string early.
        style={{ '--logo': `url(${JSON.stringify(p.logo)})` } as CSSProperties}
      />
    ) : (
      <span className="ls-wordmark t-label-s">{p.name}</span>
    )
    return (
      <li
        key={`${hidden ? 'copy-' : ''}${i}`}
        className="ls-slot"
        aria-hidden={hidden || undefined}
      >
        {p.url ? (
          <a
            href={p.url}
            {...NEW_TAB}
            tabIndex={hidden ? -1 : undefined}
            aria-label={p.logo ? undefined : p.name}
          >
            {inner}
          </a>
        ) : (
          inner
        )}
      </li>
    )
  }

  if (style === 'marquee') {
    return (
      <section className="ls ls-marquee on-brand" aria-label={block.eyebrow ?? 'Partners'}>
        <div className="ls-marquee-viewport">
          <ul className="ls-marquee-track">
            {shown.map((p, i) => slot(p, i))}
            {/* The second copy makes the loop seamless; screen readers skip it. */}
            {shown.map((p, i) => slot(p, i, true))}
          </ul>
        </div>
      </section>
    )
  }

  if (style === 'grid') {
    return (
      <section className="blk ls ls-grid-block on-subtle">
        <div className="blk-container ls-grid-layout">
          <div>
            {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
            {block.heading ? <h2 className="t-heading-l blk-heading">{block.heading}</h2> : null}
            {block.intro ? <p className="t-body-s ls-intro">{block.intro}</p> : null}
          </div>
          <ul className="ls-grid">{shown.map((p, i) => slot(p, i))}</ul>
        </div>
      </section>
    )
  }

  return (
    <section className="ls ls-row-block" aria-label={block.eyebrow ?? 'Partners'}>
      <div className="blk-container">
        {block.eyebrow ? <p className="t-eyebrow ls-eyebrow">{block.eyebrow}</p> : null}
        <ul className="ls-row">{shown.map((p, i) => slot(p, i))}</ul>
      </div>
    </section>
  )
}
