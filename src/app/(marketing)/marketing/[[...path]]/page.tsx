import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { BRAND } from '@/brand'
import { HomeIntro } from '@/marketing/intro/HomeIntro'
import { publishedMarketingPage } from '@/marketing/content'
import { jsonForScript, organizationJsonLd, pagePath } from '@/marketing/seo'
import { MarketingBlocks, SectionHeader } from '@/marketing/site/MarketingBlocks'

// Every page view gets a fresh one-time script code (src/security/csp.ts), which only works on
// pages rendered for each visit, as club sites are.
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ path?: string[] }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await publishedMarketingPage((await params).path ?? [])
  if (!page) return {}
  const title = page.meta?.title || page.title
  const description = page.meta?.description || undefined
  const path = pagePath(page.slug)
  return {
    // The home page's title is the company name alone.
    title: page.slug === 'home' ? { absolute: title } : title,
    description,
    alternates: { canonical: path },
    // A page's own tags replace the layout's wholesale, so the shared ones are repeated here.
    openGraph: {
      title: page.slug === 'home' ? title : `${title} | ${BRAND.name}`,
      description,
      url: path,
      siteName: BRAND.name,
      locale: 'en_GB',
      type: 'website',
    },
    twitter: { card: 'summary' },
  }
}

/** A published marketing page (src/marketing/content.ts), or a holding page for the home page
 * until one is published. */
export default async function MarketingPage({ params }: Props) {
  const path = (await params).path ?? []
  const page = await publishedMarketingPage(path)
  // The golf ball intro (src/marketing/intro/HomeIntro.tsx) is on the homepage only.
  const intro = path.length === 0 ? <HomeIntro /> : null
  if (page) {
    return (
      <>
        {intro}
        <main id="main">
          {page.slug === 'home' ? (
            // The company's details for search engines: data only, so it needs no script code.
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: jsonForScript(organizationJsonLd()) }}
            />
          ) : null}
          <MarketingBlocks blocks={page.layout ?? []} />
        </main>
      </>
    )
  }
  if (path.length > 0) notFound()
  return (
    <>
      {intro}
      <main id="main">
        <section className="mk-section">
          <div className="mk-container">
            <SectionHeader
              size="page"
              block={{
                eyebrow: null,
                title: 'Your club is better than your website.',
                subhead: `Our website is on its way. To talk to us now, email ${BRAND.email}.`,
                align: 'left',
              }}
            />
          </div>
        </section>
      </main>
    </>
  )
}
