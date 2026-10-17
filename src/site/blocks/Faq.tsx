import type { FaqBlock } from '@/payload-types'

import { ArrowRight, Clock, Mail, Phone } from '../components/Icons'
import { linkTarget, siteHref } from '../components/links'
import type { ClubSite } from '../loadClub'
import { FaqSearch } from './FaqSearch'
import { type FaqItem, faqID } from './faqShared'
import { TextLink } from './parts'
import type { BlockContext } from './resolve'

/** schema.org FAQPage data for search engines, from the same questions. Escaped so no text
 * can close the script tag. */
const structuredData = (items: FaqItem[]) =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({
      '@type': 'Question',
      name: i.question,
      acceptedAnswer: { '@type': 'Answer', text: i.answer },
    })),
  }).replace(/</g, '\\u003c')

/**
 * FAQ / Accordion (docs/design/11), three styles: A Centred (one 800px column, contact prompt
 * below), B With contact (sticky intro and contact card beside the list), C Search & topics.
 * Items are native <details> (keyboard and screen readers for free; several can be open).
 */
export const Faq = ({
  block,
  ctx,
  club,
  base,
}: {
  block: FaqBlock
  ctx: BlockContext
  club: ClubSite
  base: string
}) => {
  const style = block.style ?? 'centred'
  const items: FaqItem[] = (block.items ?? []).map((i) => ({
    question: i.question,
    answer: i.answer,
    topic: i.topic?.trim() || null,
  }))
  if (items.length === 0) return null
  const firstOpen = block.firstOpen !== false
  const contact = ctx.link(block.contactLink)

  const header = (
    <div className={`blk-header${style === 'centred' ? ' is-centred' : ''}`}>
      <div>
        {block.eyebrow ? <p className="t-eyebrow blk-eyebrow">{block.eyebrow}</p> : null}
        <h2 className="t-heading-l blk-heading">{block.heading}</h2>
      </div>
    </div>
  )

  const list = (
    <div className="faq-list">
      {items.map((item, i) => (
        <details key={i} id={faqID(item.question)} className="faq-item" open={firstOpen && i === 0}>
          <summary className="t-body-l">{item.question}</summary>
          <div className="faq-answer t-body-m">
            {item.answer.split(/\n\s*\n/).map((p, k) => (
              <p key={k}>{p}</p>
            ))}
          </div>
        </details>
      ))}
    </div>
  )

  const jsonLd = (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: structuredData(items) }}
    />
  )

  if (style === 'withContact') {
    const phone = club.header.phone
    const hours = club.footer.hours[0]
    return (
      <section className="blk faq faq-contact on-subtle">
        {jsonLd}
        <div className="blk-container faq-contact-grid">
          <div className="faq-intro">
            {header}
            <div className="faq-card">
              {block.cardHeading ? (
                <h3 className="t-heading-m faq-card-heading">{block.cardHeading}</h3>
              ) : null}
              <ul className="faq-card-lines t-body-s">
                {phone ? (
                  <li>
                    <Phone /> <a href={`tel:${phone.replace(/[^+0-9]/g, '')}`}>{phone}</a>
                  </li>
                ) : null}
                {club.footer.email ? (
                  <li>
                    <Mail /> <a href={`mailto:${club.footer.email}`}>{club.footer.email}</a>
                  </li>
                ) : null}
                {hours ? (
                  <li>
                    <Clock /> {hours.place}, {hours.times}
                  </li>
                ) : null}
              </ul>
              {contact ? (
                <a
                  className="btn btn-outline t-label-button"
                  href={siteHref(base, contact.link)}
                  {...linkTarget(contact.link)}
                >
                  {contact.label} <ArrowRight />
                </a>
              ) : null}
            </div>
          </div>
          {list}
        </div>
      </section>
    )
  }

  if (style === 'searchTopics') {
    return (
      <section className="blk faq faq-search-block">
        {jsonLd}
        <div className="blk-container faq-narrow faq-search-layout">
          {header}
          <FaqSearch
            items={items}
            firstOpen={firstOpen}
            emptyContact={
              contact ? { href: siteHref(base, contact.link), label: contact.label } : null
            }
          />
        </div>
      </section>
    )
  }

  return (
    <section className="blk faq faq-centred">
      {jsonLd}
      <div className="blk-container faq-column">
        {header}
        {list}
        {contact ? (
          <p className="t-body-s faq-prompt">
            Still have a question? <TextLink link={contact} base={base} />
          </p>
        ) : null}
      </div>
    </section>
  )
}
