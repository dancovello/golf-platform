import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// Trust, Accessibility statement, Changelog and the legal pages (plan phase 6.3), from the
// Figma copy (src/marketing/starter/pages.ts), against "Trust & security — Desktop" (187:6879),
// "Accessibility statement — Desktop" (212:8158) and "Changelog — Desktop" (187:6499). The seed
// publishes Trust and Changelog so they can be checked; the legal pages stay drafts.

const site = (path: string) => `http://marketing.localhost:3100${path}`

test('trust: four pillar cards in two rows, and nothing stated that isn’t true yet', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site('/trust'))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your members’ data,\nlooked after.',
  )
  const cards = page.locator('.mk-features--cards .mk-feature')
  await expect(cards.locator('h3')).toHaveText([
    'Accessibility',
    'Hosting',
    'Backups',
    'Data protection',
  ])
  // Figma: two cards a row, 24px apart, 32px padding.
  const [a, b, c] = await Promise.all([0, 1, 2].map((i) => cards.nth(i).boundingBox()))
  expect(Math.round(b!.x - (a!.x + a!.width))).toBe(24)
  expect(Math.round(c!.y)).toBeGreaterThan(Math.round(a!.y))
  await expect(cards.first().locator('.mk-feature-inner')).toHaveCSS('padding', '32px')
  await expect(page.getByRole('link', { name: /Read the statement/ })).toHaveAttribute(
    'href',
    '/accessibility',
  )
  await expect(page.getByRole('link', { name: /Ask for the DPA/ })).toHaveAttribute(
    'href',
    /^mailto:.*subject=Data%20processing%20agreement$/,
  )
  // Hand-off §6: no "Stored in London" until it's configured (N6), no restore window until the
  // Neon plan gives it (Q6), and no committee summary (removed 21 Oct).
  const main = page.locator('main')
  for (const banned of [/london/i, /last 7 days/i, /committee summary/i, /all systems/i]) {
    await expect(main).not.toContainText(banned)
  }
  await expect(page.locator('.mk-cta-actions a')).toHaveText(['Book a demo'])
})

test('accessibility statement: last reviewed line, read time, and the Figma text', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site('/accessibility'))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Accessibility statement')
  const meta = page.locator('.mk-reviewed')
  await expect(meta).toHaveText('Last reviewed 14 October 2026 · 1 minute read')
  await expect(meta.locator('time')).toHaveAttribute('datetime', '2026-10-14')
  await expect(meta).toHaveCSS('color', 'rgb(138, 150, 143)')
  // Figma 212:8194: header, meta and text 48px apart.
  const header = await page.locator('.mk-header').boundingBox()
  const metaBox = await meta.boundingBox()
  expect(Math.round(metaBox!.y - (header!.y + header!.height))).toBe(48)
  await expect(page.getByRole('heading', { level: 2 })).toContainText([
    'Our commitment',
    'Known issues',
  ])
  await expect(page.locator('.mk-prose ul li')).toHaveCount(4)
  await expect(page.locator('.mk-prose blockquote')).toHaveText(
    'We design accessibility into each block from the start.',
  )
  // "Designed to meet", never "built to" (hand-off §6).
  await expect(page.locator('main')).toContainText('designed to meet WCAG 2.2 AA')
  await expect(page.locator('main')).not.toContainText(/built to meet/i)
  await expect(page.locator('.mk-cta-actions a').first()).toHaveAttribute('href', /^mailto:/)
})

test('changelog: the empty state and three Coming next roadmap cards', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(site('/changelog'))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('What’s new.')
  await expect(page.locator('.mk-roadmap-empty h2')).toHaveText(
    'Nothing has shipped to a club yet.',
  )
  await expect(page.locator('.mk-roadmap-empty')).toHaveCSS('padding', '56px 48px')
  const cards = page.locator('.mk-roadmap-card')
  await expect(cards).toHaveCount(3)
  await expect(cards.locator('.mk-badge')).toHaveText(['Coming next', 'Coming next', 'Coming next'])
  await expect(cards.first()).toHaveCSS('padding', '28px')
  const [a, b] = await Promise.all([cards.nth(0).boundingBox(), cards.nth(1).boundingBox()])
  expect(Math.round(b!.x - (a!.x + a!.width))).toBe(24)
  expect(Math.round(a!.y)).toBe(Math.round(b!.y))
  // Kept out of the nav and footer (Q7).
  await expect(
    page.locator('.mk-nav, .mk-footer').getByRole('link', { name: 'Changelog' }),
  ).toHaveCount(0)
})

test('legal pages: drafts until Dan’s wording is in, and the footer leaves them out', async ({
  page,
}) => {
  for (const path of ['/privacy', '/cookies', '/terms']) {
    const response = await page.goto(site(path))
    expect(response?.status()).toBe(404)
  }
  await page.goto(site('/trust'))
  const footer = page.locator('.mk-footer')
  await expect(footer.getByRole('list', { name: 'Legal' })).toHaveCount(0)
  // Published pages are still linked.
  await expect(footer.getByRole('link', { name: 'Accessibility' })).toHaveAttribute(
    'href',
    '/accessibility',
  )
  await expect(footer.getByRole('link', { name: 'Security' })).toHaveAttribute('href', '/trust')
})

for (const path of ['/trust', '/accessibility', '/changelog']) {
  for (const width of [1440, 390]) {
    test(`${path}: no accessibility problems or sideways scroll at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(site(path))
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      expect(results.violations).toEqual([])
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      )
      expect(overflow).toBeLessThanOrEqual(0)
    })
  }
}
