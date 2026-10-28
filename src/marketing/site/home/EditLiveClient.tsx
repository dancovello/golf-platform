'use client'

import { type CSSProperties, useId, useState } from 'react'

import type { HeroBlock } from '@/payload-types'
import { Hero } from '@/site/blocks/Hero'
import type { SiteMedia } from '@/site/blocks/media'
import type { BlockContext } from '@/site/blocks/resolve'
import type { ClubSite } from '@/site/loadClub'

import { DemoScaler } from '../../demo/DemoScaler'
import { Switch } from '../controls/interactive'
import { BrowserChrome } from '../parts'

export const EditLiveClient = ({
  hero,
  picture,
  club,
  domain,
  theme,
  toggleLabel,
}: {
  hero: HeroBlock
  picture: SiteMedia
  club: ClubSite
  domain: string
  theme: CSSProperties
  toggleLabel: string
}) => {
  const [eyebrow, setEyebrow] = useState(hero.eyebrow ?? '')
  const [headline, setHeadline] = useState(hero.headline)
  const [showSecondary, setShowSecondary] = useState(true)
  const id = useId()
  const ctx: BlockContext = {
    media: () => picture,
    link: (value) => {
      const label = (value as { label?: string } | null)?.label
      return label ? { label, link: { kind: 'url', href: '#' } } : null
    },
    document: () => null,
    person: () => null,
    course: () => null,
    courseStatus: null,
  }
  const live: HeroBlock = {
    ...hero,
    eyebrow,
    headline: headline || ' ',
    secondaryLink: showSecondary ? hero.secondaryLink : undefined,
  }
  return (
    <div className="mk-edit-live">
      <section className="mk-edit-card" aria-label="The editor (a demo: try typing)">
        <BrowserChrome address={`${domain}/admin`} />
        <div className="mk-editor">
          <p className="mk-editor-crumbs" aria-hidden="true">
            <span>Pages</span>
            <span>/</span>
            <span>Home</span>
            <span>/</span>
            <span className="mk-editor-crumb-current">Hero block</span>
          </p>
          <div className="mk-field">
            <label className="mk-field-label" htmlFor={`${id}-eyebrow`}>
              Eyebrow
            </label>
            <input
              id={`${id}-eyebrow`}
              className="mk-field-input mk-editor-input"
              value={eyebrow}
              maxLength={40}
              onChange={(event) => setEyebrow(event.target.value)}
            />
          </div>
          <div className="mk-field">
            <label className="mk-field-label" htmlFor={`${id}-headline`}>
              Headline
            </label>
            <input
              id={`${id}-headline`}
              className="mk-field-input mk-editor-input mk-editor-input--active"
              value={headline}
              maxLength={60}
              onChange={(event) => setHeadline(event.target.value)}
            />
          </div>
          <div className="mk-editor-toggle">
            <span id={`${id}-toggle`}>{toggleLabel}</span>
            <Switch label={toggleLabel} defaultChecked onChange={setShowSecondary} />
          </div>
          <div className="mk-editor-publish">
            <p className="mk-editor-saved">
              <span className="mk-live-dot" aria-hidden="true" />
              Live · saved just now
            </p>
            <span
              className="mk-button mk-button--primary mk-editor-publish-button"
              aria-hidden="true"
            >
              Publish
            </span>
          </div>
        </div>
      </section>
      <figure
        className="mk-demo mk-live-card"
        aria-label={`Demo club: the live site, showing “${headline}”`}
      >
        <BrowserChrome address={domain} />
        {/* Figma lays the hero out about 900px wide in this card (Edit Live Split, 180:2587). */}
        <DemoScaler designWidth={900}>
          <div className="club-theme mk-demo-club" style={theme} inert aria-hidden="true">
            <Hero block={live} ctx={ctx} club={club} base="" />
          </div>
        </DemoScaler>
      </figure>
    </div>
  )
}
