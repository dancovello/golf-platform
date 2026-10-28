import { describe, expect, it } from 'vitest'

import { buildTree, type TreePage } from '@/admin/pageTreeData'

const page = (id: string, extra: Partial<TreePage> = {}): TreePage => ({
  id,
  title: id,
  slug: id.toLowerCase(),
  parentID: null,
  position: null,
  hidden: false,
  status: 'published',
  ...extra,
})

describe('page tree (plan part E)', () => {
  it('puts pages under their parents, home first, then position numbers, then A–Z', () => {
    const tree = buildTree([
      page('Visitors'),
      page('Green fees', { parentID: 'Visitors', position: 2 }),
      page('Societies', { parentID: 'Visitors' }),
      page('Book a tee time', { parentID: 'Visitors', position: 1 }),
      page('About'),
      page('Home', { slug: 'home' }),
    ])
    expect(tree.map((n) => n.title)).toEqual(['Home', 'About', 'Visitors'])
    expect(tree[2].children.map((n) => n.title)).toEqual([
      'Book a tee time',
      'Green fees',
      'Societies',
    ])
  })

  it('a parent that isn’t one of the club’s pages puts the page at the top level', () => {
    const tree = buildTree([page('Orphan', { parentID: 'someone-elses-page' })])
    expect(tree.map((n) => n.title)).toEqual(['Orphan'])
  })

  it('never loops, even if two pages point at each other', () => {
    const tree = buildTree([page('A', { parentID: 'B' }), page('B', { parentID: 'A' })])
    expect(tree).toEqual([])
  })
})
