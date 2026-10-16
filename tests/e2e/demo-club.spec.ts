import { expect, test } from './fixtures'

// The demo club itself is built and checked in tests/int/demo-club.int.spec.ts. These check
// who may press the button: `?check=1` stops after the checks, so nothing is built here.
const check = '/api/demo-club?check=1'

test('only a super-admin, with their code entered, may build the demo club', async ({
  superAdminPage,
  editorPage,
  playwright,
}) => {
  expect((await superAdminPage.request.post(check)).status()).toBe(200)
  expect((await editorPage.request.post(check)).status()).toBe(403)
  const visitor = await playwright.request.newContext({ baseURL: 'http://localhost:3100' })
  expect((await visitor.post(check)).status()).toBe(403)
  await visitor.dispose()
})

test('another website can’t trigger it, even with the super-admin signed in', async ({
  superAdminPage,
}) => {
  const response = await superAdminPage.request.post(check, {
    headers: { origin: 'https://evil.example' },
  })
  expect(response.status()).toBe(403)
})

test('the Clubs list has the button for the super-admin', async ({ superAdminPage }) => {
  await superAdminPage.goto('/admin/collections/tenants')
  await expect(superAdminPage.getByRole('button', { name: 'Create demo club' })).toBeVisible()
})
