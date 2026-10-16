/** Inviting editors and the super-admin's account actions (step 2.6). */
import { expect, openReady, test } from './fixtures'

test.describe('inviting a club editor', () => {
  test('invite → set password from the link → straight into two-factor set-up', async ({
    superAdminPage,
    browser,
  }) => {
    const email = `invited-${Date.now()}@example.com`

    await test.step('the super-admin invites them', async () => {
      await openReady(superAdminPage, '/admin/collections/users')
      // Check the button points at the invite page, then open it directly: on a slow CI machine
      // the admin's in-page navigation after the click sometimes never finished (seen twice).
      await expect(superAdminPage.getByRole('link', { name: 'Invite an editor' })).toHaveAttribute(
        'href',
        '/admin/invite-editor',
      )
      await openReady(superAdminPage, '/admin/invite-editor')
      await superAdminPage.getByLabel('Editor’s email address').fill(email)
      await superAdminPage.getByLabel('Club').selectOption({ label: 'Test Club A' })
      await superAdminPage.getByRole('button', { name: 'Invite editor' }).click()
      await expect(superAdminPage.getByLabel('Set-your-password link')).toHaveValue(
        /\/admin\/reset\//,
      )
    })
    const link = await superAdminPage.getByLabel('Set-your-password link').inputValue()

    const context = await browser.newContext()
    const page = await context.newPage()
    await test.step('a too-short password is refused', async () => {
      await openReady(page, link)
      await page.getByLabel('New Password').fill('short-pw')
      await page.getByLabel('Confirm Password').fill('short-pw')
      // Checked on the server's answer rather than the brief on-screen pop-up, which can come
      // and go at different moments when the machine is busy.
      const [answer] = await Promise.all([
        page.waitForResponse((r) => r.url().includes('/api/users/reset-password')),
        page.getByRole('button', { name: 'Reset Password' }).click(),
      ])
      expect(answer.status()).toBe(400)
      expect(await answer.text()).toContain('Passwords must be at least 12 characters.')
      await expect(page).toHaveURL(/\/admin\/reset\//)
    })
    await test.step('a good password logs them in and asks for two-factor set-up', async () => {
      await page.getByLabel('New Password').fill('a-long-invited-password')
      await page.getByLabel('Confirm Password').fill('a-long-invited-password')
      await page.getByRole('button', { name: 'Reset Password' }).click()
      await expect(page).toHaveURL(/\/admin\/setup-totp/)
    })
    await test.step('the link only works once', async () => {
      const reuse = await context.request.post('/api/users/reset-password', {
        data: { token: link.split('/admin/reset/')[1], password: 'yet-another-password' },
      })
      expect(reuse.status()).toBe(403)
    })
    await context.close()
  })

  test('an editor cannot open the invite page or make links', async ({ editorPage, world }) => {
    await editorPage.goto('/admin/invite-editor')
    await expect(editorPage.getByText('You are not allowed to access this page.')).toBeVisible()
    await expect(editorPage.getByLabel('Editor’s email address')).toHaveCount(0)
    const invite = await editorPage.request.post('/api/users/invite', {
      data: { email: 'sneaky@example.com', tenant: world.clubA.id },
    })
    expect(invite.status()).toBe(403)
    const link = await editorPage.request.post(
      `/api/users/${world.editorLinkTarget.id}/password-link`,
    )
    expect(link.status()).toBe(403)
  })
})

test.describe("account actions on an editor's page", () => {
  test('the super-admin can make a new set-your-password link', async ({
    superAdminPage,
    world,
  }) => {
    await openReady(superAdminPage, `/admin/collections/users/${world.editorLinkTarget.id}`)
    await superAdminPage.getByRole('button', { name: 'New set-your-password link' }).click()
    await expect(superAdminPage.getByLabel('Set-your-password link')).toHaveValue(
      /\/admin\/reset\//,
    )
  })

  test("editors don't see the account actions", async ({ editorPage }) => {
    await editorPage.goto('/admin/account')
    await expect(editorPage.getByText('Email', { exact: false }).first()).toBeVisible()
    await expect(editorPage.getByRole('heading', { name: 'Account actions' })).toHaveCount(0)
  })
})

test('public "Forgot password?" is off where email isn\'t set up', async ({ request, world }) => {
  for (const email of [world.editorA.email, 'nobody@example.com']) {
    const res = await request.post('/api/users/forgot-password', { data: { email } })
    expect(res.status()).toBe(403)
    expect(await res.text()).toContain('Ask your platform administrator')
  }
})
