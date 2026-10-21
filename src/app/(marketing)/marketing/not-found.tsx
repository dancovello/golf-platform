import Link from 'next/link'

export default function MarketingNotFound() {
  return (
    <main id="main">
      <section className="mk-section">
        <div className="mk-container">
          <header className="mk-section-header">
            <h1 className="mk-display-l">We can’t find that page.</h1>
            <p className="mk-body-l mk-secondary">
              It may have moved. <Link href="/">Go to the home page</Link>.
            </p>
          </header>
        </div>
      </section>
    </main>
  )
}
