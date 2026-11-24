import { beforeAll, describe, expect, it } from 'vitest'

import { STALE_MESSAGE } from '@/fields/staleSave'

import { seedWorld, type World } from './helpers/seed'

let w: World
const asEditor = (user: World['editorA']) => ({ user, overrideAccess: false as const })

beforeAll(async () => {
  w = await seedWorld()
})

// The edit screen keeps the `openedAt` each save hands back and sends it with the next save
// (src/fields/staleSave.ts). Whatever a save hands back must let the same screen save again.
describe('saving again from the same screen', () => {
  const saveFromScreen = async (openedAt: string | undefined, data: object, draft: boolean) =>
    (await w.payload.update({
      collection: 'pages',
      id: w.pageA.id,
      data: { ...data, openedAt } as never,
      draft,
      ...asEditor(w.editorA),
    })) as { openedAt?: string }

  it('publishing, then carrying on editing, is not refused', async () => {
    const opened = (await w.payload.findByID({
      collection: 'pages',
      id: w.pageA.id,
      draft: true,
      ...asEditor(w.editorA),
    })) as { openedAt?: string }
    expect(opened.openedAt).toBeTruthy()

    const published = await saveFromScreen(
      opened.openedAt,
      { title: 'Published', _status: 'published' },
      false,
    )
    // Autosave after the publish, then publish again, all from the same screen.
    const autosaved = await saveFromScreen(published.openedAt, { title: 'Still editing' }, true)
    const again = await saveFromScreen(
      autosaved.openedAt,
      { title: 'Published again', _status: 'published' },
      false,
    )
    expect(again.openedAt).toBeTruthy()
  })

  it('a screen opened before someone else saved is still refused', async () => {
    const opened = (await w.payload.findByID({
      collection: 'pages',
      id: w.pageA.id,
      draft: true,
      ...asEditor(w.editorA),
    })) as { openedAt?: string }
    await new Promise((r) => setTimeout(r, 5))
    await saveFromScreen(undefined, { title: 'Someone else' }, true)
    await expect(saveFromScreen(opened.openedAt, { title: 'Mine' }, true)).rejects.toThrow(
      STALE_MESSAGE,
    )
  })
})
