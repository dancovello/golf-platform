import { readFileSync } from 'node:fs'

export type World = {
  clubA: { id: string; name: string }
  clubB: { id: string; name: string }
  superAdmin: { id: string; email: string }
  editorA: { id: string; email: string }
  editorA2: { id: string; email: string }
  editorB: { id: string; email: string }
  pageA: { id: string; title: string }
  pageB: { id: string; title: string }
  homeA: { id: string }
  settingsA: { id: string }
  settingsB: { id: string }
  mediaB: { id: string; prefix: string; filename: string; url: string }
  editorNotSetUp: { id: string; email: string }
  editorToReset: { id: string; email: string }
  editorLoginOnly: { id: string; email: string }
  editorTypesCode: { id: string; email: string }
  editorWrongCode: { id: string; email: string }
  editorLinkTarget: { id: string; email: string }
}

export const STATE_DIR = 'tests/e2e/.state'
export const PASSWORD = 'a-long-test-password'

export const loadWorld = (): World => JSON.parse(readFileSync(`${STATE_DIR}/world.json`, 'utf8'))

/** Anything that would reveal club B or the super-admin to club A's editor. */
export const clubBSecrets = (w: World) => [
  w.clubB.name,
  w.clubB.id,
  w.editorB.email,
  w.editorB.id,
  w.superAdmin.email,
  w.superAdmin.id,
  w.pageB.title,
  w.pageB.id,
  w.settingsB.id,
]
