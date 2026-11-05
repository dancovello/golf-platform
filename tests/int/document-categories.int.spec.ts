import { beforeAll, describe, expect, it } from 'vitest'

import { newsArchive } from '@/site/news'
import { loadBlockContext } from '@/site/blocks/resolve'

import { pdfFile } from '../shared/media'
import { categoryOf, seedWorld, type World } from './helpers/seed'

let w: World
beforeAll(async () => {
  w = await seedWorld()
}, 120_000)

describe('a document’s category comes from the club’s own list', () => {
  it('the website shows the category’s name, and its place in the list', async () => {
    const ctx = await loadBlockContext(w.payload, w.clubA.id, [
      { blockType: 'documentList', documents: [w.docA.id] },
    ])
    const doc = ctx.document(w.docA.id)
    expect(doc?.categoryName).toBe('Course & scorecards')
    // After the six news categories, in the order they were added.
    expect(doc?.categoryOrder).toBeGreaterThanOrEqual(6)
  })

  it('a renamed category shows its new name', async () => {
    const category = await categoryOf(w.payload, w.clubA.id, 'forms')
    const doc = await w.payload.create({
      collection: 'documents',
      data: { title: 'Renamed category doc', category: category.id, tenant: w.clubA.id },
      file: pdfFile('renamed.pdf'),
    })
    await w.payload.update({
      collection: 'categories',
      id: category.id,
      data: { name: 'Application forms' },
    })
    const ctx = await loadBlockContext(w.payload, w.clubA.id, [
      { blockType: 'documentList', documents: [doc.id] },
    ])
    expect(ctx.document(doc.id)?.categoryName).toBe('Application forms')
  })

  it('an editor can’t file a document under another club’s category', async () => {
    await expect(
      w.payload.update({
        collection: 'documents',
        id: w.docA.id,
        data: { category: w.categoryB.id } as never,
        user: w.editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow()
  })

  it('a category that documents use can’t be removed', async () => {
    const category = await categoryOf(w.payload, w.clubA.id, 'course-scorecards')
    await expect(
      w.payload.delete({
        collection: 'categories',
        id: category.id,
        user: w.editorA,
        overrideAccess: false,
      }),
    ).rejects.toThrow(/document/i)
  })
})

describe('the news page and the shared list', () => {
  it('shows a pill only for categories that have news, not for document-only ones', async () => {
    const archive = await newsArchive(w.clubA.id, { category: null, q: null, page: 1 })
    const slugs = archive.categories.map((c) => c.slug)
    expect(slugs).toContain('club')
    expect(slugs).not.toContain('policies')
    expect(slugs).not.toContain('forms')
    expect(slugs).not.toContain('course-scorecards')
  })
})
