import type { CSSProperties } from 'react'
import { notFound } from 'next/navigation'

import { fontSetVariables } from '../../fonts'
import { loadClubBySlug } from '@/site/loadClub'
import { sitePreviewEnabled } from '@/site/preview'
import { brandCSSVariables } from '@/theme/colour'
import { FONT_SETS } from '@/theme/fontSets'

import '@/theme/theme.css'
import './preview.css'

export const dynamic = 'force-dynamic'

const roles = [
  'surface-canvas',
  'surface-raised',
  'surface-subtle',
  'surface-brand',
  'action-accent',
  'action-solid',
  'text-primary',
  'text-secondary',
  'text-brand',
  'text-accent',
  'border-subtle',
  'border-strong',
]

const typeStyles: [string, string][] = [
  ['t-display-xl', 'Display XL'],
  ['t-display-l', 'Display L'],
  ['t-display-caps', 'Display Caps'],
  ['t-heading-l', 'Heading L'],
  ['t-heading-m', 'Heading M'],
  ['t-heading-caps', 'Heading Caps'],
  ['t-quote-m', 'Quote M'],
  ['t-body-l', 'Body L'],
  ['t-body-m', 'Body M'],
  ['t-label-button', 'Button label'],
  ['t-data-sans', 'Data'],
]

/** A club's colours and fonts on one page, so a font set or palette can be judged on screen. */
export default async function ClubPreview({ params }: { params: Promise<{ club: string }> }) {
  if (!sitePreviewEnabled()) notFound()
  const club = await loadClubBySlug((await params).club)
  if (!club) notFound()

  const theme = {
    ...brandCSSVariables(club.brand),
    ...fontSetVariables(club.fontSet),
  } as CSSProperties

  return (
    <div className="club-theme pv" style={theme}>
      <header className="pv-band">
        <p className="t-heading-caps">{club.name}</p>
        <nav className="t-nav pv-nav">
          <span>The Course</span>
          <span>Visitors</span>
          <span>Membership</span>
          <span>Contact</span>
        </nav>
      </header>

      <section className="pv-hero">
        <p className="t-eyebrow pv-eyebrow">Founded 1892 · Heathland</p>
        <h1 className="t-display-xl">A round worth travelling for</h1>
        <p className="t-body-l pv-muted">
          Eighteen holes through pine and heather, a clubhouse that welcomes visitors, and greens
          kept fast all year.
        </p>
        <div className="pv-buttons">
          <span className="pv-button pv-accent t-label-button">Book a tee time</span>
          <span className="pv-button pv-solid t-label-button">Membership</span>
          <span className="pv-button pv-outline t-label-button">Visitors</span>
        </div>
      </section>

      <section className="pv-section">
        <p className="t-eyebrow pv-eyebrow">Font set</p>
        <h2 className="t-heading-l">{FONT_SETS[club.fontSet].label}</h2>
        <div className="pv-type">
          {typeStyles.map(([className, label]) => (
            <div key={className} className="pv-type-row">
              <span className="t-data-label pv-muted">{label}</span>
              <span className={className}>
                {className === 't-data-sans'
                  ? 'Par 72 · 7,174 yds · £95'
                  : 'The 7th, over the burn'}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="pv-band pv-band-tall">
        <p className="t-eyebrow pv-eyebrow-inverse">On the brand colour</p>
        <p className="t-quote-l">“The finest heathland finish in the south.”</p>
        <p className="t-body-m pv-inverse-muted">Supporting text on dark stays readable.</p>
      </section>

      <section className="pv-section">
        <p className="t-eyebrow pv-eyebrow">Colour roles</p>
        <div className="pv-swatches">
          {roles.map((role) => (
            <div key={role} className="pv-swatch">
              <span style={{ background: `var(--color-${role})` }} />
              <span className="t-body-s">{role}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
