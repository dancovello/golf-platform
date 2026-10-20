import { expect, test } from './fixtures'

// Both test clubs have accepted the agreement (tests/int/helpers/seed.ts): Alice for club A,
// Bob for club B. The save rule itself is tested in tests/int/agreement.int.spec.ts.
test("an editor sees their club's acceptance, never another club's", async ({
  editorPage: page,
}) => {
  await page.goto('/admin')
  await expect(page.getByText('Data processing agreement', { exact: true }).first()).toBeVisible()
  await page.goto('/admin/collections/agreement-acceptances')
  await expect(page.getByText('Alice Secretary')).toBeVisible()
  await expect(page.getByText('Bob Secretary')).toHaveCount(0)
})

test('the accept form shows the agreement with the club named in it', async ({
  editorPage: page,
}) => {
  await page.goto('/admin/collections/agreement-acceptances/create')
  const text = page.getByRole('region', { name: 'Agreement text' })
  await expect(text).toContainText('Test Club A')
  await expect(text).toContainText('Schedule 3: Sub-processors')
  await expect(page.getByText('Draft wording, awaiting legal review.')).toBeVisible()
  await expect(page.getByLabel('Your full name')).toBeVisible()
  await expect(
    page.getByLabel('I confirm I have authority to accept this agreement on behalf of the club.'),
  ).toBeVisible()
})

test('Club Settings shows no warning once the club has accepted', async ({ editorPage: page }) => {
  await page.goto('/admin/collections/club-settings')
  await page.waitForLoadState('networkidle')
  await expect(
    page.getByText('Your club needs to accept the data processing agreement'),
  ).toHaveCount(0)
})
