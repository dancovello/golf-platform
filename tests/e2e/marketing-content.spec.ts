import { expect, test } from './fixtures'

// The company website's content (plan phase 1.2). tests/e2e/seed-world.ts adds a published
// page (/e2e-pricing) and a draft (/e2e-draft).

const site = (path = '/') => `http://marketing.localhost:3100${path}`
const MARKETING_ONLY = 'Marketing-only sentence for the browser tests.'

test('a published page shows on the company domain; a draft doesn’t', async ({ page }) => {
  const response = await page.goto(site('/e2e-pricing'))
  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('One clear price')
  await expect(page.getByText(MARKETING_ONLY)).toBeVisible()
  await expect(page).toHaveTitle('E2E pricing | Brandname')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'One price for your club, shown in full.',
  )
  await expect(page.getByRole('main').getByRole('link', { name: 'Book a demo' })).toHaveAttribute(
    'href',
    '/book-a-demo',
  )

  const draft = await page.goto(site('/e2e-draft'))
  expect(draft?.status()).toBe(404)
  expect(await page.content()).not.toContain('Not published yet')
})

test("club A's editor can't reach it through the API", async ({ editorPage }) => {
  for (const path of [
    '/api/marketing-pages',
    '/api/marketing-media',
    '/api/globals/marketing-settings',
  ]) {
    const response = await editorPage.request.get(path)
    expect(response.status(), path).toBe(403)
    expect(await response.text(), path).not.toContain(MARKETING_ONLY)
  }
  const created = await editorPage.request.post('/api/marketing-pages', {
    data: { title: 'Sneaky', slug: 'sneaky', _status: 'published' },
  })
  expect(created.status()).toBe(403)
})

test("club A's editor doesn't see it in the admin", async ({ editorPage }) => {
  await editorPage.goto('/admin')
  await expect(editorPage.getByRole('navigation').first()).toBeVisible()
  await expect(editorPage.getByText('Company website')).toHaveCount(0)
  // A direct request rather than a page visit: the page view keeps a stream open, which the
  // leak watcher waits on until the test times out.
  const direct = await editorPage.request.get('/admin/collections/marketing-pages')
  expect(await direct.text()).not.toContain('E2E pricing')
})

test('the super-admin sees it in the admin', async ({ superAdminPage }) => {
  await superAdminPage.goto('/admin/collections/marketing-pages')
  await expect(superAdminPage.getByText('E2E pricing').first()).toBeVisible()
  await superAdminPage.goto('/admin/globals/marketing-settings')
  await expect(superAdminPage.getByLabel('Price a month (£)')).toHaveValue('149')
})
