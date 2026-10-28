import { expect, openReady, test } from './fixtures'

// The club home screen above the dashboard (plan part E). The editorPage fixture also fails
// the test if anything of club B reaches club A's editor.

test("club A's editor sees their own club's home screen", async ({ editorPage: page, world }) => {
  await openReady(page, '/admin')
  await expect(page.getByRole('heading', { level: 1, name: world.clubA.name })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Everyday jobs' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Update the course status' })).toBeVisible()
  await expect(page.getByRole('region', { name: /^Messages/ })).toBeVisible()
  await expect(page.getByRole('region', { name: 'Clubs' })).toHaveCount(0)
  expect(await page.content()).not.toContain(world.clubB.name)
})

test("the super-admin sees every club's setup progress", async ({
  superAdminPage: page,
  world,
}) => {
  await openReady(page, '/admin')
  const clubs = page.getByRole('region', { name: 'Clubs' })
  await expect(clubs).toBeVisible()
  await expect(clubs.getByRole('link', { name: world.clubA.name })).toBeVisible()
  await expect(clubs.getByRole('link', { name: world.clubB.name })).toBeVisible()
  await expect(clubs).toContainText('of 6 done')
})

test("the Pages list shows club A's pages as a tree, and nothing of club B", async ({
  editorPage: page,
  world,
}) => {
  await openReady(page, '/admin/collections/pages')
  const tree = page.locator('details', { hasText: 'Your pages, as they sit on the site' })
  await expect(tree).toBeVisible()
  await expect(tree.getByRole('link', { name: world.pageA.title })).toBeVisible()
  await expect(tree).not.toContainText(world.pageB.title)
})
