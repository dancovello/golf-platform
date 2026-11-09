import { describe, expect, it } from 'vitest'

import { cardRows } from '../../src/site/blocks/cardRows'

describe('cardRows: no card is ever alone on a row on a wide screen', () => {
  it('puts 1 to 3 cards on one line', () => {
    expect(cardRows(1, false)).toBe('cols-1')
    expect(cardRows(2, false)).toBe('cols-2')
    expect(cardRows(3, false)).toBe('cols-3')
  })
  it('puts 4 cards on one line when the style allows, otherwise 2 + 2', () => {
    expect(cardRows(4, true)).toBe('cols-4')
    expect(cardRows(4, false)).toBe('cols-3 cards-2x2')
  })
  it('puts 5 cards as 2 + 3 and 6 as 3 + 3', () => {
    expect(cardRows(5, true)).toBe('cols-3 cards-5')
    expect(cardRows(5, false)).toBe('cols-3 cards-5')
    expect(cardRows(6, false)).toBe('cols-3')
  })
})
