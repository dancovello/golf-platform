import AxeBuilder from '@axe-core/playwright'

import { MIN_FILL_MS } from '@/site/contact/formToken'

import { expect, test } from './fixtures'

// Test Club A's Contact page: no membership types or reply names set, so the defaults show.
const contact = '/preview/test-club-a/contact'

const axe = async (page: import('@playwright/test').Page) =>
  (
    await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
  ).violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)

// A person takes more than a few seconds to fill the form in; anything quicker is treated as a
// bot and quietly dropped (src/site/contact/formToken.ts), so the tests wait like a person.
const likeAPerson = () => new Promise((resolve) => setTimeout(resolve, MIN_FILL_MS + 500))

test('the topic decides the extra questions', async ({ page }) => {
  await page.goto(contact)
  await expect(page).toHaveTitle('Contact | Test Club A')
  await expect(page.getByRole('radio', { name: 'General enquiry' })).toBeChecked()
  await expect(page.getByLabel('Membership type')).toHaveCount(0)

  await page.getByRole('radio', { name: 'Visitor golf & societies' }).check()
  await expect(page.getByLabel('Date you’d like to play')).toBeVisible()
  await expect(page.getByLabel('Number of players')).toBeVisible()

  await page.getByRole('radio', { name: 'Events & weddings' }).check()
  await expect(page.getByLabel('Event date')).toBeVisible()
  await expect(page.getByLabel('Number of guests')).toBeVisible()
  expect(await axe(page)).toEqual([])
})

test('shows what to fix, keeps what was typed, then sends', async ({ page }) => {
  test.slow()
  await page.goto(`${contact}?about=membership`)
  await expect(page.getByRole('radio', { name: 'Membership', exact: true })).toBeChecked()

  await page.getByLabel('Full name').fill('Dan Visitor')
  const email = page.getByLabel('Email address')
  await email.fill('dan@example')
  // Checked on leaving the field, not while typing.
  await expect(page.getByText('Enter an email address like name@example.com')).toHaveCount(0)
  await email.blur()
  await expect(page.getByText('Enter an email address like name@example.com')).toBeVisible()
  await page.getByLabel('Membership type').fill('Five-day')
  await likeAPerson()
  await page.getByRole('button', { name: 'Send message' }).click()

  // (Next.js has its own, empty, alert region for page changes.)
  const summary = page.getByRole('alert').filter({ hasText: 'to fix' })
  await expect(summary).toContainText('There are 2 things to fix')
  await expect(summary).toBeFocused()
  await expect(page.getByLabel('Full name')).toHaveValue('Dan Visitor')
  await expect(page.getByLabel('Membership type')).toHaveValue('Five-day')
  await expect(email).toHaveAttribute('aria-invalid', 'true')
  expect(await axe(page)).toEqual([])
  await summary.getByRole('link', { name: 'Tell us how we can help' }).click()
  await expect(page.getByLabel('Your message')).toBeFocused()

  await page.getByLabel('Your message').fill('Is there a waiting list?')
  // Fixed once you leave the field; the character count comes back in place of the error.
  await page.getByLabel('Your message').blur()
  await expect(page.getByLabel('Your message')).not.toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('24 / 1,000 characters')).toBeVisible()
  await email.fill('dan@example.com')
  await page.getByRole('button', { name: 'Send message' }).click()

  const heading = page.getByRole('heading', { name: 'Thanks, Dan — your message is with us' })
  await expect(heading).toBeFocused()
  await expect(page.getByRole('status')).toContainText(
    /Someone from the club will reply to dan@example\.com by \w+day \d+ \w+\. Your reference is TCA-ENQ-\d{4}\./,
  )
  await expect(page.getByRole('status')).toContainText('About: Membership')
  await expect(page.getByRole('status')).toContainText('“Is there a waiting list?”')
  expect(await axe(page)).toEqual([])

  await page.getByRole('link', { name: 'Send another message' }).click()
  await expect(page.getByLabel('Full name')).toHaveValue('')
})
