import { expect, openReady, test } from './fixtures'

// Club Settings → Branding: each colour has a swatch that opens the colour picker.
test('picking a brand colour from the swatch fills in its code', async ({
  editorPage: page,
  world,
}) => {
  await openReady(page, `/admin/collections/club-settings/${world.settingsA.id}`)
  const swatch = page.getByLabel('Pick the primary colour')
  await expect(swatch).toBeVisible()
  await swatch.fill('#336699')
  // Payload's own id for the Primary colour box (its label isn't tied to it by name).
  await expect(page.locator('#field-branding__primary')).toHaveValue('#336699')
})
