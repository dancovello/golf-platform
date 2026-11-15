import { describe, expect, it } from 'vitest'

import { oldPageWarning, priceListWarnings } from '@/admin/clubAttention'

// The "Needs attention" list (G15, 15 Nov 2026).

const NOW = new Date('2026-12-10T12:00:00Z')
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toISOString()
const page = (layout: unknown[], extra: Record<string, unknown> = {}) => ({
  id: 'p1',
  title: 'Visitors',
  slug: 'visitors',
  updatedAt: '2026-11-01T00:00:00Z',
  layout,
  ...extra,
})
const rates = (sections: Record<string, unknown>[], extra: Record<string, unknown> = {}) => ({
  blockType: 'rateTable',
  heading: 'Green fees',
  tabs: [{ sections }],
  ...extra,
})

describe('price list warnings', () => {
  it('says nothing about undated price lists', () => {
    expect(priceListWarnings([page([rates([{}])])], NOW)).toEqual([])
  })

  it('says nothing while a dated list has plenty of time left, or another follows it', () => {
    const plenty = rates([{ validFrom: day('2026-11-01'), validUntil: day('2027-03-31') }])
    expect(priceListWarnings([page([plenty])], NOW)).toEqual([])
    const followed = rates([
      { validFrom: day('2026-11-01'), validUntil: day('2026-12-20') },
      { validFrom: day('2026-12-21'), validUntil: day('2027-06-30') },
    ])
    expect(priceListWarnings([page([followed])], NOW)).toEqual([])
  })

  it('warns when the only list runs out within 30 days with nothing after it', () => {
    const ending = rates([{ validFrom: day('2026-11-01'), validUntil: day('2026-12-31') }])
    const [w] = priceListWarnings([page([ending])], NOW)
    expect(w.text).toContain('run out on 31 December 2026')
    expect(w.text).toContain('Green fees on “Visitors”')
    expect(w.href).toBe('/admin/collections/pages/p1')
  })

  it('warns when every dated list has already ended, because the table is hidden', () => {
    const ended = rates([{ validFrom: day('2026-04-01'), validUntil: day('2026-10-31') }])
    const [w] = priceListWarnings([page([ended])], NOW)
    expect(w.text).toContain('every dated price list has ended')
  })

  it('ignores other blocks', () => {
    expect(priceListWarnings([page([{ blockType: 'faq' }])], NOW)).toEqual([])
  })
})

describe('pages nobody has edited for a year', () => {
  it('names up to three, oldest first, and counts the rest', () => {
    const pages = [
      page([], { id: 'a', title: 'History', updatedAt: '2025-01-01T00:00:00Z' }),
      page([], { id: 'b', title: 'Contact', updatedAt: '2025-03-01T00:00:00Z' }),
      page([], { id: 'c', title: 'Juniors', updatedAt: '2025-05-01T00:00:00Z' }),
      page([], { id: 'd', title: 'Societies', updatedAt: '2025-07-01T00:00:00Z' }),
      page([], { id: 'e', title: 'Fresh', updatedAt: '2026-11-01T00:00:00Z' }),
    ]
    const warning = oldPageWarning(pages, NOW)!
    expect(warning.text).toBe(
      '4 pages have not been changed for over a year: “History”, “Contact”, “Juniors” and more.',
    )
    expect(oldPageWarning([pages[4]], NOW)).toBeNull()
  })
})
