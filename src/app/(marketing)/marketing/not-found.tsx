import { CtaBand, SectionHeader } from '@/marketing/site/MarketingBlocks'

/** Not designed: a Section Header and a CTA Band, in plain words (hand-off §6). */
export default function MarketingNotFound() {
  return (
    <main id="main">
      <section className="mk-section">
        <div className="mk-container">
          <SectionHeader
            size="page"
            block={{
              eyebrow: 'Page not found',
              title: 'We can’t find that page.',
              subhead: 'It may have moved. The links below will take you somewhere useful.',
              align: 'left',
            }}
          />
        </div>
      </section>
      <section className="mk-section mk-section--cta">
        <div className="mk-container">
          <CtaBand
            block={{
              title: 'Start with the home page.',
              subhead: null,
              primary: { label: 'Go to the home page', href: '/' },
              secondary: { label: 'Book a demo', href: '/book-a-demo' },
            }}
          />
        </div>
      </section>
    </main>
  )
}
