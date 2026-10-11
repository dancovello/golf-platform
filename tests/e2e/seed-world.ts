/**
 * Seeds the two test clubs (the same world as the integration tests) and writes the IDs the
 * browser tests need. Run by tests/e2e/setup.ts through `payload run`.
 */
import { mkdirSync, writeFileSync } from 'node:fs'

import { seedWorld } from '../int/helpers/seed'

const w = await seedWorld()
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
  }),
)
process.exit(0)
