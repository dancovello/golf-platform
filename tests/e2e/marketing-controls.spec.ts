import AxeBuilder from '@axe-core/playwright'

import { expect, test } from './fixtures'

// The marketing controls (plan phase 2.1), on the super-admin's review page /dev/components.
// Sizes and behaviour come from the Figma "Marketing · Controls" section and its neighbours.

const REVIEW = '/dev/components'

test('only the signed-in super-admin can see the review page', async ({ request, editorPage }) => {
  expect((await request.get(REVIEW, { maxRedirects: 0 })).status()).toBe(404)
  expect((await editorPage.goto(REVIEW))?.status()).toBe(404)
  // Never on the company domain, even for the super-admin.
  const company = await request.get(`http://marketing.localhost:3100${REVIEW}`, {
    maxRedirects: 0,
  })
  expect(company.status()).toBe(404)
})

test('controls have the Figma sizes', async ({ superAdminPage: page }) => {
  await page.goto(REVIEW)
  const size = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => {
        const box = el.getBoundingClientRect()
        return [Math.round(box.width), Math.round(box.height)]
      })
  expect((await size('.mk-button--primary'))[1]).toBe(36)
  expect(await size('.mk-icon-button')).toEqual([36, 36])
  expect(await size('.mk-switch')).toEqual([40, 24])
  expect(await size('.mk-slot > span')).toEqual([96, 40])
  expect(
    await page
      .locator('.mk-button--ghost')
      .first()
      .evaluate((el) => getComputedStyle(el).color),
  ).toBe('rgb(163, 173, 166)')
})

test('controls work from the keyboard and say what they are', async ({ superAdminPage: page }) => {
  await page.goto(REVIEW)

  const sw = page.getByRole('switch', { name: 'No-show fee' })
  await expect(sw).toHaveAttribute('aria-checked', 'false')
  await sw.focus()
  await page.keyboard.press('Space')
  await expect(sw).toHaveAttribute('aria-checked', 'true')
  await expect(page.getByRole('switch', { name: 'Off, disabled' })).toBeDisabled()

  const tabs = page.getByRole('tablist', { name: 'Facilities' })
  await tabs.getByRole('tab', { name: 'Range' }).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.getByRole('tab', { name: 'Activities' })).toBeFocused()
  await expect(tabs.getByRole('tab', { name: 'Activities' })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  const sizes = page.getByRole('radiogroup', { name: 'Screen size' })
  await sizes.getByRole('radio', { name: 'Desktop' }).focus()
  await page.keyboard.press('End')
  await expect(sizes.getByRole('radio', { name: 'Mobile' })).toHaveAttribute('aria-checked', 'true')

  const faq = page.getByRole('button', { name: 'Who owns our content?' })
  await expect(faq).toHaveAttribute('aria-expanded', 'false')
  await faq.click()
  await expect(faq).toHaveAttribute('aria-expanded', 'true')
  await expect(page.getByText('You do.')).toBeVisible()

  // A taken time is disabled and struck through, not only greyed.
  const taken = page.getByRole('radio', { name: /14:00/ })
  await expect(taken).toBeDisabled()
  expect(
    await page
      .locator('.mk-slot input:disabled + span')
      .evaluate((el) => getComputedStyle(el).textDecorationLine),
  ).toBe('line-through')

  // Errors are tied to their field.
  await expect(page.locator('#review-club-error')).toHaveAttribute(
    'aria-describedby',
    'review-club-error-error',
  )
})

test('no accessibility problems axe can find on the review page', async ({
  superAdminPage: page,
}) => {
  await page.goto(REVIEW)
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    // The disabled examples are meant to look disabled.
    .exclude('[disabled]')
    .analyze()
  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`),
  ).toEqual([])
})
