import { describe, expect, it } from 'vitest'

import type { MenuItem } from '@/site/loadClub'
import { dropdownColumns } from '@/site/components/DesktopNav'
import { currentMenuIndex } from '@/site/components/links'

const page = (slug: string) => ({ kind: 'page' as const, slug })
const parent = (label: string, slugs: string[]): MenuItem => ({
  label,
  link: null,
  overview: null,
  image: null,
  children: slugs.map((s) => ({ label: s, link: page(s) })),
})

const base = '/preview/heathcote'
const menu: MenuItem[] = [
  parent('Golf', ['course', 'scorecard']),
  parent('Visitors', ['green-fees', 'contact']),
  { label: 'News', link: page('news'), overview: null, image: null, children: [] },
  parent('About', ['history', 'contact']),
]

describe('current menu item', () => {
  it('marks only the first section when a page sits under two of them', () => {
    expect(currentMenuIndex(menu, base, `${base}/contact`)).toBe(1)
  })

  it('prefers an item that links straight to the page', () => {
    const withDirect = [parent('Club', ['news']), ...menu]
    expect(currentMenuIndex(withDirect, base, `${base}/news`)).toBe(3)
  })

  it('marks nothing when the page is not in the menu', () => {
    expect(currentMenuIndex(menu, base, `${base}/gallery`)).toBe(-1)
  })
})

describe('drop-down columns', () => {
  it('fits up to 6 links a column, at most 3 columns', () => {
    expect([2, 6, 7, 12, 13, 18, 25].map(dropdownColumns)).toEqual([1, 1, 2, 2, 3, 3, 3])
  })
})
