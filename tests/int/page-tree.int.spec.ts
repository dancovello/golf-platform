import { beforeAll, describe, expect, it } from 'vitest'

import { loadPageTree, type TreeNode } from '@/admin/pageTreeData'

import { seedWorld, type World } from './helpers/seed'

let w: World

beforeAll(async () => {
  w = await seedWorld()
})

const flat = (nodes: TreeNode[]): TreeNode[] => nodes.flatMap((n) => [n, ...flat(n.children)])

describe('page tree data', () => {
  it("shows only the club's own pages, under their parents, with their status", async () => {
    const parent = await w.payload.create({
      collection: 'pages',
      data: { _status: 'published', title: 'Visitors', slug: 'visitors', tenant: w.clubA.id },
    })
    const child = await w.payload.create({
      collection: 'pages',
      data: {
        _status: 'published',
        title: 'Green fees',
        slug: 'green-fees',
        parent: parent.id,
        tenant: w.clubA.id,
      },
    })
    await w.payload.create({
      collection: 'pages',
      data: { _status: 'draft', title: 'Coming soon', slug: 'coming-soon', tenant: w.clubA.id },
      draft: true,
    })
    // Published, then edited without publishing.
    await w.payload.update({
      collection: 'pages',
      id: child.id,
      data: { title: 'Green fees 2027' },
      draft: true,
    })

    const tree = await loadPageTree(w.payload, w.clubA.id)
    const all = flat(tree)
    const visitors = tree.find((n) => n.slug === 'visitors')
    expect(visitors?.children.map((n) => n.slug)).toEqual(['green-fees'])
    expect(all.find((n) => n.slug === 'green-fees')?.status).toBe('changed')
    expect(all.find((n) => n.slug === 'coming-soon')?.status).toBe('draft')
    expect(all.find((n) => n.slug === 'visitors')?.status).toBe('published')
    expect(JSON.stringify(tree)).not.toContain(w.pageB.title)
    expect(all.some((n) => n.id === w.pageB.id)).toBe(false)
  })
})
