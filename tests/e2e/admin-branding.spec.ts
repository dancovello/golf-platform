import { expect, openReady, test } from './fixtures'

// Club Settings → Branding: suggested shades and ready-made palettes fill in the colour codes.
test('choosing a suggested shade fills in its code', async ({ editorPage: page, world }) => {
  await openReady(page, `/admin/collections/club-settings/${world.settingsA.id}`)
  const primary = page.getByRole('group', { name: 'Suggested primary colours' })
  await primary.getByRole('button', { name: 'Blues' }).click()
  await primary.getByRole('button', { name: 'Use #1C2D4A' }).click()
  // Payload's own id for the Primary colour box (its label isn't tied to it by name).
  await expect(page.locator('#field-branding__primary')).toHaveValue('#1C2D4A')
})

test('a ready-made palette sets all five colours', async ({ editorPage: page, world }) => {
  await openReady(page, `/admin/collections/club-settings/${world.settingsA.id}`)
  await page.getByRole('button', { name: 'Claret and gold' }).click()
  await expect(page.locator('#field-branding__primary')).toHaveValue('#5A1F2B')
  await expect(page.locator('#field-branding__accent')).toHaveValue('#C2A060')
  await expect(page.locator('#field-branding__dark')).toHaveValue('#1C1512')
})
