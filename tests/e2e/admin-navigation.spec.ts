import { expect, openReady, test } from './fixtures'

// The "Parent page" picker offers only the editor's own club's pages. The fixture also fails
// the test if any response sent to the browser mentions club B (tests/e2e/fixtures.ts).
test("club A's editor picks a parent page from club A's pages only", async ({
  editorPage: page,
  world,
}) => {
  await openReady(page, '/admin/collections/pages/create')
  await expect(page.getByText('Parent page (optional)')).toBeVisible()
  // The picker shows 10 pages at a time, so search for each one by name.
  const picker = page.getByRole('combobox')
  await picker.click()
  await picker.pressSequentially(world.pageB.title)
  await expect(page.getByText('No options')).toBeVisible()
  await picker.clear()
  await picker.pressSequentially(world.pageA.title)
  await expect(page.getByRole('option', { name: world.pageA.title })).toBeVisible()
  await expect(page.getByRole('option', { name: world.pageB.title })).toHaveCount(0)
})

test('Club Settings shows the menu choices', async ({ editorPage: page, world }) => {
  await openReady(page, `/admin/collections/club-settings/${world.settingsA.id}`)
  await page.getByRole('button', { name: 'Header and menu' }).click()
  await page.getByRole('button', { name: 'Add Menu item' }).click()
  // Rows start folded, labelled with their text ("Menu item N" until they have some).
  await expect(page.getByText(/^Menu item \d+$/)).toBeVisible()
  await page.getByRole('button', { name: 'Show All' }).first().click()
  await expect(page.getByText('What it does').first()).toBeVisible()
})
