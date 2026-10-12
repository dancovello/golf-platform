/**
 * Seeds the two test clubs (the same world as the integration tests) and writes the IDs the
 * browser tests need. Run by tests/e2e/setup.ts through `payload run`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'

import { allowAccountCreation } from '@/access/accountCreation'

import { enrolTwoFactor, PASSWORD, seedWorld } from '../int/helpers/seed'

const w = await seedWorld()

// Club A's header and menu, for the public site tests (tests/e2e/site-header.spec.ts).
await w.payload.update({
  collection: 'club-settings',
  id: w.settingsA.id,
  data: {
    branding: { strapline: 'Golf Club · 1926' },
    header: {
      style: 'classic',
      phone: '01932 704 500',
      booking: { label: 'Book a tee time', type: 'url', url: 'https://booking.example.com' },
      menu: [
        {
          label: 'Golf',
          groups: [
            {
              heading: 'Play',
              links: [
                { link: { label: 'Green fees', type: 'url', url: 'https://example.com/fees' } },
                { link: { label: 'Membership', type: 'page', page: w.pageA.id } },
              ],
            },
          ],
        },
        { label: 'Membership', link: { type: 'page', page: w.pageA.id } },
      ],
    },
  } as never,
})

// Two extra club A editors for the two-factor tests: one who hasn't set it up yet, and one
// whose two-factor the super-admin will reset.
const extraEditor = async (email: string, enrol: boolean) => {
  const user = await w.payload.create({
    collection: 'users',
    data: { email, password: PASSWORD, role: 'editor', tenant: w.clubA.id },
    context: allowAccountCreation,
  })
  if (enrol) await enrolTwoFactor(w.payload, user.id)
  return { id: user.id, email }
}
const editorNotSetUp = await extraEditor('editor-not-set-up@example.com', false)
const editorToReset = await extraEditor('editor-to-reset@example.com', true)
// One account per login test: Payload saves a login by writing back the whole account record,
// so two tests logging in as the same account at the same moment can log each other out.
const editorLoginOnly = await extraEditor('editor-login-only@example.com', true)
const editorTypesCode = await extraEditor('editor-types-code@example.com', true)
const editorWrongCode = await extraEditor('editor-wrong-code@example.com', true)
const editorLinkTarget = await extraEditor('editor-link-target@example.com', true)
mkdirSync('tests/e2e/.state', { recursive: true })
writeFileSync(
  'tests/e2e/.state/world.json',
  JSON.stringify({
    clubA: { id: w.clubA.id, name: w.clubA.name },
    clubB: { id: w.clubB.id, name: w.clubB.name },
    superAdmin: { id: w.superAdmin.id, email: w.superAdmin.email },
    editorA: { id: w.editorA.id, email: w.editorA.email },
    editorA2: { id: w.editorA2.id, email: w.editorA2.email },
    editorB: { id: w.editorB.id, email: w.editorB.email },
    pageA: { id: w.pageA.id, title: w.pageA.title },
    pageB: { id: w.pageB.id, title: w.pageB.title },
    settingsA: { id: w.settingsA.id },
    settingsB: { id: w.settingsB.id },
    mediaB: {
      id: w.mediaB.id,
      prefix: w.mediaB.prefix,
      filename: w.mediaB.filename,
      url: w.mediaB.url,
    },
    editorNotSetUp,
    editorToReset,
    editorLoginOnly,
    editorTypesCode,
    editorWrongCode,
    editorLinkTarget,
  }),
)
process.exit(0)
